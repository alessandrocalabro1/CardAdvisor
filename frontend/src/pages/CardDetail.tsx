import { useState, useEffect } from 'react';
import { 
  ArrowLeft, RefreshCw, Plus, AlertTriangle, Activity, 
  Compass, Tag, ExternalLink, Trash2, ShieldAlert, Loader2,
  Calendar, ArrowRight
} from 'lucide-react';
import { 
  apiGetCardById, apiAddManualMarketPrice, apiRefreshPrices,
  apiCreateOffer, apiDeleteOffer, apiCreatePortfolioItem, 
  apiDeletePortfolioItem, apiCreateSnapshot, apiCreateAlert, 
  apiDeleteAlert, apiGetDecisionBrief, apiGetCardWeeklyStrategyReferences
} from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';

interface CardDetailProps {
  cardId: string;
  settings: { currency: string; showDisclaimer: boolean };
  onBack: () => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

export default function CardDetail({ cardId, settings, onBack, onNavigateToStrategy }: CardDetailProps) {
  const [card, setCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'offers' | 'portfolio' | 'snapshots' | 'notes'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [brief, setBrief] = useState<any | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [strategyRefs, setStrategyRefs] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refsError, setRefsError] = useState<string | null>(null);

  // Forms state
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [priceForm, setPriceForm] = useState({ rawPrice: '', gradedPrice: '', lowPrice: '', trendPrice: '', averagePrice: '', currency: 'EUR', condition: 'Near Mint', language: 'English' });

  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({ marketplace: 'VINTED', title: '', price: '', shipping: '', currency: 'EUR', condition: 'Near Mint', language: 'English', sellerReliability: 'MEDIUM', url: '', notes: '' });

  const [showAddPortfolio, setShowAddPortfolio] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({ purchasePrice: '', shipping: '', purchaseDate: new Date().toISOString().split('T')[0], marketplace: 'VINTED', seller: '', notes: '' });

  const [showAddAlert, setShowAddAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({ targetPrice: '', currency: 'EUR', marketplace: 'VINTED' });

  const fetchCardDetails = async () => {
    try {
      setLoadingBrief(true);
      setLoadingRefs(true);
      const data = await apiGetCardById(cardId);
      setCard(data);
      
      try {
        const briefData = await apiGetDecisionBrief(cardId);
        setBrief(briefData);
      } catch (err) {
        console.error('Error fetching decision brief:', err);
        setBrief(null);
      }

      try {
        setRefsError(null);
        const refsData = await apiGetCardWeeklyStrategyReferences(cardId);
        setStrategyRefs(refsData);
      } catch (err: any) {
        console.error('Error fetching strategy references:', err);
        setStrategyRefs([]);
        setRefsError(err instanceof Error ? err.message : 'Failed to retrieve strategy mentions');
      }
    } catch (err) {
      console.error('Error fetching card details:', err);
    } finally {
      setLoading(false);
      setLoadingBrief(false);
      setLoadingRefs(false);
    }
  };

  useEffect(() => {
    fetchCardDetails();
  }, [cardId]);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await apiRefreshPrices(cardId);
      await fetchCardDetails();
    } catch (err: any) {
      alert(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddPrice = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        rawPrice: priceForm.rawPrice ? parseFloat(priceForm.rawPrice) : undefined,
        gradedPrice: priceForm.gradedPrice ? parseFloat(priceForm.gradedPrice) : undefined,
        lowPrice: priceForm.lowPrice ? parseFloat(priceForm.lowPrice) : undefined,
        trendPrice: priceForm.trendPrice ? parseFloat(priceForm.trendPrice) : undefined,
        averagePrice: priceForm.averagePrice ? parseFloat(priceForm.averagePrice) : undefined,
        currency: priceForm.currency,
        condition: priceForm.condition,
        language: priceForm.language
      };
      await apiAddManualMarketPrice(cardId, payload);
      setShowAddPrice(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to add price: ${err.message}`);
    }
  };

  const handleAddOffer = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        marketplace: offerForm.marketplace,
        title: offerForm.title,
        price: parseFloat(offerForm.price),
        shipping: parseFloat(offerForm.shipping || '0'),
        currency: offerForm.currency,
        condition: offerForm.condition,
        language: offerForm.language,
        sellerReliability: offerForm.sellerReliability,
        url: offerForm.url || undefined,
        notes: offerForm.notes || undefined
      };
      await apiCreateOffer(cardId, payload);
      setShowAddOffer(false);
      setOfferForm({ marketplace: 'VINTED', title: '', price: '', shipping: '', currency: 'EUR', condition: 'Near Mint', language: 'English', sellerReliability: 'MEDIUM', url: '', notes: '' });
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to log offer: ${err.message}`);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      await apiDeleteOffer(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleAddPortfolio = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        cardId,
        purchasePrice: parseFloat(portfolioForm.purchasePrice),
        shipping: parseFloat(portfolioForm.shipping || '0'),
        purchaseDate: new Date(portfolioForm.purchaseDate),
        marketplace: portfolioForm.marketplace,
        seller: portfolioForm.seller || undefined,
        notes: portfolioForm.notes || undefined
      };
      await apiCreatePortfolioItem(payload);
      setShowAddPortfolio(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to log purchase: ${err.message}`);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    if (!confirm('Remove this copy from your portfolio?')) return;
    try {
      await apiDeletePortfolioItem(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      await apiCreateSnapshot(cardId);
      alert('Pricing snapshot recorded successfully.');
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to record snapshot: ${err.message}`);
    }
  };

