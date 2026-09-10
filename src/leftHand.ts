import type { Cell,Settings } from './studio';
import { INTERVALS } from './studio';
// Keep a comfortable lower-middle register with bass, and supply the foundation
// only when there is no bass. Two-note grips avoid crowded low triads.
export function handVoicings(c:Cell,s:Settings,previous:number[]):{right:number[];left:number[]}{
 if(s.leftHand==='off')return {right:c.notes,left:[]};
 let right=[...c.notes].sort((a,b)=>a-b);
 if(!c.locked){right=right.filter(n=>n>=right[right.length-1]-14).slice(-4);const shift=Math.max(0,Math.ceil((60-right[0])/12))*12;if(right[right.length-1]+shift<=108)right=right.map(n=>n+shift);}
 const intervals=INTERVALS[c.chord.quality],withBass=s.bass!=='off';
 const rootShape=s.leftHand==='root-fifth'||s.leftHand==='auto'&&!withBass;
 const third=intervals.find(i=>i===3||i===4||i===5)??intervals[1];
 const seventh=intervals.find(i=>i===10||i===11)||intervals.find(i=>i===9)||intervals.find(i=>i===6||i===7||i===8)||0;
 const pcs=rootShape?[c.bassPc,(c.chord.rootPc+(intervals.find(i=>i===6||i===7||i===8)??third))%12]:[(c.chord.rootPc+third)%12,(c.chord.rootPc+seventh)%12];
 const lo=withBass?46:36,hi=Math.min(withBass?60:55,right[0]-1),options:number[][]=[];
 for(let a=lo;a<=hi;a++)for(let b=a+3;b<=Math.min(hi,a+12);b++)if(pcs.includes(a%12)&&pcs.includes(b%12)&&a%12!==b%12)options.push([a,b]);
 if(!options.length)for(let a=lo;a<=hi;a++)if(pcs.includes(a%12))options.push([a]);
 const center=withBass?53:44;
 const score=(v:number[])=>Math.abs(v.reduce((a,b)=>a+b,0)/v.length-center)*.7+v.reduce((sum,n,i)=>sum+(previous.length?Math.abs(n-previous[Math.min(i,previous.length-1)]):0),0);
 options.sort((a,b)=>score(a)-score(b));
 return {right,left:options[0]??[]};
}
