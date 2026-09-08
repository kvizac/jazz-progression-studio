import { useEffect, useMemo, useRef, useState } from 'react';
import type { Params, TestResult } from './types';
import { buildChart, formName } from './engine';
import { drawChart, exportCanvasPng } from './renderCanvas';
import { startPlayback, type PlaybackHandle } from './audio';
import { exportMidi } from './midi';
import { runAcceptanceTests } from './acceptance';

const KEYS: Params['key'][] = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

const INITIAL: Params = {
  key:'F', type:'blues', preset:'bebop', choruses:1, bpm:142,
  groove:'swing', swing:0.62, strum:true, strumMs:22,
  instrument:'piano', complexity:'extended', color:68, comping:'sparse', seed:1701,
};

type StatusKind = 'ready'|'working'|'success'|'error';
type LogEntry = { time:string; message:string };

function newSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}

function Segmented<T extends string>({value,items,onChange,label}:{value:T;items:{value:T;label:string}[];onChange:(v:T)=>void;label:string}) {
  return <div>
    <div className="label-row"><span>{label}</span></div>
    <div className="segmented" role="group" aria-label={label}>
      {items.map(item=><button key={item.value} className={value===item.value?'active':''} onClick={()=>onChange(item.value)} type="button">{item.label}</button>)}
    </div>
  </div>;
}

