// Main Tracker App
const { useState, useMemo, useEffect, useRef } = React;


// Parsea el campo `importe` ("€10–53 M", "€475 M", "€22.400 M", "€20,6 M", etc.)
// y devuelve euros como número, usando el extremo superior si es rango.
// Devuelve 0 si no hay cuantía declarada (s.d., €s.d., +fallecidos, etc.).
function parseImporte(s) {
  if (!s) return 0;
  const m = s.match(/€?\s*([\d.,]+(?:\s*[–-]\s*[\d.,]+)?)\s*M/i);
  if (!m) return 0;
  const parts = m[1].split(/[–-]/).map(x => x.trim());
  const last = parts[parts.length - 1];
  // En español "22.400" = 22400 (punto = millar), "20,6" = 20.6 (coma = decimal)
  const normalized = last.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num * 1_000_000;
}

function fmtEUR(n) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function parseYM(s) {
  if (!s) return null;
  const [y, m] = s.split('-').map(Number);
  return { y, m };
}
function fmtYM(s) {
  if (!s) return '—';
  const { y, m } = parseYM(s);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${months[m-1]} ${y}`;
}

// Distribute N dots inside a cell as a tight grid
function dotPositions(n) {
  if (n === 0) return [];
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / cols);
  const arr = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    arr.push({ row: r, col: c, totalRows: rows, totalCols: cols });
  }
  return arr;
}

function Tracker() {
  const tDefaults = /*EDITMODE-BEGIN*/{
    "showLabels": false,
    "highlightParty": "all",
    "highlightPhase": "all",
    "background": "cream"
  }/*EDITMODE-END*/;
  const [t, setTweak] = useTweaks(tDefaults);

  const [hoverCase, setHoverCase] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const TODAY = TRACKER_DATE;
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const recentEnough = (c) => {
    if (!c.ultima) return false;
    const [y, m] = c.ultima.split('-').map(Number);
    const d = new Date(y, m - 1, 15);
    return (TODAY - d) <= ONE_YEAR_MS;
  };

  // Number every case 1..N using a stable order (party order then phase order)
  const numberedCases = useMemo(() => {
    const partyOrder = Object.fromEntries(PARTIES.map((p, i) => [p.id, i]));
    const phaseOrder = Object.fromEntries(PHASES.map((p, i) => [p.id, i]));
    const filtered = CASES.filter(recentEnough);
    const sorted = [...filtered].sort((a, b) =>
      (partyOrder[a.party] - partyOrder[b.party]) ||
      (phaseOrder[a.phase] - phaseOrder[b.phase]) ||
      a.name.localeCompare(b.name, 'es')
    );
    return sorted.map((c, i) => ({ ...c, num: i + 1 }));
  }, []);

  // Group by party × phase
  const byCell = useMemo(() => {
    const map = {};
    for (const c of numberedCases) {
      const key = `${c.party}__${c.phase}`;
      (map[key] = map[key] || []).push(c);
    }
    return map;
  }, [numberedCases]);

  // Stats
  const totalCases = numberedCases.length;
  const inProgress = numberedCases.filter(c => !['firme', 'prision'].includes(c.phase)).length;
  const condenados = numberedCases.filter(c => ['firme', 'prision'].includes(c.phase)).length;
  const conPrision = numberedCases.filter(c => c.phase === 'prision').length;

  // Dinero — suma de importes de causas actuales con cuantía declarada
  const importes = numberedCases.map(c => parseImporte(c.importe));
  const totalImporte = importes.reduce((a, b) => a + b, 0);
  const conImporte = importes.filter(n => n > 0).length;
  // Acumulado histórico — fuente casos-aislados.com
  const HISTORICO = 124177015826;
  const HISTORICO_URL = 'https://casos-aislados.com/index.php';

  const matchesSearch = (c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.imputados || []).some(im => im.toLowerCase().includes(search.toLowerCase()));

  const isDimmed = (c) =>
    (t.highlightParty !== 'all' && c.party !== t.highlightParty) ||
    (t.highlightPhase !== 'all' && c.phase !== t.highlightPhase) ||
    !matchesSearch(c);

  return (
    <>
      <span style={{ display: 'none' }} aria-hidden="true">tracker-mounted</span>
      {ReactDOM.createPortal(
        <div className={`stage bg-${t.background}`}>
          <Masthead totalCases={totalCases} inProgress={inProgress} condenados={condenados} conPrision={conPrision} search={search} setSearch={setSearch} />

          <Ledger totalImporte={totalImporte} conImporte={conImporte} totalCases={totalCases} historico={HISTORICO} historicoUrl={HISTORICO_URL} />

          <Grid
            numberedCases={numberedCases}
            byCell={byCell}
            showLabels={t.showLabels}
            isDimmed={isDimmed}
            onHover={(c, pos) => { setHoverCase(c); setHoverPos(pos); }}
            onLeave={() => setHoverCase(null)}
            onSelect={setSelected}
          />

          <Legend numberedCases={numberedCases} isDimmed={isDimmed} onSelect={setSelected} onHover={(c, pos) => { setHoverCase(c); setHoverPos(pos); }} onLeave={() => setHoverCase(null)} />
        </div>,
        document.getElementById('canvas')
      )}

      {hoverCase && !selected && <HoverCard c={hoverCase} pos={hoverPos} />}
      {selected && <DetailPanel c={selected} onClose={() => setSelected(null)} onToast={setToast} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Visualización">
          <TweakToggle label="Etiquetas" value={t.showLabels} onChange={v => setTweak('showLabels', v)} />
          <TweakRadio label="Fondo" value={t.background} options={[{value:'cream', label:'Crema'},{value:'paper', label:'Papel'},{value:'ink', label:'Tinta'}]} onChange={v => setTweak('background', v)} />
        </TweakSection>
        <TweakSection label="Filtrar">
          <TweakSelect label="Partido" value={t.highlightParty} options={[{value:'all', label:'Todos'}, ...PARTIES.map(p => ({value: p.id, label: p.name}))]} onChange={v => setTweak('highlightParty', v)} />
          <TweakSelect label="Fase" value={t.highlightPhase} options={[{value:'all', label:'Todas'}, ...PHASES.map(p => ({value: p.id, label: p.short}))]} onChange={v => setTweak('highlightPhase', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

function Masthead({ totalCases, inProgress, condenados, conPrision, search, setSearch }) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const today = `${TRACKER_DATE.getDate()} ${months[TRACKER_DATE.getMonth()]} ${TRACKER_DATE.getFullYear()}`;
  return (
    <header className="masthead">
      <div className="masthead-top">
        <div className="dateline">
          <span className="dot-red" />
          <span className="dateline-text">Actualizado · {today}</span>
        </div>
        <div className="searchbar">
          <input
            type="text"
            placeholder="Buscar caso o imputado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="masthead-title">
        <h1>
          <span className="serif-italic">Corrupción</span> Actual <span className="title-rule">·</span> <span className="title-sub">España</span>
        </h1>
        <p className="standfirst">Estado en tiempo real de los principales casos de corrupción política en su recorrido por el sistema judicial español. <span className="standfirst-note">Estimaciones a partir de información pública. Reitérese la presunción de inocencia de todos los implicados.</span></p>
      </div>
      <div className="masthead-stats">
        <Stat n={totalCases} label="casos seguidos" mobileLabel="casos" />
        <Stat n={inProgress} label="en curso" secondary />
        <Stat n={condenados} label="con sentencia firme" secondary />
        <Stat n={conPrision} label="con ingreso en prisión" highlight secondary />
      </div>
    </header>
  );
}

const WORKERS = 22_293_000;
const VOTERS  = 37_466_432;

function Ledger({ totalImporte, conImporte, totalCases, historico, historicoUrl }) {
  return (
    <section className="ledger" aria-label="Resumen económico">
      <div className="ledger-item ledger-actual">
        <div className="ledger-l">
          <span className="ledger-tick" />
          Coste Actual de la Corrupción
        </div>
        <div className="ledger-n">{fmtEUR(totalImporte)}</div>
        <div className="ledger-per">{fmtEUR(totalImporte / WORKERS)} por trabajador · {fmtEUR(totalImporte / VOTERS)} por votante</div>
        <div className="ledger-note">Estimación basada en casos abiertos.</div>
      </div>
      <div className="ledger-plus" aria-hidden="true">+</div>
      <div className="ledger-item ledger-pasado">
        <div className="ledger-l">
          <span className="ledger-tick ledger-tick-mute" />
          Coste Pasado de la Corrupción
        </div>
        <div className="ledger-n">{fmtEUR(historico)}</div>
        <div className="ledger-per">{fmtEUR(historico / WORKERS)} por trabajador · {fmtEUR(historico / VOTERS)} por votante</div>
        <div className="ledger-note ledger-note-oneline">Coste total de la corrupción en España. Fuente: <a href={historicoUrl} target="_blank" rel="noopener noreferrer" className="ledger-link">Casos Aislados&nbsp;↗</a></div>
      </div>
    </section>
  );
}

function Stat({ n, label, mobileLabel, highlight, secondary }) {
  return (
    <div className={`stat${highlight ? ' stat-highlight' : ''}${secondary ? ' stat-secondary' : ''}`}>
      <div className="stat-n">{n}</div>
      <div className="stat-l">
        {mobileLabel ? (
          <>
            <span className="stat-l-desktop">{label}</span>
            <span className="stat-l-mobile">{mobileLabel}</span>
          </>
        ) : label}
      </div>
    </div>
  );
}

function Grid({ numberedCases, byCell, showLabels, isDimmed, onHover, onLeave, onSelect }) {
  return (
    <div className="grid-wrap">
      {/* Phase headers */}
      <div className="grid-headers">
        <div className="hdr-corner">
          <span className="hdr-corner-x">Partido</span>
          <span className="hdr-corner-arrow">↓</span>
          <span className="hdr-corner-phase">Fase →</span>
        </div>
        {PHASES.map((p, i) => (
          <div key={p.id} className="phase-hdr">
            <div className="phase-num">{String(i+1).padStart(2,'0')}</div>
            <div className="phase-lbl">{p.label.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}</div>
          </div>
        ))}
      </div>

      {/* Rows */}
      {PARTIES.map(party => (
        <div key={party.id} className="row">
          <div className="row-label" style={{ '--party-color': party.color }}>
            <span className="row-bar" />
            <span className="row-name">{party.name}</span>
            <span className="row-count">
              {numberedCases.filter(c => c.party === party.id).length}
            </span>
          </div>
          {PHASES.map(phase => {
            const cases = byCell[`${party.id}__${phase.id}`] || [];
            return (
              <Cell
                key={phase.id}
                party={party}
                phase={phase}
                cases={cases}
                showLabels={showLabels}
                isDimmed={isDimmed}
                onHover={onHover}
                onLeave={onLeave}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Cell({ party, phase, cases, showLabels, isDimmed, onHover, onLeave, onSelect }) {
  const positions = dotPositions(cases.length);
  return (
    <div className="cell">
      {cases.length === 0 ? null : (
        <div className="cell-dots">
          {cases.map((c, i) => {
            const pos = positions[i];
            const dimmed = isDimmed(c);
            return (
              <button
                key={c.id}
                className={`dot ${dimmed ? 'dot-dim' : ''}`}
                style={{
                  '--party-color': party.color,
                  '--g-row': pos.row,
                  '--g-rows': pos.totalRows,
                  '--g-col': pos.col,
                  '--g-cols': pos.totalCols,
                }}
                onMouseEnter={e => {
                  const r = e.currentTarget.getBoundingClientRect();
                  onHover(c, { x: r.left + r.width / 2, y: r.top });
                }}
                onMouseLeave={onLeave}
                onClick={() => onSelect(c)}
                aria-label={c.name}
              >
                <span className="dot-num">{c.num}</span>
                {showLabels && <span className="dot-label">{c.name.replace(/^Caso\s+/i, '').split('·')[0].trim().split('/')[0].trim()}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HoverCard({ c, pos }) {
  const party = PARTIES.find(p => p.id === c.party);
  const phase = PHASES.find(p => p.id === c.phase);
  const phaseIdx = PHASES.findIndex(p => p.id === c.phase);
  const style = {
    left: Math.min(window.innerWidth - 320, Math.max(8, pos.x - 150)),
    top: pos.y - 12,
    '--party-color': party.color,
  };
  return ReactDOM.createPortal(
    <div className="hovercard" style={style}>
      <div className="hovercard-tag" style={{ background: party.color }}>{party.name}</div>
      <div className="hovercard-num">#{c.num}</div>
      <h3>{c.name}</h3>
      <div className="hovercard-meta">
        <div><span className="meta-l">Fase</span><span className="meta-v">{String(phaseIdx+1).padStart(2,'0')} · {phase.short}</span></div>
        <div><span className="meta-l">Inicio</span><span className="meta-v">{c.year}</span></div>
        <div><span className="meta-l">Importe</span><span className="meta-v">{c.importe}</span></div>
        <div><span className="meta-l">Última novedad</span><span className="meta-v">{fmtYM(c.ultima)}</span></div>
      </div>
      <p className="hovercard-resumen">{c.resumen}</p>
      <div className="hovercard-cta">Click para ficha completa →</div>
    </div>,
    document.body
  );
}

function DetailPanel({ c, onClose, onToast }) {
  const party = PARTIES.find(p => p.id === c.party);
  const phase = PHASES.find(p => p.id === c.phase);
  const phaseIdx = PHASES.findIndex(p => p.id === c.phase);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Try open in a new tab. Inside sandboxed previews popups are blocked,
  // so fall back to navigating the current window — user can press back.
  const handleNewsClick = (e, href) => {
    e.preventDefault();
    let opened = null;
    try { opened = window.open(href, '_blank', 'noopener,noreferrer'); } catch (_) {}
    if (opened) return;
    // Fallback: navigate same window
    window.location.href = href;
  };

  return ReactDOM.createPortal(
    <>
      <div className="detail-backdrop" onClick={onClose} />
      <aside className="detail" style={{ '--party-color': party.color }}>
        <button className="detail-close" onClick={onClose} aria-label="Cerrar">×</button>

        <div>
          <div className="detail-tag">
            <span className="detail-tag-party" style={{ background: party.color }}>{party.name}</span>
            <span className="detail-tag-num">CASO #{c.num}</span>
          </div>
          <h2>{c.name}</h2>
          <p className="detail-resumen">{c.resumen}</p>
        </div>

        <div className="detail-progress">
          <div className="detail-progress-track">
            {PHASES.map((p, i) => (
              <div key={p.id} className={`tp-step ${i <= phaseIdx ? 'tp-done' : ''} ${i === phaseIdx ? 'tp-current' : ''}`} title={p.short}>
                <div className="tp-dot" />
                {i < PHASES.length - 1 && <div className="tp-line" />}
                <div className="tp-label">{String(i+1).padStart(2,'0')}</div>
              </div>
            ))}
          </div>
          <div className="detail-current">
            <div className="dc-l">Fase actual</div>
            <div className="dc-v">{String(phaseIdx+1).padStart(2,'0')} · {phase.short}</div>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-field">
            <div className="df-l">Año de inicio</div>
            <div className="df-v">{c.year}</div>
          </div>
          <div className="detail-field">
            <div className="df-l">Importe estimado</div>
            <div className="df-v">{c.importe}</div>
            <div className="df-note">{c.importeNota}</div>
          </div>
          <div className="detail-field detail-field-full">
            <div className="df-l">Imputados principales</div>
            <div className="df-imputados">
              {(c.imputados || []).map((im, i) => <span key={i} className="chip">{im}</span>)}
            </div>
          </div>
          <div className="detail-field detail-field-full">
            <div className="df-l">Última actuación judicial · {fmtYM(c.ultima)} <span className="df-est">estimación</span></div>
            <div className="df-v df-v-news">{c.ultimaTexto}</div>
          </div>
        </div>

        {(c.piezas || []).length > 0 && (
          <div className="detail-piezas">
            <div className="detail-piezas-h">
              <h3>Piezas</h3>
              <span className="detail-news-c">{c.piezas.length} {c.piezas.length === 1 ? 'pieza' : 'piezas'}</span>
            </div>
            <ul className="piezas-list">
              {c.piezas.map((p, i) => {
                const ph = PHASES.find(x => x.id === p.estado);
                const label = p.estado === 'archivo' ? 'Archivada' : (ph ? ph.short : p.estado);
                return (
                  <li key={i} className="pieza-item">
                    <span className={`pieza-badge pieza-badge-${p.estado}`}>{label}</span>
                    <div>
                      <div className="pieza-nombre">{p.nombre}</div>
                      {p.nota && <div className="pieza-nota">{p.nota}</div>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {(c.noticias || []).length > 0 && (
          <div className="detail-news">
            <div className="detail-news-h">
              <h3>Noticias</h3>
              <span className="detail-news-c">artículos seleccionados</span>
            </div>
            <ul className="news-list">
              {c.noticias.map((n, i) => (
                <li key={i} className="news-item">
                  <div className="news-item-meta">
                    <span className="news-item-fuente">{n.fuente}</span>
                    <span className="news-item-sep">·</span>
                    <span className="news-item-fecha">{n.fecha}</span>
                  </div>
                  {n.url ? (
                    <a href={n.url} target="_blank" rel="noopener noreferrer" onClick={e => handleNewsClick(e, n.url)} className="news-item-link">
                      <span className="news-item-titulo">{n.titulo}</span>
                      <span className="news-item-arrow">↗</span>
                    </a>
                  ) : (
                    <span className="news-item-titulo news-item-nolink">{n.titulo}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

      </aside>
    </>,
    document.body
  );
}

function Legend({ numberedCases, isDimmed, onSelect, onHover, onLeave }) {
  // Split list by party for visual rhythm
  const groups = PARTIES.map(p => ({
    party: p,
    cases: numberedCases.filter(c => c.party === p.id),
  }));
  return (
    <div className="legend">
      <div className="legend-head">
        <h4>Índice de casos</h4>
        <span className="legend-hint">Click en un caso para abrir la ficha</span>
      </div>
      <div className="legend-cols">
        {groups.map(g => (
          <div key={g.party.id} className="legend-col" style={{ '--party-color': g.party.color }}>
            <div className="legend-party">{g.party.name}</div>
            <ul>
              {g.cases.map(c => (
                <li key={c.id}
                  className={isDimmed(c) ? 'legend-dim' : ''}
                  onMouseEnter={e => {
                    const r = e.currentTarget.getBoundingClientRect();
                    onHover(c, { x: r.left + r.width / 2, y: r.top });
                  }}
                  onMouseLeave={onLeave}
                  onClick={() => onSelect(c)}
                >
                  <span className="legend-num">{String(c.num).padStart(2,'0')}</span>
                  <span className="legend-name">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3500);
    return () => clearTimeout(id);
  }, [onDone]);
  return ReactDOM.createPortal(
    <div className="toast">✓  {msg}</div>,
    document.body
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Tracker />);
