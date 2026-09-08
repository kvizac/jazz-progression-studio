import type { Params, TestResult } from './types';
import { buildChart } from './engine';
import { parseRomanToken } from './theory';

function p(overrides: Partial<Params>): Params {
  return {
    key:'C', type:'iivi', standardForm:false, preset:'classic', choruses:1, bpm:140, groove:'swing', swing:0.62,
    strum:false, strumMs:22, instrument:'piano', complexity:'sevenths', color:0, comping:'sustained', metronome:true, seed:12345,
    ...overrides,
  };
}

export function runAcceptanceTests(): TestResult[] {
  const out: TestResult[] = [];

  {
    const labels = buildChart(p({key:'C',type:'iivi'})).bars.map(b=>b.label);
    const expected = ['Dm7','G7','CΔ7','CΔ7'];
    out.push({name:'C ii–V–I (7ths)',pass:labels.join('|')===expected.join('|'),detail:labels.join(' · ')});
  }
  {
    const labels = buildChart(p({key:'F',type:'blues'})).bars.map(b=>b.label);
    out.push({name:'F Classic Blues bars 6/8/12',pass:labels[5]==='B°7'&&labels[7]==='D7'&&labels[11]==='C7',detail:`6=${labels[5]}, 8=${labels[7]}, 12=${labels[11]}`});
  }
  {
    const labels = buildChart(p({key:'Bb',type:'rhythm'})).bars.slice(0,8).map(b=>b.label);
    const expected = ['BbΔ6','G7','Cm7','F7','BbΔ6','G7','Cm7','F7'];
    out.push({name:'Bb Rhythm Changes first 8',pass:labels.join('|')===expected.join('|'),detail:labels.join(' · ')});
  }
  {
    const labels = buildChart(p({key:'Eb',type:'blues'})).bars.map(b=>b.label).join(' ');
    out.push({name:'Eb uses flat enharmonics',pass:labels.includes('Ab7')&&!labels.includes('G#7'),detail:labels});
  }
  {
    const labels = buildChart(p({key:'D',type:'iimino',complexity:'extended'})).bars.map(b=>b.label);
    out.push({name:'Minor iiø–V–i extended cadence',pass:labels[0]==='Eø7'&&labels[1]==='A7alt'&&labels[2]==='D-Δ',detail:labels.join(' · ')});
  }
  {
    const chart = buildChart(p({type:'rhythm',choruses:3}));
    out.push({name:'Choruses repeat whole form',pass:chart.bars.length===96,detail:`${chart.bars.length} bars`});
  }
  {
    const chord = parseRomanToken('subV/I','C','major','extended');
    out.push({name:'Tritone substitute spelling',pass:chord.symbol==='Db7',detail:chord.symbol});
  }
  {
    const chord = parseRomanToken('V7/ii','C','major','extended');
    out.push({name:'Secondary dominant V7/ii',pass:chord.symbol==='A7',detail:chord.symbol});
  }
  {
    const chord = parseRomanToken('bVII13','C','major','extended');
    out.push({name:'Modal-interchange spelling bVII',pass:chord.symbol==='Bb13',detail:chord.symbol});
  }
  {
    const labels = buildChart(p({key:'F',type:'blues',preset:'bebop',complexity:'sevenths',color:0})).bars.map(b=>b.label);
    const expected = ['F7','Bb7','F7','D7','Gm7','C7','F7','D7','Gm7','C7','F7  |  D7','Gm7  |  C7'];
    out.push({name:'Bebop Blues ground-truth preset',pass:labels.join('|')===expected.join('|'),detail:labels.join(' · ')});
  }
  {
    const chart = buildChart(p({key:'Bb',type:'rhythm',preset:'bebop',complexity:'sevenths',color:0}));
    const bridge = chart.bars.slice(16,24).map(b=>b.label);
    const expectedBridge = ['D7','G7','C7','F7','D7','G7','C7','F7'];
    const hasPassing = chart.bars.slice(0,8).some(b=>b.label.includes('°7'));
    out.push({name:'Parker Rhythm preset keeps dominant bridge',pass:bridge.join('|')===expectedBridge.join('|')&&hasPassing,detail:bridge.join(' · ')});
  }
  {
    const chart = buildChart(p({key:'F',type:'blues',preset:'bebop',complexity:'extended',color:100,seed:29}));
    const splitCount = chart.bars.filter(b=>b.events.length===2).length;
    out.push({name:'Bebop blues has harmonic motion',pass:splitCount>=4,detail:`${splitCount} split bars · ${chart.variantNames[0]}`});
  }
  {
    const chart = buildChart(p({key:'Bb',type:'rhythm',preset:'bebop',complexity:'extended',color:100,choruses:3,seed:41}));
    const names = chart.variantNames;
    const varied = names.every((n,i)=>i===0||n!==names[i-1]);
    out.push({name:'Extended choruses avoid immediate repeats',pass:varied,detail:names.join(' → ')});
  }
  {
    const chart=buildChart(p({key:'Bb',standardForm:true,type:'rhythm',complexity:'extended',color:56,seed:1701}));
    const sections=[...new Set(chart.bars.map(b=>b.section))];
    out.push({name:'v3 standard form is 32 bars',pass:chart.bars.length===32&&chart.formLength===32,detail:`${chart.bars.length} bars · ${sections.join('-')}`});
  }
  {
    const chart=buildChart(p({key:'Bb',standardForm:true,type:'rhythm',complexity:'extended',color:62,seed:9917}));
    const routes=chart.tonalCenters??[];
    const hasContrast=routes.some(r=>r.section==='B'&&new Set(r.centers).size>=3);
    out.push({name:'v3 standard plans contrasting tonal centers',pass:routes.length===4&&hasContrast,detail:routes.map(r=>`${r.section}:${r.centers.join('>')}`).join(' · ')});
  }
  {
    const chart=buildChart(p({key:'C',standardForm:true,type:'rhythm',complexity:'sevenths',color:58,seed:4711}));
    const sectionNames=[...new Set(chart.bars.map(b=>b.section))];
    const formOK=chart.variantNames[0].startsWith('AABA')||chart.variantNames[0].startsWith('ABAC');
    out.push({name:'v3 standard chooses AABA or ABAC',pass:formOK&&sectionNames.length===4,detail:chart.variantNames[0]});
  }
  return out;
}
