import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Compass, AlertCircle,
  ShieldAlert, ChevronRight, Database, Loader2, Plus,
  Calendar, ArrowRight, Sparkles,
} from 'lucide-react';
import {
  apiGetCards, apiGetPortfolio, apiGetAlerts,
  apiGetProviderStatuses, apiGetLatestWeeklyStrategy,
} from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';
import { formatMoney, formatDate, opportunityLabel, statusLabel } from '../utils/format';
import CardArtwork from '../components/CardArtwork';

interface DashboardProps {
  settings: { currency: string };
  onNavigateToTab: (tab: string) => void;
  onNavigateToCard: (id: string) => void;
  onNavigateToAdd: () => void;
}

export default function Dashboard({ settings, onNavigateToTab, onNavigateToCard, onNavigateToAdd }: DashboardProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [latestStrategy, setLatestStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, p, a, pr, strategy] = await Promise.all([
          apiGetCards(),
          apiGetPortfolio(),
          apiGetAlerts(),
          apiGetProviderStatuses(),
          apiGetLatestWeeklyStrategy().catch(() => null),
        ]);
        setCards(c);
        setPortfolio(p);
        setAlerts(a);
        setProviders(pr);
        setLatestStrategy(strategy);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Impossibile caricare i dati.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { totalCost, totalValue, netProfitLoss, roi } = useMemo(() => {
    const cost = portfolio.reduce((acc, item) => acc + (item.totalCost || 0), 0);
    const value = portfolio.reduce((acc, item) => acc + (item.estimatedCurrentValue || 0), 0);
    const pl = value - cost;
    return {
      totalCost: cost,
      totalValue: value,
      netProfitLoss: pl,
      roi: cost > 0 ? (pl / cost) * 100 : 0,
    };
  }, [portfolio]);

  const bestDeals = useMemo(() => {
    const all: any[] = [];
    cards.forEach(card => {
      (card.offers || []).forEach((o: any) => {
        all.push({ ...o, cardName: card.name, cardNumber: card.cardNumber, cardId: card.id, cardImageUrl: card.imageUrl });
      });
    });
    return all
      .filter(o => !o.isSuspicious)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 4);
  }, [cards]);

  const recentCards = useMemo(
    () => [...cards]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4),
    [cards],
  );

  if (loading) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 10, color: 'var(--text-secondary)' }}>
        <Loader2 className="spin-anim" size={18} />
        <span>Caricamento del portafoglio…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrap">
        <div className="notice notice-error" role="alert">
          <AlertCircle size={15} />
          <span>Errore di connessione: {error}. Riprova più tardi o verifica lo stato dei provider.</span>
        </div>
      </div>
    );
  }

  const cur = settings.currency;

  // ---- Empty account: actionable onboarding instead of a dead screen ----
  if (cards.length === 0) {
    return (
      <div className="page-wrap">
        <div className="page-header">
          <div className="page-title-group">
            <h1>Dashboard</h1>
            <p>Panoramica del portafoglio e segnali di mercato</p>
          </div>
        </div>

        <div style={{
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '64px 32px', textAlign: 'center', background: 'var(--bg-raised)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'var(--accent-bg)',
            border: '1px solid var(--accent-border)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 18,
          }}>
            <Sparkles size={20} color="var(--accent-strong)" />
          </div>
          <h2 style={{ fontSize: 19, marginBottom: 8 }}>Inizia il tuo monitoraggio</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Aggiungi le carte o i prodotti che ritieni possano crescere di valore.
            CardAdvisor calcola valore stimato, segnali di mercato e priorità di osservazione.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onNavigateToAdd}>
              <Plus size={15} /> Aggiungi la prima carta
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigateToTab('providers')}>
              Configura i provider
            </button>
          </div>

          <div style={{
            display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap',
            marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)',
            fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'left',
          }}>
            <span>1 · Aggiungi carte da osservare</span>
            <span>2 · Registra prezzi e offerte</span>
            <span>3 · Valuta segnali e priorità</span>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={12} />
          Strumento di supporto alle decisioni. Nessuna garanzia di rendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Dashboard</h1>
          <p>Panoramica del portafoglio e segnali di mercato</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigateToTab('watchlist')}>
            Apri watchlist
          </button>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            <Plus size={15} /> Nuova carta
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-strip" style={{ marginBottom: 28 }}>
        <div className="kpi-cell">
          <span className="kpi-title">Valore stimato</span>
          <span className="kpi-value">{formatMoney(totalValue, cur)}</span>
          <span className="kpi-sub">Riferimento di mercato attuale</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-title">Costo totale</span>
          <span className="kpi-value">{formatMoney(totalCost, cur)}</span>
          <span className="kpi-sub">{portfolio.length} {portfolio.length === 1 ? 'acquisto registrato' : 'acquisti registrati'}</span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-title">Risultato netto</span>
          <span className="kpi-value" style={{ color: netProfitLoss > 0 ? 'var(--positive)' : netProfitLoss < 0 ? 'var(--negative)' : undefined }}>
            {netProfitLoss > 0 ? '+' : ''}{formatMoney(netProfitLoss, cur)}
          </span>
          <span className={`kpi-sub ${netProfitLoss > 0 ? 'positive' : netProfitLoss < 0 ? 'negative' : ''}`}>
            {netProfitLoss >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            ROI {roi.toFixed(1)}%
          </span>
        </div>
        <div className="kpi-cell">
          <span className="kpi-title">In osservazione</span>
          <span className="kpi-value">{cards.length}</span>
          <span className="kpi-sub">{cards.filter(c => c.status === 'WATCH').length} con priorità attiva</span>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 28 }} className="dash-grid">

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>

          {/* Top opportunities */}
          <section>
            <div className="section-title">
              <Compass size={13} /> Migliori opportunità
            </div>
            {bestDeals.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 24px' }}>
                <Compass />
                <h3>Nessuna opportunità rilevata</h3>
                <p>Registra offerte manuali o importa export di mercato per individuare prezzi sotto il valore stimato.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToTab('watchlist')}>
                  Vai alla watchlist
                </button>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                {bestDeals.map((o: any, idx: number) => {
                  const opp = opportunityLabel(o.opportunityLabel);
                  return (
                    <div
                      key={o.id}
                      onClick={() => onNavigateToCard(o.cardId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter') onNavigateToCard(o.cardId); }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: 16, padding: '14px 18px', cursor: 'pointer',
                        borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <CardArtwork src={o.cardImageUrl} name={o.cardName} size="thumb" style={{ width: 30, minWidth: 30 }} />
                        <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {o.cardName}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{o.cardNumber}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                          <span className="badge badge-neutral" style={{ fontSize: 10 }}>{o.marketplace}</span>
                          {renderDataQualityBadge(o.dataQuality)}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.condition}</span>
                        </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div className="num" style={{ fontSize: 14.5, fontWeight: 600 }}>
                            {formatMoney(o.totalPrice, cur, o.currency)}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>totale offerta</div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 96 }}>
                          <div className="num" style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--positive)' }}>{o.opportunityScore}</div>
                          <span className={`badge ${opp.className}`} style={{ fontSize: 10 }}>{opp.label}</span>
                        </div>
                        <ChevronRight size={15} color="var(--text-muted)" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recently added */}
          <section>
            <div className="section-title">
              <Plus size={13} /> Aggiunte di recente
            </div>
            <div className="card" style={{ padding: 0 }}>
              {recentCards.map((c: any, idx: number) => {
                const st = statusLabel(c.status);
                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigateToCard(c.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') onNavigateToCard(c.id); }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 16, padding: '12px 18px', cursor: 'pointer',
                      borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <CardArtwork src={c.imageUrl} name={c.name} size="thumb" style={{ width: 30, minWidth: 30 }} />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-muted)', marginLeft: 8 }}>
                          {c.setName} · {c.cardNumber}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</span>
                      <span className={`badge ${st.className}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, minWidth: 0 }}>

          {/* Weekly strategy */}
          <section>
            <div className="section-title">
              <TrendingUp size={13} /> Strategia settimanale
            </div>
            <div className="card">
              {latestStrategy ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <Calendar size={11} />
                    <span>{formatDate(latestStrategy.weekStartDate)} – {formatDate(latestStrategy.weekEndDate)}</span>
                  </div>
                  <h3 style={{ fontSize: 14, marginBottom: 8 }}>{latestStrategy.title}</h3>
                  <p style={{
                    color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.55, marginBottom: 14,
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {latestStrategy.marketSummary}
                  </p>
                  <button className="btn btn-ghost btn-sm" style={{ marginLeft: -8 }} onClick={() => onNavigateToTab('weekly-strategy')}>
                    Leggi la nota completa <ArrowRight size={12} />
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginBottom: 12 }}>
                    Nessuna nota strategica pubblicata.
                  </p>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToTab('weekly-strategy')}>
                    Scrivi la prima nota
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Price alerts */}
          <section>
            <div className="section-title">
              <AlertCircle size={13} /> Avvisi di prezzo
            </div>
            <div className="card">
              {alerts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, textAlign: 'center', padding: '8px 0' }}>
                  Nessun avviso di prezzo configurato.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {alerts.slice(0, 4).map((a: any, idx: number) => (
                    <div key={a.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 12.5, padding: '8px 0',
                      borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.card?.name || 'Carta'}</div>
                        <div className="num" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          Target {formatMoney(a.targetPrice, a.currency || 'EUR')}
                        </div>
                      </div>
                      {a.triggered ? (
                        <span className="badge badge-positive" style={{ fontSize: 10 }}>Attivato</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>Attivo</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Providers status */}
          <section>
            <div className="section-title">
              <Database size={13} /> Fonti dati
            </div>
            <div className="card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {providers.map((p: any) => (
                  <div key={p.providerName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <span style={{ fontWeight: 500 }}>{p.providerName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {p.status === 'AVAILABLE' && 'Connesso'}
                        {p.status === 'MOCKED' && 'Simulato'}
                        {p.status === 'NOT_CONFIGURED' && 'Non configurato'}
                        {p.status === 'ERROR' && 'Errore'}
                      </span>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
                        backgroundColor:
                          p.status === 'AVAILABLE' ? 'var(--positive)'
                          : p.status === 'MOCKED' ? 'var(--info)'
                          : p.status === 'NOT_CONFIGURED' ? 'var(--warn)'
                          : 'var(--negative)',
                      }} />
                    </span>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, marginLeft: -8, alignSelf: 'flex-start' }} onClick={() => onNavigateToTab('providers')}>
                  Gestisci fonti <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Disclaimer footer */}
      <p style={{ marginTop: 32, fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldAlert size={12} style={{ flexShrink: 0 }} />
        I valori stimati sono segnali di mercato calcolati algoritmicamente, non consulenza finanziaria. Nessuna garanzia di rendimento.
      </p>

      {/* Responsive: collapse the two-column grid */}
      <style>{`
        @media (max-width: 1024px) {
          .dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
