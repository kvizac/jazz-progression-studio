export type Expression = {
 density:number; syncopation:number; variation:number; gate:number; dynamics:number; pocket:number;
 arp:number; arpRate:1|2|4; arpPattern:'up'|'down'|'pendulum'|'outside'; arpOctaves:1|2;
 rollDirection:'up'|'down'|'alternate'; bassDensity:number; bassGate:number; bassVariation:number;
 bassApproach:number; bassOctaves:number; bassPocket:number; bassDynamics:number;
};
export const EXPRESSION:Expression={density:65,syncopation:65,variation:35,gate:65,dynamics:45,pocket:8,arp:0,arpRate:2,arpPattern:'up',arpOctaves:1,rollDirection:'up',bassDensity:65,bassGate:80,bassVariation:35,bassApproach:55,bassOctaves:25,bassPocket:0,bassDynamics:40};
export const GROOVES={held:'Ballad · sustained',pocket:'Neo-soul · pocket',swing:'Jazz · comping',bossa:'Bossa · syncopated',broken:'Flowing arpeggios',funk:'Funk · sixteenths',gospel:'Gospel · responses',disco:'Disco · offbeats',latin:'Latin · tumbao'};
export const BASSES={off:'Off',roots:'Sustained roots',walking:'Jazz · walking',twofeel:'Jazz · two-feel',soul:'Soul · fingerstyle',funk:'Funk · syncopated',bossa:'Bossa · root / fifth',disco:'Disco · octaves',latin:'Latin · anticipated'};
export type PerformancePreset={name:string;hint:string;settings:Partial<Expression>&{groove:keyof typeof GROOVES;bass:keyof typeof BASSES;swing:number;roll:number;human:number}};
export const PERFORMANCE_PRESETS:PerformancePreset[]=[
 {name:'Neo-soul pocket',hint:'Laid-back keys, space between phrases, fingerstyle bass.',settings:{...EXPRESSION,groove:'pocket',bass:'soul',swing:57,roll:28,human:18,pocket:14,bassPocket:3}},
 {name:'Jazz trio',hint:'Conversational comping over a connected quarter-note bass line.',settings:{...EXPRESSION,groove:'swing',bass:'walking',swing:64,roll:8,human:14,density:55,gate:48,pocket:4,bassGate:91,bassOctaves:10}},
 {name:'After-hours ballad',hint:'Long chords with gentle rolls and a spacious two-feel bass.',settings:{...EXPRESSION,groove:'held',bass:'twofeel',swing:50,roll:65,human:12,gate:94,density:30,dynamics:55,bassDensity:35}},
 {name:'Bossa duo',hint:'A two-bar comping conversation above root-and-fifth bass.',settings:{...EXPRESSION,groove:'bossa',bass:'bossa',swing:50,roll:10,human:10,gate:58,pocket:0,bassGate:72,bassApproach:20}},
 {name:'Funk band',hint:'Short sixteenth-note stabs, syncopated bass and octave accents.',settings:{...EXPRESSION,groove:'funk',bass:'funk',swing:52,roll:4,human:12,gate:24,pocket:0,density:75,bassGate:42,bassOctaves:65}},
 {name:'Gospel soul',hint:'Call-and-response chords with an expressive upper voice.',settings:{...EXPRESSION,groove:'gospel',bass:'soul',swing:55,roll:32,human:16,dynamics:70,variation:60,gate:72}},
 {name:'Disco floor',hint:'Even offbeat keys with a steady octave bass pulse.',settings:{...EXPRESSION,groove:'disco',bass:'disco',swing:50,roll:0,human:7,pocket:0,gate:38,bassOctaves:100,bassApproach:10,bassGate:58}},
 {name:'Latin ensemble',hint:'Anticipated accents and a repeating two-bar bass phrase.',settings:{...EXPRESSION,groove:'latin',bass:'latin',swing:50,roll:8,human:10,pocket:0,gate:52,bassGate:78,bassApproach:30}},
 {name:'Cinematic arpeggio',hint:'An unfolding two-octave figure over sustained bass roots.',settings:{...EXPRESSION,groove:'broken',bass:'roots',swing:50,roll:0,human:10,arp:100,arpPattern:'pendulum',arpOctaves:2,gate:90,density:100,pocket:0}},
];
