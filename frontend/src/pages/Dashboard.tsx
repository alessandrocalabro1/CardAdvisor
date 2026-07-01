import { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Eye, Compass, 
  AlertCircle, ShieldAlert, ChevronRight,
  Database, Loader2, ArrowRight, Calendar
} from 'lucide-react';
import { 
  apiGetCards, apiGetPortfolio, apiGetAlerts, 
  apiGetProviderStatuses, apiGetLatestWeeklyStrategy 
} from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';

interface DashboardProps {
  settings: { currency: string };
  onNavigateToTab: (tab: string) => void;
  onNavigateToCard: (id: string) => void;
}

export default function Dashboard({ settings, onNavigateToTab, onNavigateToCard }: DashboardProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [latestStrategy, setLatestStrategy] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [c, p, a, pr, strategy] = await Promise.all([
          apiGetCards(),
          apiGetPortfolio(),
          apiGetAlerts(),
          apiGetProviderStatuses(),
          apiGetLatestWeeklyStrategy().catch(() => null)
        ]);
        setCards(c);
        setPortfolio(p);
        setAlerts(a);
        setProviders(pr);
        setLatestStrategy(strategy);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '10px' }}>
        <Loader2 className="spin-anim" />
        <span style={{ color: 'var(--text-secondary)' }}>Gathering portfolio indexes...</span>
      </div>
    );
  }

  // 1. Calculate Portfolio KPIs
  const totalCost = portfolio.reduce((acc, item) => acc + item.totalCost, 0);
  const totalValue = portfolio.reduce((acc, item) => acc + item.estimatedCurrentValue, 0);
  const netProfitLoss = totalValue - totalCost;
  const roi = totalCost > 0 ? (netProfitLoss / totalCost) * 100 : 0;

  // 2. Aggregate best opportunities from ALL active offers
  // Gather all offers from cards that have them
  const allOpportunities: any[] = [];
  cards.forEach(card => {
    // If the card has offers (from card.offers), and it's calculated
    if (card.offers && card.offers.length > 0) {
      card.offers.forEach((o: any) => {
        allOpportunities.push({
          ...o,
          cardName: card.name,
          cardNumber: card.cardNumber,
          cardId: card.id
        });
      });
    } else {
      // In the general getCards return, we don't return all card.offers by default,
      // but we return bestOpportunityScore and bestOpportunityLabel.
      // If we need the actual offers, we can fallback.
      // Wait! Let's check: in cardService.ts, we did getCards() which includes 'offers' in the query:
      // include: { marketPrices: true, snapshots: true, offers: true, portfolio: true }
      // So card.offers IS available in card! That's awesome.
    }
  });

  // Calculate opportunity score for all offers
  const scoredOpportunities = allOpportunities.map(o => {
    // We already have opportunityScore attached if we retrieved from card.offers
    // Let's sort them
    return o;
  });

  // Filter out suspicious listings from "best opportunities" list to keep it premium
  const bestDeals = scoredOpportunities
    .filter(o => !o.isSuspicious)
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 3);

  // 3. Alerts trigger count

  const getOppLabelClass = (label: string) => {
    if (label.includes('opportunity')) return 'badge-opportunity';
    if (label.includes('interesting')) return 'badge-interesting';
    if (label.includes('watch')) return 'badge-watch';
    return 'badge-avoid';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Collector Dashboard</h1>
          <p>Portfolio valuation metrics, price drop alerts, and market signals</p>
        </div>
        <button className="btn btn-primary" onClick={() => onNavigateToTab('watchlist')}>
          Browse Catalog
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Warning positioning banner */}
      <div className="card" style={{ 
        borderLeft: '4px solid var(--accent-primary)', padding: '14px 20px', 
        marginBottom: '32px', backgroundColor: 'rgba(99,102,241,0.05)', fontSize: '13px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ShieldAlert size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            <strong>Disclaimer:</strong> CardAdvisor is a tracking and comparison support tool. Estimated fair ranges represent market signals only. Never guarantee profit. Always verify card condition and authenticity before buying.
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        
        <div className="card">
          <div className="kpi-container">
            <span className="kpi-title">Portfolio Value</span>
            <span className="kpi-value">
              {settings.currency === 'EUR' ? '€' : '$'}
              {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="kpi-change positive">
              <TrendingUp size={14} />
              <span>Current market reference</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpi-container">
            <span className="kpi-title">Total Portfolio Cost</span>
            <span className="kpi-value">
              {settings.currency === 'EUR' ? '€' : '$'}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              Incl. shipping on {portfolio.length} cards
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpi-container">
            <span className="kpi-title">Net Profit / Loss</span>
            <span className="kpi-value" style={{ color: netProfitLoss >= 0 ? 'var(--color-opportunity)' : 'var(--color-avoid)' }}>
              {netProfitLoss >= 0 ? '+' : ''}
              {settings.currency === 'EUR' ? '€' : '$'}
              {netProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={`kpi-change ${netProfitLoss >= 0 ? 'positive' : 'negative'}`}>
              {netProfitLoss >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>ROI: {roi.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="kpi-container">
            <span className="kpi-title">Watchlist Catalog</span>
            <span className="kpi-value">
              {cards.length} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 'normal' }}>cards</span>
            </span>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
              {cards.filter(c => c.status === 'WATCH').length} active watch targets
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Opportunities & Alerts info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Left Column: Top Opportunities */}
        <div>
          <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={20} color="var(--accent-primary)" /> Best Market Opportunities
          </h2>
          
          {bestDeals.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <Eye size={36} />
              <h3>No Opportunities Detected</h3>
              <p>Register a manual offer or import Cardmarket exports to scan for opportunities below reference ranges.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bestDeals.map((o: any) => (
                <div 
                  key={o.id} 
                  className="card" 
                  onClick={() => onNavigateToCard(o.cardId)}
                  style={{ 
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', borderLeft: '4px solid var(--color-opportunity)',
                    padding: '20px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-gray">{o.marketplace}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.cardNumber}</span>
                      {renderDataQualityBadge(o.dataQuality)}
                    </div>
                    <h3 style={{ color: 'white', fontSize: '16px' }}>{o.cardName}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Offer: "{o.title}" • Condition: {o.condition}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    
                    {/* Price positioning */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Offer</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>
                        {o.currency === 'EUR' ? '€' : '$'}
                        {o.totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Score badge */}
                    <div style={{ textAlign: 'center', minWidth: '90px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-opportunity)', fontFamily: 'var(--font-header)' }}>
                        {o.opportunityScore}
                      </div>
                      <span className={`badge ${getOppLabelClass(o.opportunityLabel)}`} style={{ fontSize: '9px', padding: '2px 4px' }}>
                        {o.opportunityLabel.replace(' to verify', '')}
                      </span>
                    </div>

                    <ChevronRight size={18} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Alerts & Provider Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Latest Weekly Strategy */}
          <div>
            <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={20} color="var(--accent-primary)" /> Weekly Strategy Notes
            </h2>
            <div className="card" style={{ padding: '20px' }}>
              {latestStrategy ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <Calendar size={12} />
                    <span>
                      {new Date(latestStrategy.weekStartDate).toLocaleDateString()} - {new Date(latestStrategy.weekEndDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '10px' }}>
                    {latestStrategy.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {latestStrategy.marketSummary}
                  </p>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                    onClick={() => onNavigateToTab('weekly-strategy')}
                  >
                    Read Strategy Notes <ArrowRight size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
                    No weekly strategy notes published.
                  </p>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', fontSize: '12px', padding: '8px' }}
                    onClick={() => onNavigateToTab('weekly-strategy')}
                  >
                    Open Strategy Module
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} color="var(--accent-primary)" /> Price Alerts
            </h2>
            <div className="card" style={{ padding: '20px' }}>
              {alerts.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                  No target price alerts set.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {alerts.slice(0, 4).map((a: any) => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>
                        <div style={{ color: 'white', fontWeight: '600' }}>{a.card?.name || 'Card'}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          Target: {a.currency === 'EUR' ? '€' : '$'}{a.targetPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        {a.triggered ? (
                          <span className="badge badge-opportunity" style={{ fontSize: '9px' }}>Triggered</span>
                        ) : (
                          <span className="badge badge-gray" style={{ fontSize: '9px' }}>Active</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {alerts.length > 4 && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px', fontSize: '12px', width: '100%', marginTop: '4px' }}
                      onClick={() => onNavigateToTab('alerts')}
                    >
                      View all alerts ({alerts.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Providers Status Summary */}
          <div>
            <h2 style={{ fontSize: '20px', color: 'white', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="var(--accent-primary)" /> Connection Health
            </h2>
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {providers.map((p: any) => (
                  <div key={p.providerName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <span style={{ color: 'white', fontWeight: '500' }}>{p.providerName}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {p.status === 'AVAILABLE' && 'Connected'}
                        {p.status === 'MOCKED' && 'Simulated'}
                        {p.status === 'NOT_CONFIGURED' && 'No Key'}
                        {p.status === 'ERROR' && 'Failure'}
                      </span>
                      <div style={{ 
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: p.status === 'AVAILABLE' ? 'var(--color-opportunity)' : p.status === 'MOCKED' ? 'var(--color-interesting)' : p.status === 'NOT_CONFIGURED' ? 'var(--color-watch)' : 'var(--color-avoid)'
                      }} />
                    </span>
                  </div>
                ))}
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px', fontSize: '12px', width: '100%', marginTop: '8px' }}
                  onClick={() => onNavigateToTab('providers')}
                >
                  Configure Connections
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
