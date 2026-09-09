import { Midi } from '@tonejs/midi';
import { parseMidi, writeMidi } from 'midi-file';
import type { Project, Note } from './studio';
import { barCount, chordLabel } from './studio';
export function midiBytes(p:Project,notes:Note[],range:[number,number]=[0,barCount(p.settings)],only:'all'|'chords'|'bass'='all'){
 const m=new Midi(),ppq=m.header.ppq,s=p.settings,start=range[0]*4,end=range[1]*4;
 m.header.name=`Jazz Progression Studio · ${s.key} ${s.mode}`;m.header.setTempo(s.bpm);m.header.timeSignatures.push({ticks:0,timeSignature:[4,4],measures:0});
 p.cells.filter(c=>c.bar>=range[0]&&c.bar<range[1]).forEach(c=>m.header.meta.push({ticks:Math.round((c.bar*4+c.beat-start)*ppq),type:'marker',text:chordLabel(c,s).replaceAll('Δ','maj').replaceAll('♭','b').replaceAll('♯','#').replaceAll('ø','m7b5').replaceAll('°','dim')}));
 for(const name of ['chords','bass'] as const){if(only!=='all'&&only!==name)continue;const ns=notes.filter(n=>n.track===name&&n.beat>=start&&n.beat<end);if(!ns.length)continue;const tr=m.addTrack();tr.name=name==='chords'?'Keys':'Bass';tr.channel=name==='chords'?0:1;tr.instrument.number=name==='bass'?32:s.sound==='electric'?4:s.sound==='guitar'?24:s.sound==='bass'?32:0;
 for(const n of ns)tr.addNote({midi:n.midi,ticks:Math.round((n.beat-start)*ppq),durationTicks:Math.max(1,Math.round(Math.min(n.duration,end-n.beat)*ppq)),velocity:n.velocity});
 tr.endOfTrackTicks=Math.round((end-start)*ppq);
 }
 // @tonejs/midi 2.0.28 ignores Track.endOfTrackTicks while encoding.
 // Pad the real end-of-track event without adding any audible notes.
 const data=parseMidi(m.toArray());
 for(const track of data.tracks){let ticks=0;for(const event of track){if(event.type==='endOfTrack')event.deltaTime=Math.max(0,Math.round((end-start)*ppq)-ticks);ticks+=event.deltaTime;}}
 return new Uint8Array(writeMidi(data));
}
export function download(data:BlobPart,type:string,name:string){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