export default function App() {
  const [params,setParams] = useState<Params>(INITIAL);
  const [activeBar,setActiveBar] = useState(-1);
  const [status,setStatus] = useState<{kind:StatusKind;text:string}>({kind:'ready',text:'Ready'});
  const [logs,setLogs] = useState<LogEntry[]>([]);
  const [tests,setTests] = useState<TestResult[]>(()=>runAcceptanceTests());
  const [showTests,setShowTests] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const playbackRef = useRef<PlaybackHandle|null>(null);

  const chart = useMemo(()=>buildChart(params),[params]);
  const splitBars = useMemo(()=>chart.bars.filter(b=>b.events.length>1).length,[chart]);

  const log = (message:string) => setLogs(l=>[{time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),message},...l].slice(0,30));
  const update = <K extends keyof Params>(key:K,value:Params[K]) => setParams(p=>({...p,[key]:value}));

  useEffect(()=>{
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => drawChart(canvas,chart,params,activeBar);
    redraw();
    const ro = new ResizeObserver(redraw);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return ()=>ro.disconnect();
  },[chart,params,activeBar]);

  useEffect(()=>()=>playbackRef.current?.stop(),[]);

  const generate = () => {
    playbackRef.current?.stop();
    const seed = newSeed();
    setStatus({kind:'working',text:'Generating a new harmonic path…'});
    setParams(p=>({...p,seed}));
    requestAnimationFrame(()=>{
      setStatus({kind:'success',text:'New progression generated'});
      log(`Generated ${formName(params.type)} variation · seed ${seed}`);
    });
  };

  const play = async () => {
    try {
      playbackRef.current?.stop();
      setStatus({kind:'working',text:'Starting audio…'});
      playbackRef.current = await startPlayback(params,chart,setActiveBar);
      setStatus({kind:'success',text:'Playing'});
      log(`Playback started at ${params.bpm} BPM`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Playback failed.';
      setStatus({kind:'error',text:message}); log(`Playback error: ${message}`);
    }
  };

  const stop = () => {
    playbackRef.current?.stop(); playbackRef.current=null; setActiveBar(-1);
    setStatus({kind:'ready',text:'Stopped'}); log('Playback stopped');
  };

  const midi = () => {
    try { exportMidi(params,chart); setStatus({kind:'success',text:'MIDI exported'}); log('Exported jazz_progression.mid'); }
    catch (error) { const m=error instanceof Error?error.message:'MIDI export failed.';setStatus({kind:'error',text:m});log(`MIDI error: ${m}`); }
  };

  const png = () => {
    try { if(!canvasRef.current) throw new Error('Chart is not ready.'); exportCanvasPng(canvasRef.current); setStatus({kind:'success',text:'Chart PNG exported'}); log('Exported chart PNG'); }
    catch(error){const m=error instanceof Error?error.message:'PNG export failed.';setStatus({kind:'error',text:m});}
  };

  const rerunTests = () => { const r=runAcceptanceTests();setTests(r);log(`Tests: ${r.filter(t=>t.pass).length}/${r.length} passed`); };
  const passed = tests.filter(t=>t.pass).length;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark">J</div><div><strong>Jazz Progression Studio</strong><span>functional harmony · voiced for musicians</span></div></div>
      <div className={`status-pill ${status.kind}`}><i />{status.text}</div>
    </header>

    <main className="workspace">
      <aside className="control-panel">
        <div className="panel-head"><span className="eyebrow">HARMONY ENGINE</span><h1>Build a progression</h1><p>Generate coherent jazz forms, then regenerate for a different but still functional path.</p></div>

        <section className="control-section">
          <div className="label-row"><span>Concert key</span><small>{params.key}</small></div>
          <div className="key-grid">{KEYS.map(k=><button type="button" key={k} className={params.key===k?'active':''} onClick={()=>update('key',k)}>{k}</button>)}</div>
        </section>

        <section className="control-section">
          <label className="field"><span>Progression type</span><select value={params.type} onChange={e=>update('type',e.target.value as Params['type'])}>
            <option value="iivi">ii–V–I · major</option><option value="iimino">iiø–V–i · minor</option><option value="blues">12-Bar Jazz Blues</option><option value="rhythm">Rhythm Changes · AABA</option>
          </select></label>
          <Segmented label="Preset" value={params.preset} onChange={v=>update('preset',v)} items={[{value:'classic',label:'Classic'},{value:'bebop',label:'Bebop / Parker'}]} />
          <Segmented label="Complexity" value={params.complexity} onChange={v=>update('complexity',v)} items={[{value:'triads',label:'Triads'},{value:'sevenths',label:'7ths'},{value:'extended',label:'Extended'}]} />
        </section>

        <section className="control-section">
          <div className="range-field"><div className="label-row"><span>Harmonic color</span><small>{params.color}%</small></div><input aria-label="Harmonic color" type="range" min="0" max="100" value={params.color} onChange={e=>update('color',Number(e.target.value))}/><p className="hint">Higher values favor tonicizations, altered dominants, passing diminished chords and tritone subs.</p></div>
          <div className="two-col">
            <label className="field"><span>Choruses</span><input type="number" min="1" max="10" value={params.choruses} onChange={e=>update('choruses',Math.max(1,Math.min(10,Number(e.target.value)||1)))}/></label>
            <label className="field"><span>Tempo</span><div className="input-suffix"><input type="number" min="40" max="300" value={params.bpm} onChange={e=>update('bpm',Math.max(40,Math.min(300,Number(e.target.value)||140)))}/><b>BPM</b></div></label>
          </div>
        </section>

        <section className="control-section">
          <Segmented label="Groove" value={params.groove} onChange={v=>update('groove',v)} items={[{value:'straight',label:'Straight'},{value:'swing',label:'Swing'}]} />
          {params.groove==='swing'&&<div className="range-field"><div className="label-row"><span>Swing ratio</span><small>{Math.round(params.swing*100)}%</small></div><input aria-label="Swing ratio" type="range" min="60" max="66" value={Math.round(params.swing*100)} onChange={e=>update('swing',Number(e.target.value)/100)}/></div>}
          <Segmented label="Comping" value={params.comping} onChange={v=>update('comping',v)} items={[{value:'sustained',label:'Sustain'},{value:'sparse',label:'Sparse'},{value:'bebop',label:'Bebop'}]} />
          <div className="two-col">
            <label className="field"><span>Instrument</span><select value={params.instrument} onChange={e=>update('instrument',e.target.value as Params['instrument'])}><option value="piano">Piano</option><option value="guitar">Guitar</option><option value="bass">Bass</option></select></label>
            <label className="switch-field"><span><b>Strum</b><small>{params.strum?`${params.strumMs} ms`:'Off'}</small></span><input type="checkbox" checked={params.strum} onChange={e=>update('strum',e.target.checked)}/><i /></label>
          </div>
          {params.strum&&<div className="range-field compact"><input aria-label="Strum milliseconds" type="range" min="10" max="60" value={params.strumMs} onChange={e=>update('strumMs',Number(e.target.value))}/></div>}
        </section>

        <button type="button" className="generate-btn" onClick={generate}><span>Generate variation</span><kbd>↻</kbd></button>
      </aside>

      <section className="content-panel">
        <div className="hero-row">
          <div><span className="eyebrow">CURRENT FORM</span><h2>{params.key} {formName(params.type)}</h2><p>{chart.variantNames.join(' · ')}</p></div>
          <div className="hero-actions"><button className="icon-btn primary" onClick={play} type="button">▶ <span>Play</span></button><button className="icon-btn" onClick={stop} type="button">■ <span>Stop</span></button></div>
        </div>

        <div className="metric-row">
          <div><span>BARS</span><strong>{chart.bars.length}</strong></div><div><span>SPLIT BARS</span><strong>{splitBars}</strong></div><div><span>STYLE</span><strong>{params.preset==='bebop'?'Bebop':'Classic'}</strong></div><div><span>VOICE LEADING</span><strong>3 ↔ 7</strong></div>
        </div>

        <div className="chart-card"><canvas ref={canvasRef} aria-label="Jazz chord chart" /></div>

        <div className="action-strip">
          <div><button type="button" className="export-btn" onClick={midi}><b>MIDI</b><span>Export for Ableton</span></button><button type="button" className="export-btn" onClick={png}><b>PNG</b><span>Save chord chart</span></button></div>
          <button type="button" className="tests-toggle" onClick={()=>setShowTests(v=>!v)}><span className={passed===tests.length?'test-ok':'test-bad'}>{passed}/{tests.length}</span> acceptance tests {showTests?'▲':'▼'}</button>
        </div>

        {showTests&&<div className="tests-panel"><div className="tests-head"><div><b>Built-in acceptance harness</b><span>Source-of-truth checks from the requirements</span></div><button type="button" onClick={rerunTests}>Run again</button></div><div className="tests-grid">{tests.map(t=><div key={t.name} className={t.pass?'pass':'fail'}><i>{t.pass?'✓':'×'}</i><span><b>{t.name}</b><small>{t.detail}</small></span></div>)}</div></div>}

        <div className="lower-grid">
          <div className="info-card"><span className="eyebrow">WHY THIS SOUNDS LIKE JAZZ</span><h3>Function first, color second.</h3><p>The generator preserves cadential targets, then introduces secondary dominants, diminished connectors and substitutions at places where they resolve. Extended voicings prioritize guide tones and choose the closest available shape from chord to chord.</p></div>
          <div className="log-card"><div className="log-head"><b>Activity</b><span>{logs.length} events</span></div><div className="log-list">{logs.length?logs.map((l,i)=><div key={i}><time>{l.time}</time><span>{l.message}</span></div>):<p>No events yet. Generate, play or export something.</p>}</div></div>
        </div>
      </section>
    </main>
  </div>;
}
