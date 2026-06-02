import { flattenEvents, funnel, xpSeries } from '../lib/insights.js';

const FUNNEL_ROWS = [
  { key: 'calls', label: 'Calls', tone: 'blue' },
  { key: 'quotes', label: 'Quotes', tone: 'gold' },
  { key: 'policies', label: 'Closes', tone: 'crimson' },
];

function XpLineChart({ series }) {
  const W = 320;
  const H = 120;
  const PAD = 10;
  const n = series.length;
  const max = Math.max(1, ...series.map((s) => s.cumulative));
  const min = Math.min(...series.map((s) => s.cumulative));
  const span = max - min || 1;
  const x = (i) => PAD + (i * (W - 2 * PAD)) / Math.max(1, n - 1);
  const y = (v) => H - PAD - ((v - min) / span) * (H - 2 * PAD);

  const line = series.map((s, i) => `${x(i)},${y(s.cumulative)}`).join(' ');
  const area = `${PAD},${H - PAD} ${line} ${x(n - 1)},${H - PAD}`;

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="EXP growth over time" preserveAspectRatio="none">
      <defs>
        <linearGradient id="xpfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(91,138,240,0.35)" />
          <stop offset="100%" stopColor="rgba(91,138,240,0)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#xpfill)" />
      <polyline points={line} fill="none" stroke="var(--royal-bright)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => (
        <circle key={s.key} cx={x(i)} cy={y(s.cumulative)} r={i === n - 1 ? 3 : 0} fill="var(--gold)" />
      ))}
    </svg>
  );
}

const StatsDashboard = ({ player, leads }) => {
  const stats = player?.stats ?? {};
  const events = flattenEvents(leads);
  const series = xpSeries(events, 14);
  const f = funnel(stats);
  const maxFunnel = Math.max(1, f.calls, f.quotes, f.policies);

  const kpis = [
    { label: 'Total EXP', value: player?.totalXP ?? 0, tone: 'gold' },
    { label: 'Policies Won', value: f.policies, tone: 'crimson' },
    { label: 'Call→Quote', value: `${f.quoteRate}%`, tone: 'blue' },
    { label: 'Quote→Close', value: `${f.closeRate}%`, tone: 'gold' },
  ];

  return (
    <div className="panel pipeline-panel">
      <h2 className="panel-title panel-title--blue">War Room</h2>
      <p className="panel-subtitle">Performance intel for your crusade.</p>

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className={`kpi-card kpi-card--${k.tone}`}>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-block">
        <h4 className="section-label">EXP Growth · last 14 days</h4>
        <XpLineChart series={series} />
      </div>

      <div className="chart-block">
        <h4 className="section-label">Conversion Funnel</h4>
        <div className="funnel">
          {FUNNEL_ROWS.map(({ key, label, tone }) => {
            const value = f[key];
            const percent = Math.round((value / maxFunnel) * 100);
            return (
              <div key={key} className="funnel-row">
                <span className="funnel-label">{label}</span>
                <div className="funnel-track">
                  <div className={`funnel-bar funnel-bar--${tone}`} style={{ width: `${Math.max(value ? 8 : 0, percent)}%` }}>
                    <span className="funnel-value">{value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="funnel-footer">
          Win rate <strong>{f.winRate}%</strong> · {f.calls} calls → {f.policies} policies
        </p>
      </div>
    </div>
  );
};

export default StatsDashboard;
