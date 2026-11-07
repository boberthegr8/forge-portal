import { useEffect, useRef, useState } from 'react';
import { Box, Layers, Printer } from 'lucide-react';

/* Customer-facing 3D framing model + scope report + delivery list, published from Forge Scope
   (projects.metadata.portal). Uses the same engine as scope.forgehub.dev so the model is identical. */
export type PortalPublish = {
  model?: any; summary?: string; delivery?: string; publishedAt?: string;
  report?: { title?: string; source?: string; sections?: { h: string; rows: [string, string][] }[]; bom?: { section: string; items: [string, string, string][] }[] };
  highlights?: { title: string; body: string; layers?: string[]; explode?: number; view?: string }[];
};

const ENGINE = 'https://scope.forgehub.dev/forgeModel3d.js';
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const loaded: Record<string, Promise<void>> = {};
function load(src: string) {
  if (src in loaded) return loaded[src];
  loaded[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
  return loaded[src];
}

export function ModelView({ portal, projectName }: { portal: PortalPublish; projectName?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [api, setApi] = useState<any>(null);
  const [layers, setLayers] = useState<{ key: string; label: string; color: string; visible: boolean }[]>([]);
  const [explode, setExplode] = useState(0);
  const [picked, setPicked] = useState('Drag to orbit · scroll to zoom · tap a piece to identify it');
  const [active, setActive] = useState<number | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        if (!(window as any).THREE) await load(THREE_URL);
        if (!(window as any).ForgeModel3D) await load(ENGINE);
        if (dead || !canvas.current) return;
        const m = (window as any).ForgeModel3D.mount(canvas.current, JSON.parse(JSON.stringify(portal.model)), { background: '#121212', onPick: (l: string | null) => setPicked(l || 'Nothing there') });
        setApi(m); setLayers(m.layers.map((l: any) => ({ ...l })));
      } catch (e: any) { setErr(e?.message || 'The 3D model could not be loaded.'); }
    })();
    return () => { dead = true; };
  }, [portal.model]);

  const toggle = (key: string, v: boolean) => { api?.setLayer(key, v); setLayers(ls => ls.map(l => l.key === key ? { ...l, visible: v } : l)); setActive(null); };
  const tour = (i: number) => {
    const h = portal.highlights?.[i]; if (!h || !api) return;
    setActive(i);
    if (h.layers) { api.layers.forEach((l: any) => api.setLayer(l.key, h.layers!.includes(l.key))); setLayers(ls => ls.map(l => ({ ...l, visible: h.layers!.includes(l.key) }))); }
    setExplode(h.explode || 0); api.explode(h.explode || 0); api.view(h.view || 'iso'); setPicked(h.body);
  };
  const views: [string, string][] = [['iso', '3D'], ['front', 'Front'], ['side', 'Side'], ['stair', 'Back'], ['top', 'Top']];
  const rep = portal.report;

  return <div className="model-wrap">
    {portal.summary && <p className="model-summary">{portal.summary}</p>}
    {!!portal.highlights?.length && <div className="model-tour">{portal.highlights.map((h, i) => <button key={i} className={active === i ? 'active' : ''} onClick={() => tour(i)}><strong>{h.title}</strong><span>{h.body}</span></button>)}</div>}
    <div className="model-grid">
      <div className="model-view">
        {err ? <div className="model-err">{err}</div> : <canvas ref={canvas} tabIndex={0} />}
        <div className="model-views">{views.map(([k, t]) => <button key={k} onClick={() => api?.view(k)}>{t}</button>)}</div>
        <div className="model-pick">{picked}</div>
      </div>
      <aside className="model-side">
        <div className="model-side-h"><Layers size={14} />Show / hide</div>
        {layers.map(l => <label key={l.key}><input type="checkbox" checked={l.visible} onChange={e => toggle(l.key, e.target.checked)} /><i style={{ background: l.color }} />{l.label}</label>)}
        <label className="model-range">Spread floors<input type="range" min={0} max={6} step={0.1} value={explode} onChange={e => { const v = +e.target.value; setExplode(v); api?.explode(v); }} /></label>
      </aside>
    </div>
    {rep && (rep.sections?.length || rep.bom?.length) ? <section className="panel model-report">
      <div className="panel-head"><h2>{rep.title || 'Scope of work'}</h2><button className="secondary compact no-print" onClick={() => window.print()}><Printer size={13} />Print / save PDF</button></div>
      {rep.source && <p className="description" style={{ paddingTop: 12 }}>{rep.source}</p>}
      {(rep.sections || []).map((s, i) => <div className="detail-list" key={i}>{s.rows.map(([k, v], j) => <div key={j}><span>{k}</span><strong>{v}</strong></div>)}</div>)}
      {!!rep.bom?.length && <div className="model-bom"><h3><Box size={14} />Delivery list</h3>{rep.bom.map((g, i) => <div key={i}><h4>{g.section}</h4><table><tbody>{g.items.map((r, j) => <tr key={j}><td className="q">{r[0]}</td><td className="u">{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></div>)}</div>}
    </section> : null}
    <small className="audit-note">3D framing model prepared by your J&amp;K representative{projectName ? ` for ${projectName}` : ''}{portal.publishedAt ? ` · updated ${new Date(portal.publishedAt).toLocaleDateString('en-CA')}` : ''}. Quantities are estimates for review.</small>
  </div>;
}