  const handleAddAlert = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        cardId,
        targetPrice: parseFloat(alertForm.targetPrice),
        currency: alertForm.currency,
        marketplace: alertForm.marketplace
      };
      await apiCreateAlert(payload);
      setShowAddAlert(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Failed to create alert: ${err.message}`);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await apiDeleteAlert(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Static conversion factor 1 EUR = 1.08 USD
  const convert = (val: number, from: string) => {
    const f = from.toUpperCase();
    const t = settings.currency.toUpperCase();
    if (f === t) return val;
    if (f === 'EUR' && t === 'USD') return val * 1.08;
    if (f === 'USD' && t === 'EUR') return val / 1.08;
    return val;
  };

  const format = (val: number, from: string = 'EUR') => {
    const convertedVal = convert(val, from);
    const symbol = settings.currency === 'EUR' ? '€' : '$';
    return `${symbol}${convertedVal.toFixed(2)}`;
  };

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return <span className="badge badge-opportunity" style={{ fontSize: '10px' }}>High Confidence</span>;
      case 'MEDIUM':
        return <span className="badge badge-interesting" style={{ fontSize: '10px' }}>Medium Confidence</span>;
      default:
        return <span className="badge badge-watch" style={{ fontSize: '10px' }}>Low Confidence</span>;
    }
  };

  const getOppBadge = (label: string) => {
    switch (label) {
      case 'strong opportunity to verify':
        return <span className="badge badge-opportunity">Strong Opportunity</span>;
      case 'interesting':
        return <span className="badge badge-interesting">Interesting</span>;
      case 'watch':
        return <span className="badge badge-watch">Watch</span>;
      default:
        return <span className="badge badge-avoid">Avoid</span>;
    }
  };

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading card details...</div>;
  if (!card) return <div style={{ color: 'var(--text-secondary)' }}>Card not found.</div>;

  // Calculate current portfolio summary for this card specifically
  const ownedItems = card.portfolio || [];
  const totalCost = ownedItems.reduce((acc: number, item: any) => acc + item.totalCost, 0);
  const totalValue = ownedItems.reduce((acc: number, item: any) => acc + (item.estimatedCurrentValue || 0), 0);
  const netPL = totalValue - totalCost;
  const cardRoi = totalCost > 0 ? (netPL / totalCost) * 100 : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="page-title-group">
            <h1>Card Inspector</h1>
            <p>Track listings, calculate fair estimates, and manage collection copies</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleRefreshPrices} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
            {refreshing ? 'Refreshed...' : 'Fetch Feed updates'}
          </button>
        </div>
      </div>

      {/* Warning posicion banner */}
      {settings.showDisclaimer && (
        <div className="card" style={{ 
          borderLeft: '4px solid var(--color-watch)', padding: '12px 18px', 
          marginBottom: '28px', backgroundColor: 'rgba(245,158,11,0.04)', fontSize: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={14} color="var(--color-watch)" />
            <span style={{ color: 'var(--text-secondary)' }}>
              Estimated Fair Ranges are algorithm references. CardAdvisor does NOT guarantee profit and is not financial advice. Verify seller integrity and slab cert numbers.
            </span>
          </div>
        </div>
      )}

      {/* Two-Column Layout */}
      <div className="card-detail-layout">
        
        {/* Left Art Column */}
        <div className="card-art-col">
          <div className="card-img-container">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} />
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No Image available</span>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="badge badge-gray">{card.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Rarity:</span>
                <span style={{ color: 'white', fontWeight: '500' }}>{card.rarity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Language:</span>
                <span style={{ color: 'white', fontWeight: '500' }}>{card.language}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Demand:</span>
                <span style={{ color: card.demandLevel === 'HIGH' ? 'var(--color-opportunity)' : 'var(--text-primary)' }}>{card.demandLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Supply:</span>
                <span style={{ color: card.supplyLevel === 'LOW' ? 'var(--color-opportunity)' : 'var(--text-primary)' }}>{card.supplyLevel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reprint Risk:</span>
                <span style={{ color: card.reprintRisk === 'HIGH' ? 'var(--color-avoid)' : 'var(--text-primary)' }}>{card.reprintRisk}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div>
          {/* Tabs header */}
          <div className="tabs-header">
            <div className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
            <div className={`tab-btn ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>Market Feeds</div>
            <div className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}>Offers ({card.offers?.length || 0})</div>
            <div className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>My Copies ({ownedItems.length})</div>
            <div className={`tab-btn ${activeTab === 'snapshots' ? 'active' : ''}`} onClick={() => setActiveTab('snapshots')}>Price History</div>
            <div className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Alerts & Notes</div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              
              {/* Card Meta Title Block */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{card.game} • {card.setName} • #{card.cardNumber}</span>
                <h2 style={{ color: 'white', fontSize: '26px', marginTop: '2px', marginBottom: '8px' }}>{card.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Art style: <strong>{card.version}</strong> • Expected Grade target: <strong>{card.condition}</strong></p>
              </div>

              {/* Fair Range calculator widget */}
              <div className="fair-range-widget">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Fair Range</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>
                        {card.fairRange.referencePrice > 0 ? (
                          `${format(card.fairRange.fairLow, card.fairRange.currency)} - ${format(card.fairRange.fairHigh, card.fairRange.currency)}`
                        ) : (
                          'No prices recorded'
                        )}
                      </span>
                      {card.fairRange.referencePrice > 0 && getConfidenceBadge(card.fairRange.confidence)}
                      {card.marketPrices && card.marketPrices.length > 0 && renderDataQualityBadge(card.marketPrices[0].dataQuality)}
                    </div>
                  </div>
                  
                  {card.fairRange.referencePrice > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Price</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-interesting)', marginTop: '4px' }}>
                        {format(card.fairRange.referencePrice, card.fairRange.currency)}
                      </div>
                    </div>
                  )}
                </div>

                {card.fairRange.referencePrice > 0 && (
                  <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-primary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <strong>Market Signal:</strong> {card.fairRange.explanation}
                  </div>
                )}
              </div>

              {/* Best Opportunity Evaluator */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Compass size={18} color="var(--accent-primary)" /> Best Opportunity Evaluator
                </h3>
                
                {card.offers && card.offers.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Best listing price detected:</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginTop: '2px' }}>
                          {format(card.offers[0].totalPrice, card.offers[0].currency)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluator Score:</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-opportunity)', fontFamily: 'var(--font-header)' }}>
                            {card.offers[0].opportunityScore}
                          </span>
                          {getOppBadge(card.offers[0].opportunityLabel)}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <strong>Score modifiers:</strong>
                      <ul style={{ paddingLeft: '16px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {card.offers[0].opportunityExplanation?.map((exp: string, i: number) => (
                          <li key={i}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No offers recorded. Log an offer from Vinted, Facebook Marketplace, or local seller lists under the "Offers" tab to calculate opportunity scores.
                  </p>
                )}
              </div>

              {/* Decision Brief Widget */}
              <div className="card" style={{ padding: '24px', marginTop: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="var(--accent-primary)" /> Dynamic Decision Brief
                  </span>
                  {!loadingBrief && brief ? (
                    <span className={`badge badge-${
                      brief.suggestedActionLabel === 'Strong opportunity to verify' ? 'opportunity' :
                      brief.suggestedActionLabel === 'Interesting to monitor' ? 'interesting' :
                      brief.suggestedActionLabel === 'Verify carefully' ? 'watch' :
                      brief.suggestedActionLabel === 'Watch' ? 'gray' : 'avoid'
                    }`} style={{ padding: '6px 10px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {brief.suggestedActionLabel}
                    </span>
                  ) : null}
                </h3>

                {loadingBrief ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', padding: '12px 0' }}>
                    <Loader2 className="spin-anim" size={16} />
                    <span>Analyzing price signals...</span>
                  </div>
                ) : brief ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Fair range & offer summary */}
                    <div className="grid-cols-2" style={{ gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fair Price Reference</div>
                        <p style={{ color: 'white', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>{brief.fairRangeSummary}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Offer Position</div>
                        <p style={{ color: 'white', fontSize: '13px', marginTop: '4px', lineHeight: '1.4' }}>
                          {brief.bestOfferSummary} 
                          {brief.pricePosition !== 'UNKNOWN' && (
                            <span className="badge badge-gray" style={{ marginLeft: '6px', fontSize: '10px' }}>
                              {brief.pricePosition.replace('_', ' ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Signals Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      
                      {/* Positive Signals */}
                      <div className="card" style={{ padding: '12px', backgroundColor: 'rgba(16,185,129,0.02)', borderColor: 'rgba(16,185,129,0.1)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-opportunity)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Positive Signals</div>
                        {brief.positiveSignals.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No positive signals detected.</p>
                        ) : (
                          <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {brief.positiveSignals.map((s: string, idx: number) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Risk Signals */}
                      <div className="card" style={{ padding: '12px', backgroundColor: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.1)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-avoid)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>Risk Observations</div>
                        {brief.riskSignals.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No severe risk indicators found.</p>
                        ) : (
                          <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {brief.riskSignals.map((s: string, idx: number) => (
                              <li key={idx} style={{ color: 'var(--text-primary)' }}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>

                    {/* Source details */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px' }}>
                      <span>{brief.confidenceExplanation}</span>
                      <span>{brief.dataQualitySummary}</span>
                    </div>

                    {/* Legal disclaimer */}
                    <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{brief.disclaimer}</span>
                    </div>

                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Could not load decision brief.</p>
                )}
              </div>

              {/* Strategy Mentions Widget */}
              <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} color="var(--accent-secondary)" /> Strategy Mentions
                </h3>

                {loadingRefs ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                    <Loader2 className="spin-anim" size={14} />
                    <span>Loading strategy mentions...</span>
                  </div>
                ) : refsError ? (
                  <div style={{ padding: '12px', borderLeft: '3px solid var(--color-avoid)', backgroundColor: 'rgba(239,68,68,0.03)', borderRadius: '4px' }}>
                    <p style={{ color: 'white', fontSize: '13px', margin: 0, fontWeight: '600' }}>
                      Could not load strategy mentions. Please try again.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '4px 0 0' }}>
                      Details: {refsError}
                    </p>
                  </div>
                ) : strategyRefs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {strategyRefs.map((ref: any) => (
                      <div key={ref.id} className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span className="badge badge-watch" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Watchlist mention</span>
                              <span className="badge badge-interesting" style={{ fontSize: '9px', textTransform: 'uppercase' }}>Strategy note</span>
                            </div>
                            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{ref.title}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              <Calendar size={11} />
                              <span>
                                {new Date(ref.weekStartDate).toLocaleDateString()} - {new Date(ref.weekEndDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {onNavigateToStrategy && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ fontSize: '11px', padding: '6px 10px', height: 'auto' }}
                              onClick={() => onNavigateToStrategy(ref.id)}
                            >
                              Open Weekly Strategy <ArrowRight size={10} style={{ marginLeft: '4px' }} />
                            </button>
                          )}
                        </div>
                        
                        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5', marginBottom: ref.riskNotes ? '8px' : '0' }}>
                          <strong>Summary:</strong> {ref.marketSummary}
                        </p>
                        
                        {ref.riskNotes && (
                          <p style={{ color: 'var(--color-watch)', fontSize: '11px', lineHeight: '1.4', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245,158,11,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                            <AlertTriangle size={11} style={{ flexShrink: 0 }} />
                            <span><strong>Risk note:</strong> {ref.riskNotes}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', margin: '8px 0' }}>
                    This card is not linked to any weekly strategy note yet.
                  </p>
                )}
              </div>

              {card.notes && (
                <div className="card" style={{ marginTop: '24px', padding: '16px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Notes</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{card.notes}</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: MARKET DATA */}
          {activeTab === 'market' && (
            <div className="tab-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', color: 'white' }}>Pricing logs</h3>
                <button className="btn btn-secondary" onClick={() => setShowAddPrice(true)}>
                  <Plus size={14} /> Log Manual Price
                </button>
              </div>

              {/* Manual Price form modal */}
              {showAddPrice && (
                <form onSubmit={handleAddPrice} className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'var(--bg-input)' }}>
                  <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '15px' }}>Log Manual Reference Price</h4>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Average Price</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 475.00" value={priceForm.averagePrice} onChange={e => setPriceForm({...priceForm, averagePrice: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Low Price (Optional)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 450.00" value={priceForm.lowPrice} onChange={e => setPriceForm({...priceForm, lowPrice: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Trend Price (Optional)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 480.00" value={priceForm.trendPrice} onChange={e => setPriceForm({...priceForm, trendPrice: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select className="form-control" value={priceForm.currency} onChange={e => setPriceForm({...priceForm, currency: e.target.value})}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condition</label>
                      <input type="text" className="form-control" placeholder="e.g. Near Mint" value={priceForm.condition} onChange={e => setPriceForm({...priceForm, condition: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Language</label>
                      <input type="text" className="form-control" placeholder="e.g. English" value={priceForm.language} onChange={e => setPriceForm({...priceForm, language: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowAddPrice(false)}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Save Log</button>
                  </div>
                </form>
              )}

              {card.marketPrices?.length === 0 ? (
                <div className="empty-state">
                  <Activity size={36} />
                  <h3>No Pricing Logs</h3>
                  <p>No pricing rows in database. Click "Fetch Feed updates" above to trigger external providers, or add a manual log.</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Source</th>
                        <th>Avg / Raw Price</th>
                        <th>Low Price</th>
                        <th>Trend Price</th>
                        <th>Graded Price</th>
                        <th>Confidence</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.marketPrices.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span className="badge badge-gray">{p.source}</span>
                              {renderDataQualityBadge(p.dataQuality)}
                            </div>
                          </td>
                          <td style={{ fontWeight: '600', color: 'white' }}>{p.averagePrice || p.rawPrice ? format(p.averagePrice || p.rawPrice, p.currency) : '—'}</td>
                          <td>{p.lowPrice ? format(p.lowPrice, p.currency) : '—'}</td>
                          <td>{p.trendPrice ? format(p.trendPrice, p.currency) : '—'}</td>
                          <td>{p.gradedPrice ? format(p.gradedPrice, p.currency) : '—'}</td>
                          <td>{p.confidenceScore.toFixed(2)}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(p.lastUpdated).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: OFFERS */}
          {activeTab === 'offers' && (
            <div className="tab-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', color: 'white' }}>Evaluated Offers</h3>
                <button className="btn btn-secondary" onClick={() => setShowAddOffer(true)}>
                  <Plus size={14} /> Log manual Offer
                </button>
              </div>

              {/* Add offer form */}
              {showAddOffer && (
                <form onSubmit={handleAddOffer} className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'var(--bg-input)' }}>
                  <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '15px' }}>Add Private or Marketplace Offer</h4>
                  <div className="grid-cols-2">
                    
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Offer Title*</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Shanks Romance Dawn near mint copy" 
                        value={offerForm.title} 
                        onChange={e => setOfferForm({...offerForm, title: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label>Marketplace Source</label>
                      <select className="form-control" value={offerForm.marketplace} onChange={e => setOfferForm({...offerForm, marketplace: e.target.value})}>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook Marketplace</option>
                        <option value="CARDMARKET">Cardmarket Listing</option>
                        <option value="EBAY">eBay</option>
                        <option value="TELEGRAM">Telegram Group</option>
                        <option value="PRIVATE">Private Seller</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Card Price*</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        placeholder="e.g. 390.00" 
                        value={offerForm.price} 
                        onChange={e => setOfferForm({...offerForm, price: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="form-group">
                      <label>Shipping Cost</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        placeholder="e.g. 10.00" 
                        value={offerForm.shipping} 
                        onChange={e => setOfferForm({...offerForm, shipping: e.target.value})} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Currency</label>
                      <select className="form-control" value={offerForm.currency} onChange={e => setOfferForm({...offerForm, currency: e.target.value})}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Condition Grade</label>
                      <input type="text" className="form-control" placeholder="e.g. Near Mint" value={offerForm.condition} onChange={e => setOfferForm({...offerForm, condition: e.target.value})} />
                    </div>

                    <div className="form-group">
                      <label>Card Language</label>
                      <input type="text" className="form-control" placeholder="e.g. English" value={offerForm.language} onChange={e => setOfferForm({...offerForm, language: e.target.value})} />
                    </div>

                    <div className="form-group">
                      <label>Seller Reliability</label>
                      <select className="form-control" value={offerForm.sellerReliability} onChange={e => setOfferForm({...offerForm, sellerReliability: e.target.value})}>
                        <option value="HIGH">High Reliability</option>
                        <option value="MEDIUM">Medium / Unrated</option>
                        <option value="LOW">Low Reliability</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Listing Link (Optional)</label>
                      <input type="url" className="form-control" placeholder="e.g. https://www.vinted.fr/..." value={offerForm.url} onChange={e => setOfferForm({...offerForm, url: e.target.value})} />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Offer Notes / Observations</label>
                      <textarea className="form-control" rows={2} placeholder="Write details about photos, seller responses, shipping timeline..." value={offerForm.notes} onChange={e => setOfferForm({...offerForm, notes: e.target.value})} />
                    </div>

                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowAddOffer(false)}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Add Offer</button>
                  </div>
                </form>
              )}

              {card.offers?.length === 0 ? (
                <div className="empty-state">
                  <Compass size={36} />
                  <h3>No Offers Logged</h3>
                  <p>Log active listing offers from sellers. The algorithm evaluates prices and details to rank deals.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {card.offers.map((o: any) => {
                    const parsedReasons = o.suspiciousReasonsJson ? JSON.parse(o.suspiciousReasonsJson) : [];
                    return (
                      <div key={o.id} className="card" style={{ padding: '20px', borderLeft: o.isSuspicious ? '4px solid var(--color-suspicious)' : '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <span className="badge badge-gray">{o.marketplace}</span>
                              {renderDataQualityBadge(o.dataQuality)}
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Condition: {o.condition} • {o.language}</span>
                            </div>
                            <h4 style={{ color: 'white', fontSize: '16px', marginBottom: '4px' }}>{o.title}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Seller Rating: <strong>{o.sellerReliability}</strong></p>
                            {o.notes && <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px', whiteSpace: 'pre-wrap' }}>Notes: {o.notes}</p>}
                          </div>

                          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Price</div>
                              <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{format(o.totalPrice, o.currency)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>({format(o.price, o.currency)} + shipping)</div>
                            </div>

                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                              <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-header)' }}>
                                {o.opportunityScore}
                              </div>
                              {getOppBadge(o.opportunityLabel)}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              {o.url && (
                                <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px' }}>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                              <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => handleDeleteOffer(o.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Suspicious warn box */}
                        {o.isSuspicious && (
                          <div style={{ marginTop: '14px', padding: '12px', borderRadius: '4px', backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)', fontSize: '12px' }}>
                            <div style={{ color: 'var(--color-suspicious)', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Cautious Warning Indicators Detected:
                            </div>
                            <ul style={{ paddingLeft: '16px', color: 'var(--text-primary)' }}>
                              {parsedReasons.map((reason: string, idx: number) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="tab-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', color: 'white' }}>Owned Copy Entries</h3>
                <button className="btn btn-secondary" onClick={() => setShowAddPortfolio(true)}>
                  <Plus size={14} /> Add Purchase Entry
                </button>
              </div>

              {/* Purchase log form */}
              {showAddPortfolio && (
                <form onSubmit={handleAddPortfolio} className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'var(--bg-input)' }}>
                  <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '15px' }}>Mark Card as Owned</h4>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Purchase Price*</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 12.00" value={portfolioForm.purchasePrice} onChange={e => setPortfolioForm({...portfolioForm, purchasePrice: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Shipping Paid</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 2.00" value={portfolioForm.shipping} onChange={e => setPortfolioForm({...portfolioForm, shipping: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Purchase Date</label>
                      <input type="date" className="form-control" value={portfolioForm.purchaseDate} onChange={e => setPortfolioForm({...portfolioForm, purchaseDate: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Marketplace Platform</label>
                      <select className="form-control" value={portfolioForm.marketplace} onChange={e => setPortfolioForm({...portfolioForm, marketplace: e.target.value})}>
                        <option value="CARDMARKET">Cardmarket</option>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook Marketplace</option>
                        <option value="PRIVATE">Private Seller</option>
                        <option value="TELEGRAM">Telegram</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Seller Nickname</label>
                      <input type="text" className="form-control" placeholder="e.g. TCGCollectorEU" value={portfolioForm.seller} onChange={e => setPortfolioForm({...portfolioForm, seller: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Purchase Notes</label>
                      <textarea className="form-control" rows={2} placeholder="Write condition details on receipt, grading plans..." value={portfolioForm.notes} onChange={e => setPortfolioForm({...portfolioForm, notes: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowAddPortfolio(false)}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Mark as Owned</button>
                  </div>
                </form>
              )}

              {ownedItems.length === 0 ? (
                <div className="empty-state">
                  <Tag size={36} />
                  <h3>Not Owned Yet</h3>
                  <p>You have not logged any owned copies of this card. Log a purchase entry to start monitoring portfolio performance.</p>
                </div>
              ) : (
                <div>
                  {/* Aggregated stats */}
                  <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Owned Copies</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{ownedItems.length}</div>
                    </div>
                    <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Cost basis</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{format(totalCost)}</div>
                    </div>
                    <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Theoretical Profit/Loss</div>
                      <div style={{ 
                        fontSize: '20px', fontWeight: '700', marginTop: '4px',
                        color: netPL >= 0 ? 'var(--color-opportunity)' : 'var(--color-avoid)' 
                      }}>
                        {netPL >= 0 ? '+' : ''}{format(netPL)} ({cardRoi.toFixed(1)}% ROI)
                      </div>
                    </div>
                  </div>

                  {/* List of items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ownedItems.map((item: any) => {
                      const itemTotalCost = item.purchasePrice + item.shipping;
                      const itemVal = item.estimatedCurrentValue || 0;
                      const itemPL = itemVal - itemTotalCost;
                      const itemRoi = itemTotalCost > 0 ? (itemPL / itemTotalCost) * 100 : 0;
                      return (
                        <div key={item.id} className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Purchased: {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : '—'} • Platform: {item.marketplace || 'Private'}
                                {renderDataQualityBadge('MANUAL')}
                              </div>
                              <h4 style={{ color: 'white', fontSize: '14px', marginTop: '2px' }}>Bought from: {item.seller || 'Unspecified'}</h4>
                              {item.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Notes: {item.notes}</p>}
                            </div>

                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Outlay</div>
                                <div style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{format(itemTotalCost)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>Market Est.</span>
                                  {card.marketPrices && card.marketPrices.length > 0 && renderDataQualityBadge(card.marketPrices[0].dataQuality)}
                                </div>
                                <div style={{ fontSize: '14px', color: 'white', fontWeight: '600' }}>{format(itemVal)}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>P/L & ROI</div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: itemPL >= 0 ? 'var(--color-opportunity)' : 'var(--color-avoid)' }}>
                                  {itemPL >= 0 ? '+' : ''}{format(itemPL)} ({itemRoi.toFixed(1)}%)
                                </div>
                              </div>
                              <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDeletePortfolioItem(item.id)}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div className="tab-pane">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', color: 'white' }}>Historical Price Points</h3>
                <button className="btn btn-secondary" onClick={handleCreateSnapshot}>
                  <Activity size={14} /> Record Price Snapshot
                </button>
              </div>

              {card.snapshots?.length === 0 ? (
                <div className="empty-state">
                  <Activity size={36} />
                  <h3>No Snapshots Set</h3>
                  <p>There are no historical snapshot points saved. Click "Record Price Snapshot" above to compile today's market metrics into history.</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Average Price</th>
                        <th>Median Price</th>
                        <th>Price Range (Min - Max)</th>
                        <th>Calculated Fair Range</th>
                        <th>Data points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.snapshots.map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ color: 'white', fontWeight: '600' }}>
                            {new Date(s.date).toLocaleDateString()}
                            {renderDataQualityBadge(s.date && new Date(s.date) < new Date('2026-07-01T10:00:00Z') ? 'SEED_SAMPLE' : 'AGGREGATED_PROVIDER')}
                          </td>
                          <td>{s.averagePrice ? format(s.averagePrice) : '—'}</td>
                          <td>{s.medianPrice ? format(s.medianPrice) : '—'}</td>
                          <td>{s.minPrice && s.maxPrice ? `${format(s.minPrice)} - ${format(s.maxPrice)}` : '—'}</td>
                          <td style={{ color: 'var(--color-opportunity)' }}>{s.fairLow && s.fairHigh ? `${format(s.fairLow)} - ${format(s.fairHigh)}` : '—'}</td>
                          <td>{s.listingOrSampleCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ALERTS & NOTES */}
          {activeTab === 'notes' && (
            <div className="tab-pane">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', color: 'white' }}>Target Price Alerts</h3>
                <button className="btn btn-secondary" onClick={() => setShowAddAlert(true)}>
                  <Plus size={14} /> Set Price Alert
                </button>
              </div>

              {showAddAlert && (
                <form onSubmit={handleAddAlert} className="card" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'var(--bg-input)' }}>
                  <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '15px' }}>Configure Price Drop Target</h4>
                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label>Target Price*</label>
                      <input type="number" step="0.01" className="form-control" placeholder="e.g. 400.00" value={alertForm.targetPrice} onChange={e => setAlertForm({...alertForm, targetPrice: e.target.value})} required />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select className="form-control" value={alertForm.currency} onChange={e => setAlertForm({...alertForm, currency: e.target.value})}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Marketplace</label>
                      <select className="form-control" value={alertForm.marketplace} onChange={e => setAlertForm({...alertForm, marketplace: e.target.value})}>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="CARDMARKET">Cardmarket</option>
                        <option value="PRIVATE">Private</option>
                        <option value="ALL">Any platform</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setShowAddAlert(false)}>Cancel</button>
                    <button className="btn btn-primary" type="submit">Set Alert</button>
                  </div>
                </form>
              )}

              {card.alerts?.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                  No target price notifications configured for this card. Set an alert to be warned when listings fall below your target.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {card.alerts.map((a: any) => (
                    <div key={a.id} className="card" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Price Target Notification</div>
                          <h4 style={{ color: 'white', fontSize: '16px', marginTop: '2px' }}>
                            Trigger below: {a.currency === 'EUR' ? '€' : '$'}{a.targetPrice.toFixed(2)}
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '12px' }}>
                              Platform: {a.marketplace || 'Any'}
                            </span>
                          </h4>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {a.triggered ? (
                            <span className="badge badge-opportunity">Price drop triggered!</span>
                          ) : (
                            <span className="badge badge-gray">Monitoring active</span>
                          )}
                          <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDeleteAlert(a.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
