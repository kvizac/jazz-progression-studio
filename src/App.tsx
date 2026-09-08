import { useEffect, useMemo, useRef, useState } from 'react';
import type { Params, TestResult } from './types';
import { buildChart, formName } from './engine';
import { drawChart, exportCanvasPng } from './renderCanvas';
import { startPlayback, type PlaybackHandle } from './audio';
import { exportMidi } from './midi';
import { runAcceptanceTests } from './acceptance';
import { APP_VERSION, ENGINE_LABEL } from './version';

const KEYS: Params['key'][] = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

const INITIAL: Params = {
  key:'Bb', type:'rhythm', standardForm:true, preset:'classic', choruses:1, bpm:136,
  groove:'swing', swing:0.62, strum:false, strumMs:10,
  instrument:'piano', complexity:'extended', color:56, comping:'sparse', metronome:true, seed:1701,
};

type StatusKind = 'ready'|'working'|'success'|'error';
type LogEntry = { time:string; message:string };
type ProgressionChoice = 'standard'|Params['type'];

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
  const firstChorusCenters = useMemo(()=>chart.tonalCenters?.filter(c=>c.chorus===0) ?? [],[chart]);
  const progressionChoice: ProgressionChoice = params.standardForm ? 'standard' : params.type;
  const structuralForm = params.standardForm
    ? (chart.variantNames[0]?.startsWith('ABAC') ? 'ABAC' : 'AABA')
    : params.preset==='bebop' ? 'Bebop' : 'Classic';

  const log = (message:string) => setLogs(l=>[{time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}),message},...l].slice(0,30));
  const update = <K extends keyof Params>(key:K,value:Params[K]) => setParams(p=>({...p,[key]:value}));
  const selectProgression = (value:ProgressionChoice) => {
    playbackRef.current?.stop();
    if(value==='standard') setParams(p=>({...p,standardForm:true}));
    else setParams(p=>({...p,standardForm:false,type:value}));
  };

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
    setStatus({kind:'working',text:'Planning form, tonal centers and complete phrases…'});
    setParams(p=>({...p,seed}));
    requestAnimationFrame(()=>{
      setStatus({kind:'success',text:'New harmonic route generated'});
      log(`Generated ${formName(params.type,params.standardForm)} · seed ${seed}`);
    });
  };

  const play = async () => {
    try {
      playbackRef.current?.stop();
      setStatus({kind:'working',text:params.instrument==='piano'?'Loading Yamaha C5 piano samples…':'Starting audio…'});
      playbackRef.current = await startPlayback(params,chart,setActiveBar);
      setStatus({kind:'success',text:params.metronome?'Playing with metronome':'Playing'});
      log(`Playback started at ${params.bpm} BPM · ${params.metronome?'click on':'click off'}`);
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
      <div className="brand"><div className="brand-mark">J</div><div><strong>Jazz Progression Studio</strong><span>form grammar · playable voicings · sampled piano</span></div></div>
      <div className="topbar-right">
        <div className="version-badge"><b>v{APP_VERSION}</b><span>{ENGINE_LABEL}</span></div>
        <div className={`status-pill ${status.kind}`}><i />{status.text}</div>
      </div>
    </header>

    <main className="workspace">
      <aside className="control-panel">
        <div className="panel-head"><span className="eyebrow">VALIDATED STANDARD ENGINE</span><h1>Build a progression</h1><p>Choose the form and tonal route first, realize complete eight-bar harmonic sentences, then voice them as playable jazz-piano chords.</p></div>

        <section className="control-section">
          <div className="label-row"><span>Concert key</span><small>{params.key}</small></div>
          <div className="key-grid">{KEYS.map(k=><button type="button" key={k} className={params.key===k?'active':''} onClick={()=>update('key',k)}>{k}</button>)}</div>
        </section>

        <section className="control-section">
          <label className="field"><span>Progression type</span><select value={progressionChoice} onChange={e=>selectProgression(e.target.value as ProgressionChoice)}>
            <option value="standard">Jazz Standard · 32 bars</option>
            <option value="iivi">ii–V–I · major</option><option value="iimino">iiø–V–i · minor</option><option value="blues">12-Bar Jazz Blues</option><option value="rhythm">Rhythm Changes · AABA</option>
          </select></label>
          <Segmented label="Language" value={params.preset} onChange={v=>update('preset',v)} items={[{value:'classic',label:'Classic'},{value:'bebop',label:'Bebop'}]} />
          <Segmented label="Chord detail" value={params.complexity} onChange={v=>update('complexity',v)} items={[{value:'triads',label:'Triads'},{value:'sevenths',label:'7ths'},{value:'extended',label:'Extended'}]} />
        </section>

        <section className="control-section">
          <div className="range-field"><div className="label-row"><span>Harmonic distance</span><small>{params.color}%</small></div><input aria-label="Harmonic distance" type="range" min="0" max="100" value={params.color} onChange={e=>update('color',Number(e.target.value))}/><p className="hint">Controls temporary key centers and chromatic routes. It no longer just adds altered dominants to an otherwise identical progression.</p></div>
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
            <label className="switch-field"><span><b>Metronome</b><small>{params.metronome?'Quarter-note click':'Off'}</small></span><input type="checkbox" checked={params.metronome} onChange={e=>update('metronome',e.target.checked)}/><i /></label>
          </div>
          <div className="two-col">
            <label className="switch-field"><span><b>Strum</b><small>{params.strum?`${params.strumMs} ms`:'Off'}</small></span><input type="checkbox" checked={params.strum} onChange={e=>update('strum',e.target.checked)}/><i /></label>
            <div className="audio-note"><b>REAL PIANO</b><small>Recorded Yamaha C5 · Salamander</small></div>
          </div>
          {params.strum&&<div className="range-field compact"><input aria-label="Strum milliseconds" type="range" min="5" max={params.instrument==='piano'?20:60} value={Math.min(params.strumMs,params.instrument==='piano'?20:60)} onChange={e=>update('strumMs',Number(e.target.value))}/></div>}
        </section>

        <button type="button" className="generate-btn" onClick={generate}><span>Generate new form</span><kbd>↻</kbd></button>
      </aside>

      <section className="content-panel">
        <div className="hero-row">
          <div><span className="eyebrow">CURRENT FORM · ENGINE v{APP_VERSION}</span><h2>{params.key} {formName(params.type,params.standardForm)}</h2><p>{chart.variantNames.join(' · ')}</p></div>
          <div className="hero-actions"><button className="icon-btn primary" onClick={play} type="button">▶ <span>Play</span></button><button className="icon-btn" onClick={stop} type="button">■ <span>Stop</span></button></div>
        </div>

        {firstChorusCenters.length>0&&<div className="route-strip" aria-label="Tonal-center plan">
          {firstChorusCenters.map((route,i)=><div key={`${route.section}-${i}`}><b>{route.section}</b><span>{route.centers.join(' → ')}</span></div>)}
        </div>}

        <div className="metric-row">
          <div><span>BARS</span><strong>{chart.bars.length}</strong></div><div><span>SPLIT BARS</span><strong>{splitBars}</strong></div><div><span>FORM</span><strong>{structuralForm}</strong></div><div><span>VOICE LEADING</span><strong>3 ↔ 7</strong></div>
        </div>

        <div className="chart-card"><canvas ref={canvasRef} aria-label="Jazz chord chart" /></div>

        <div className="action-strip">
          <div><button type="button" className="export-btn" onClick={midi}><b>MIDI</b><span>Export for Ableton</span></button><button type="button" className="export-btn" onClick={png}><b>PNG</b><span>Save chord chart</span></button></div>
          <button type="button" className="tests-toggle" onClick={()=>setShowTests(v=>!v)}><span className={passed===tests.length?'test-ok':'test-bad'}>{passed}/{tests.length}</span> acceptance tests {showTests?'▲':'▼'}</button>
        </div>

        {showTests&&<div className="tests-panel"><div className="tests-head"><div><b>Built-in acceptance harness</b><span>Original forms plus structural checks; CI additionally validates 240 generated standards</span></div><button type="button" onClick={rerunTests}>Run again</button></div><div className="tests-grid">{tests.map(t=><div key={t.name} className={t.pass?'pass':'fail'}><i>{t.pass?'✓':'×'}</i><span><b>{t.name}</b><small>{t.detail}</small></span></div>)}</div></div>}

        <div className="lower-grid">
          <div className="info-card"><span className="eyebrow">WHY v4 IS DIFFERENT</span><h3>Complete phrases, playable voicings, anchored rhythm.</h3><p>A sections now come from complete eight-bar harmonic families with first, second and final endings, so valid fragments cannot be glued together at a bad harmonic boundary. Piano chords are forced to full guide-tone voicings instead of falling back to a single root. Every chord change is sounded exactly on its harmonic beat; syncopated comping can occur only after that anchor. The CI quality gate generates 240 standards across all 12 keys before deployment.</p></div>
          <div className="log-card"><div className="log-head"><b>Activity</b><span>{logs.length} events</span></div><div className="log-list">{logs.length?logs.map((l,i)=><div key={i}><time>{l.time}</time><span>{l.message}</span></div>):<p>No events yet. Generate, play or export something.</p>}</div></div>
        </div>
      </section>
    </main>
  </div>;
}
