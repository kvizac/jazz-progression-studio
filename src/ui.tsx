import { cloneElement,isValidElement,useEffect,useId,useRef,useState } from 'react';
import type { ReactNode,ReactElement } from 'react';
import { createPortal } from 'react-dom';
export const HELP:Record<string,string>={
 Key:'Transpose the existing progression to another key. Your chord shapes and edits move together.',
 Tonality:'Choose major or minor in any form. New harmony follows this tonality; locked bars keep their existing chords.',
 'Harmonic language':'Choose the harmonic vocabulary: jazz turnarounds, modern colors or soul movement. Locked bars stay in place.',
 Form:'Choose a free phrase, a 32-bar AABA form, 12-bar jazz blues or rhythm changes. Each supports new variations and major or minor tonality.',
 'Chord vocabulary':'Triads have three tones; sevenths add harmonic identity; extensions add ninths, elevenths and thirteenths.',
 'Chromatic color':'More borrowed colors and altered dominants in producer phrases and AABA. Blues and rhythm changes use their own form-specific vocabulary.',
 Sound:'Choose the preview instrument. Grand piano loads real samples; the other sounds are synthesized. MIDI remains editable in your DAW.',
 Voicing:'Compact keeps notes close. Open/drop 2 spreads them. Rootless leaves space for the separate bass. Locked notes are preserved.',
 'Band performance':'Apply a matched keyboard and bass preset without replacing your chords. Adjust any slider to make it your own.',
 'Playing style':'Choose the keyboard rhythm. Motifs follow bar lines, even when a bar contains several chords.',
 Density:'Fewer or more keyboard attacks. Sustained chords stay spacious; arpeggios use this control for rests.',
 Syncopation:'Higher values retain more offbeat accents; lower values pull chord hits onto whole beats. Arpeggios follow their own rate.',
 'Phrase variation':'Allow extra responses and fills near the end of four-bar phrases. The same saved idea always renders the same performance.',
 'Note length':'Shorter values give clipped stabs. Higher values hold notes toward the next attack.',
 'Chord roll':'Spread a chord’s notes over 0–100 milliseconds. This creates a gentle hand roll or a strummed attack.',
 'Roll direction':'Play low notes first, high notes first, or alternate direction between chord attacks.',
 'Arpeggiated chords':'The percentage of chords played one note at a time. Flowing arpeggios always uses this mode.',
 'Arpeggio rate':'Quarter, eighth or sixteenth-note spacing. Swing and density further shape the rhythm.',
 'Arpeggio shape':'Choose ascending, descending, up-and-down, or alternating outside voices.',
 'Arpeggio range':'Use the edited chord register, or include its notes an octave higher.',
 Swing:'50% is straight. Higher values delay offbeat eighths. Bossa and Latin patterns stay straight.',
 'Push / lay back':'Shift keyboard attacks up to 30 ms early or late. Attacks stay inside their chord boundary.',
 'Dynamic expression':'Increase differences in velocity. Strong beats and the highest chord voice receive more emphasis.',
 'Timing variation':'Add small, repeatable timing differences to both players without moving notes outside their chord.',
 'Bass style':'Choose a genre-specific line following your chords and any custom bass notes. Off removes the bass part.',
 'Bass density':'Change the number of bass attacks. Sustained roots intentionally remain sparse.',
 'Bass note length':'Short gives a muted feel; long connects notes. Bass notes never overlap.',
 'Fills & variation':'Add chord-tone movement and phrase-ending fills to the bass line.',
 'Approach notes':'Let the last bass note lead chromatically into the next chord, including across the loop boundary.',
 'Octave accents':'Add higher root accents to soul and funk, or control the octave pattern in disco. Walking favors stepwise movement.',
 'Bass push / lay back':'Place the bass up to 30 ms ahead of or behind the grid independently of the keyboard.',
 'Bass dynamics':'Adjust bass velocity accents and subtle loudness variation.',
 Root:'Change the root of the selected chord. Its quality stays selected and the voicing is rebuilt.',
 'Bass note':'Set a slash-chord bass note independently of the chord root.',
 'Chord quality':'Change the selected chord’s harmonic color. Use the suggestions below to try a different root.',
 'MIDI content':'Performance contains the rhythm, rolls, arpeggios and dynamics you see. Blocks exports clean sustained chords on the grid.',
 Tracks:'Export both parts or just Keys or Bass. Preview mute buttons do not remove notes from your export.',
};
export function Hint({text}:{text:string}){
 const id=useId(),ref=useRef<HTMLButtonElement>(null),[open,setOpen]=useState(false),[pos,setPos]=useState({left:0,top:0});
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const hide=()=>{timer.current=setTimeout(()=>setOpen(false),180);};
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const show=()=>{clearTimeout(timer.current);const rect=ref.current?.getBoundingClientRect();if(rect)setPos({left:Math.max(12,Math.min(rect.left-130,window.innerWidth-292)),top:Math.max(12,Math.min(rect.bottom+10,window.innerHeight-155))});setOpen(true);};
 return <span className="hint-wrap" onMouseEnter={show} onMouseLeave={hide}><button ref={ref} className="hint-button" type="button" aria-label="Explain this control" aria-describedby={open?id:undefined} onFocus={show} onBlur={()=>setOpen(false)} onClick={show} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);e.stopPropagation();}}}>?</button>{open&&createPortal(<span role="tooltip" id={id} className="hint-popover" style={pos} onMouseEnter={()=>{clearTimeout(timer.current);setOpen(true);}} onMouseLeave={hide}>{text}</span>,document.body)}</span>;
}
export function Field({label,children,help}:{label:string;children:ReactNode;help?:string}){
 const id=useId();return <div className="field"><div className="field-label"><label htmlFor={id}>{label}</label>{(help||HELP[label])&&<Hint text={help||HELP[label]}/>}</div>{isValidElement(children)?cloneElement(children as ReactElement<{id?:string;title?:string}>,{id,title:help||HELP[label]}):children}</div>;
}
export function Slider({label,value,max=100,min=0,unit='',onChange}:{label:string;value:number;max?:number;min?:number;unit?:string;onChange:(n:number)=>void}){
 const id=useId();return <div className="slider"><div className="field-label"><label htmlFor={id}>{label}</label>{HELP[label]&&<Hint text={HELP[label]}/>}<output htmlFor={id}>{value}{unit}</output></div><input id={id} title={HELP[label]} type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}/></div>;
}
