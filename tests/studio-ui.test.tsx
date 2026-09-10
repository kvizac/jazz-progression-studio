import { describe,it,expect,vi,afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../src/App';
import { DEFAULT,generate } from '../src/studio';
import { stopAudio } from '../src/studioAudio';
import { Field } from '../src/ui';
afterEach(()=>vi.unstubAllGlobals());
describe('Visible composition controls',()=>{
 it('renders enabled major and minor buttons when a saved rhythm-changes project opens',()=>{
  const saved=JSON.stringify(generate({...DEFAULT,form:'rhythm'}));
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key==='jazz-studio-v6'?saved:null});
  const html=renderToStaticMarkup(<App/>);
  const buttons=html.match(/<button[^>]*>Major<\/button>|<button[^>]*>Minor<\/button>/g)??[];
  expect(buttons).toHaveLength(2);for(const b of buttons)expect(b).not.toContain('disabled');
  expect(html).toContain('Generate new');expect(html).toContain('Suggested replacements');expect(html).toContain('Explain this control');
 });
 it('explains a fully locked project next to Generate and exposes Unlock all',()=>{
  const p=generate(DEFAULT);p.cells.forEach(c=>c.locked=true);
  vi.stubGlobal('localStorage',{getItem:(key:string)=>key==='jazz-studio-v6'?JSON.stringify(p):null});
  const html=renderToStaticMarkup(<App/>);expect(html).toMatch(/<button class="generate" disabled/);expect(html).toContain('Unlock all bars');
 });
 it('associates field labels with the native select and supplies hover help',()=>{
  const html=renderToStaticMarkup(<Field label="Key"><select><option>C</option></select></Field>);
  const id=html.match(/<label for="([^"]+)"/)![1];expect(html).toContain(`id="${id}"`);expect(html).toContain('Transpose the existing progression');
 });
 it('allows editing and stopping before an audio context has been started',()=>{expect(()=>stopAudio()).not.toThrow();});
});
