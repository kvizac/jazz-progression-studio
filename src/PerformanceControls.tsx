import { Field,Slider } from './ui';
import type { Settings } from './studio';
import { BASSES, GROOVES, PERFORMANCE_PRESETS } from './performanceSettings';
type Props={s:Settings;patch:(p:Partial<Settings>)=>void};
export function PerformanceControls({s,patch}:Props){
 const slider=(key:keyof Settings,label:string,min=0,max=100,unit='%')=><Slider key={key} label={label} value={s[key] as number} min={min} max={max} unit={unit} onChange={v=>patch({[key]:v})}/>;
 const select=(key:keyof Settings,label:string,options:Record<string,string>)=><Field label={label}><select value={String(s[key])} onChange={e=>patch({[key]:['arpRate','arpOctaves'].includes(key)?+e.target.value:e.target.value})}>{Object.entries(options).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>;
 const preset=PERFORMANCE_PRESETS.findIndex(p=>Object.entries(p.settings).every(([k,v])=>s[k as keyof Settings]===v));
 return <div className="performance-controls">
 <Field label="Band performance"><select value={preset<0?'custom':preset} onChange={e=>{if(e.target.value!=='custom')patch(PERFORMANCE_PRESETS[+e.target.value].settings);}}><option value="custom" disabled>Custom performance</option>{PERFORMANCE_PRESETS.map((p,i)=><option value={i} key={p.name}>{p.name}</option>)}</select></Field>
 <p className="performance-hint">{preset<0?'Your own combination of keyboard and bass phrasing.':PERFORMANCE_PRESETS[preset].hint}</p>
 <p className="performance-live">Tweak while playing · changes enter next bar.</p>
 {s.sound==='electric'&&<details open><summary>Electric piano tone</summary>{slider('tremoloDepth','Tremolo depth')}{slider('tremoloRate','Tremolo speed',1,8,' Hz')}<p className="performance-hint">Warm tine-style electric piano. Tremolo is a preview effect; add tremolo to your electric-piano instrument in Ableton.</p></details>}
 <details open><summary>Left hand</summary>{select('leftHand','Left-hand style',{auto:'Auto · follow the band',shells:'Shells · thirds & sevenths','root-fifth':'Root support · fifths / thirds',broken:'Broken shells',off:'Off'})}{s.leftHand!=='off'&&<>{slider('leftDensity','Left-hand activity')}{slider('leftLevel','Left-hand level')}{slider('leftGate','Left-hand note length')}<p className="performance-hint">A quieter, independent supporting part. Both hands export together on the Keys MIDI track. Locked right-hand notes keep their register.</p></>}</details>
 <details open><summary>Keyboard rhythm</summary>
 {select('groove','Playing style',GROOVES)}
 {slider('density','Density')}{slider('syncopation','Syncopation')}{slider('variation','Phrase variation')}{slider('gate','Note length')}
 </details>
 <details><summary>Rolls & arpeggios</summary>
 {slider('roll','Chord roll',0,100,' ms')}{select('rollDirection','Roll direction',{up:'Low → high',down:'High → low',alternate:'Alternate hands'})}
 {slider('arp','Arpeggiated chords')}{select('arpRate','Arpeggio rate',{'1':'Quarter notes','2':'Eighth notes','4':'Sixteenth notes'})}{select('arpPattern','Arpeggio shape',{up:'Ascending',down:'Descending',pendulum:'Up and down',outside:'Outside inward'})}{select('arpOctaves','Arpeggio range',{'1':'Voiced register','2':'Two octaves'})}
 <p className="performance-hint">Arpeggiated chords sets the share of chords played one note at a time. Flowing arpeggios always uses this mode. Density adds rests.</p>
 </details>
 <details><summary>Keyboard expression</summary>
 {slider('swing','Swing',50,75)}{slider('pocket','Push / lay back',-30,30,' ms')}{slider('dynamics','Dynamic expression')}{slider('human','Timing variation')}
 <p className="performance-hint">Negative timing pushes ahead; positive timing sits behind. Strong beats and the top voice lead the dynamics.</p>
 </details>
 <details open><summary>Bass player</summary>
 <p className="performance-hint">Smooth electric bass guitar · sampled fingerstyle tone.</p>{select('bass','Bass style',BASSES)}
 {s.bass!=='off'&&<>{slider('bassDensity','Bass density')}{slider('bassGate','Bass note length')}{slider('bassVariation','Fills & variation')}
 <details><summary>Bass expression</summary>{slider('bassApproach','Approach notes')}{slider('bassOctaves','Octave accents')}{slider('bassPocket','Bass push / lay back',-30,30,' ms')}{slider('bassDynamics','Bass dynamics')}
 <p className="performance-hint">Approach notes lead into the next chord. Octaves shape soul, funk and disco; walking bass prioritizes stepwise movement.</p></details></>}
 </details>
 </div>;
}
