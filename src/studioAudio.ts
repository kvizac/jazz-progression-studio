import * as Tone from 'tone';
import type { Note, Project, Settings } from './studio';
import { barCount } from './studio';
let piano:Tone.Sampler|undefined, pianoPromise:Promise<void>|undefined;
let electric:Tone.PolySynth|undefined,bass:Tone.MonoSynth|undefined,click:Tone.Synth|undefined,guitar:Tone.PolySynth|undefined;
let lowKeys:Tone.PolySynth|undefined;
let generation=0, audioInitialized=false;
function ensureSynths(){
 if(!lowKeys)lowKeys=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.007,decay:.2,sustain:.3,release:.2},volume:-17}).toDestination();
 if(!electric)electric=new Tone.PolySynth(Tone.FMSynth,{harmonicity:3,modulationIndex:1.4,oscillator:{type:'sine'},envelope:{attack:.005,decay:.8,sustain:.12,release:.5},modulationEnvelope:{attack:.002,decay:.3,sustain:.05,release:.2},volume:-17}).toDestination();
 if(!guitar)guitar=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.004,decay:.2,sustain:.05,release:.3},volume:-18}).toDestination();
 if(!bass)bass=new Tone.MonoSynth({oscillator:{type:'triangle'},filter:{type:'lowpass',frequency:800,Q:.2},envelope:{attack:.007,decay:.2,sustain:.3,release:.15},filterEnvelope:{attack:.001,decay:.2,sustain:.2,release:.1,baseFrequency:180,octaves:2},volume:-19}).toDestination();
 if(!click)click=new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.001,decay:.035,sustain:0,release:.005},volume:-18}).toDestination();
}
async function ready(sound:Settings['sound']){
 await Tone.start();audioInitialized=true;ensureSynths();
 if(sound!=='piano')return;
 if(!pianoPromise)pianoPromise=new Promise<void>((resolve,reject)=>{
  const timeout=setTimeout(()=>{piano?.dispose();piano=undefined;pianoPromise=undefined;reject(Error('Piano samples could not load. Choose Electric keys and press Play, or retry when connected.'));},20000);
  piano=new Tone.Sampler({urls:{C2:'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',A2:'A2.mp3',C3:'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',A3:'A3.mp3',C4:'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',A4:'A4.mp3',C5:'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',A5:'A5.mp3',C6:'C6.mp3'},baseUrl:`${import.meta.env.BASE_URL}piano/`,release:.65,volume:-10,onload:()=>{clearTimeout(timeout);resolve();},onerror:()=>{clearTimeout(timeout);piano?.dispose();piano=undefined;pianoPromise=undefined;reject(Error('Piano samples are unavailable. Choose Electric keys to continue.'));}}).toDestination();
 });
 await pianoPromise;
}
function trigger(n:Note,sound:Settings['sound'],time:number,seconds:number){
 const pitch=Tone.Frequency(n.midi,'midi').toFrequency();
 if(n.track==='bass')bass!.triggerAttackRelease(pitch,seconds,time,n.velocity);
 else if(sound==='piano')piano!.triggerAttackRelease(pitch,seconds,time,n.velocity);
 else if(sound==='guitar')guitar!.triggerAttackRelease(pitch,seconds,time,n.velocity);
 else if(sound==='bass')lowKeys!.triggerAttackRelease(pitch,seconds,time,n.velocity);
 else electric!.triggerAttackRelease(pitch,seconds,time,n.velocity);
}
export function stopAudio(){generation++;if(!audioInitialized)return;const t=Tone.getTransport();t.stop();t.cancel();t.position=0;piano?.releaseAll();electric?.releaseAll();guitar?.releaseAll();lowKeys?.releaseAll();bass?.triggerRelease();}
export async function audition(notes:number[],s:Settings){const token=generation;await ready(s.sound);if(token!==generation)return;const now=Tone.now()+.03;notes.forEach((midi,i)=>trigger({midi,beat:0,duration:1,velocity:.76,track:'chords',cellId:''},s.sound,now+i*.003,.85));}
export async function playProject(p:Project,notes:Note[],range:[number,number],onBeat:(b:number)=>void,onEnd:()=>void,liveNotes?:()=>Note[]){
 stopAudio();const token=generation;await ready(p.settings.sound);if(token!==generation)return false;
 const s=p.settings,t=Tone.getTransport(),start=range[0]*4,end=Math.min(range[1]*4,barCount(s)*4),length=end-start,spb=60/s.bpm,count=s.countIn?4:0;
 t.bpm.value=s.bpm;t.swing=0;t.timeSignature=4;t.loop=s.loop;t.loopStart=count*spb;t.loopEnd=(count+length)*spb;
 if(count)for(let b=0;b<4;b++)t.schedule(time=>{click!.triggerAttackRelease(b===0?1600:1000,.025,time,.7);Tone.getDraw().schedule(()=>onBeat(-4+b),time);},b*spb);
 // Snapshot each bar, but trigger in small windows so Stop cancels promptly.
 let currentNotes=notes;
 for(let b=0;b<length;b+=.125)t.schedule(time=>{
  if(b%4===0)currentNotes=liveNotes?liveNotes():notes;
  const windowStart=start+b,windowEnd=Math.min(windowStart+.125,end);
  for(const n of currentNotes){if(n.beat<windowStart||n.beat>=windowEnd)continue;trigger(n,s.sound,time+(n.beat-windowStart)*spb,Math.min(n.duration,end-n.beat)*spb);}
 },(count+b)*spb);
 for(let b=0;b<length;b+=.25)t.schedule(time=>{if(s.click&&Number.isInteger(b))click!.triggerAttackRelease(b%4===0?1600:1000,.025,time,.6);Tone.getDraw().schedule(()=>{if(token===generation)onBeat(start+b);},time);},(count+b)*spb);
 if(!s.loop)t.schedule(time=>Tone.getDraw().schedule(()=>{if(token===generation){t.stop();onEnd();}},time),(count+length)*spb);
 t.start('+0.08');return true;
}
