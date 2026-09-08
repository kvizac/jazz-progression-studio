import type { GeneratedChart, Params } from './types';
import { formName } from './engine';

const DPR_CAP = 2;

function roundedRect(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number, r:number) {
  const rr = Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.arcTo(x+w,y,x+w,y+h,rr);
  ctx.arcTo(x+w,y+h,x,y+h,rr);
  ctx.arcTo(x,y+h,x,y,rr);
  ctx.arcTo(x,y,x+w,y,rr);
  ctx.closePath();
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, start: number, min: number): number {
  let size = start;
  while (size > min) {
    ctx.font = `700 ${size}px Inter, ui-sans-serif, system-ui`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return min;
}

export function drawChart(
  canvas: HTMLCanvasElement,
  chart: GeneratedChart,
  params: Params,
  activeBar = -1,
): void {
  const hostWidth = Math.max(320, canvas.parentElement?.clientWidth ?? 960);
  const compact = hostWidth < 650;
  const cols = compact ? 2 : chart.formLength >= 32 ? 4 : chart.formLength === 12 ? 4 : 4;
  const gap = compact ? 8 : 10;
  const pad = compact ? 12 : 18;
  const headerH = compact ? 66 : 76;
  const cellH = compact ? 90 : 104;
  const cellW = (hostWidth - pad*2 - gap*(cols-1)) / cols;
  const rows = Math.ceil(chart.bars.length / cols);
  const cssHeight = headerH + pad + rows*(cellH+gap) + pad;
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);

  canvas.width = Math.floor(hostWidth*dpr);
  canvas.height = Math.floor(cssHeight*dpr);
  canvas.style.width = `${hostWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const bg = '#0b0d12';
  const card = '#12151d';
  const cardActive = '#18231f';
  const border = '#272c38';
  const accent = '#70e1b4';
  const text = '#f5f7fb';
  const muted = '#8c96aa';

  ctx.fillStyle = bg;
  ctx.fillRect(0,0,hostWidth,cssHeight);

  ctx.fillStyle = text;
  ctx.font = `800 ${compact?18:22}px Inter, ui-sans-serif, system-ui`;
  ctx.textBaseline = 'top';
  ctx.fillText(`${params.key} · ${formName(params.type)}`, pad, 15);
  ctx.fillStyle = muted;
  ctx.font = `500 ${compact?11:12}px Inter, ui-sans-serif, system-ui`;
  ctx.fillText(`${params.bpm} BPM · ${params.groove === 'swing' ? `${Math.round(params.swing*100)}% swing` : 'straight'} · ${params.complexity} · ${chart.bars.length} bars`, pad, compact?42:47);

  let lastSection = '';
  chart.bars.forEach((bar,i) => {
    const row = Math.floor(i/cols);
    const col = i%cols;
    const x = pad + col*(cellW+gap);
    const y = headerH + row*(cellH+gap);
    const isActive = i === activeBar;
    ctx.fillStyle = isActive ? cardActive : card;
    ctx.strokeStyle = isActive ? accent : border;
    ctx.lineWidth = isActive ? 2 : 1;
    roundedRect(ctx,x,y,cellW,cellH,13);
    ctx.fill();
    ctx.stroke();

    if (bar.section !== lastSection || i % chart.formLength === 0) {
      ctx.fillStyle = isActive ? accent : '#667085';
      ctx.font = `700 10px Inter, ui-sans-serif, system-ui`;
      ctx.fillText(bar.section, x+10, y+9);
      lastSection = bar.section;
    }

    ctx.fillStyle = muted;
    ctx.font = `600 10px Inter, ui-sans-serif, system-ui`;
    ctx.textAlign = 'right';
    ctx.fillText(`${i+1}`, x+cellW-10, y+9);

    if (bar.events.length === 2) {
      const mid = x + cellW/2;
      ctx.strokeStyle = isActive ? 'rgba(112,225,180,.35)' : '#242a34';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mid,y+31);
      ctx.lineTo(mid,y+cellH-11);
      ctx.stroke();
      const left = bar.events[0].chord.symbol;
      const right = bar.events[1].chord.symbol;
      const font = Math.min(22, fitFont(ctx,left,cellW/2-18,22,13), fitFont(ctx,right,cellW/2-18,22,13));
      ctx.font = `700 ${font}px Inter, ui-sans-serif, system-ui`;
      ctx.fillStyle = text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(left, x+cellW*.25, y+cellH*.62, cellW/2-16);
      ctx.fillText(right, x+cellW*.75, y+cellH*.62, cellW/2-16);
    } else {
      const label = bar.label;
      const font = fitFont(ctx,label,cellW-20,compact?24:28,14);
      ctx.font = `700 ${font}px Inter, ui-sans-serif, system-ui`;
      ctx.fillStyle = text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x+cellW/2, y+cellH*.62, cellW-20);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  });
}

export function exportCanvasPng(canvas: HTMLCanvasElement, filename = 'jazz_progression_chart.png'): void {
  canvas.toBlob(blob => {
    if (!blob) throw new Error('Could not create PNG image.');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, 'image/png');
}
