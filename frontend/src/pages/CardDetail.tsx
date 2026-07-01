import { useState, useEffect } from 'react';
import {
  ArrowLeft, RefreshCw, Plus, AlertTriangle, Activity,
  Compass, Tag, ExternalLink, Trash2, ShieldAlert, Loader2,
  Calendar, ArrowRight, BookOpen,
} from 'lucide-react';
import {
  apiGetCardById, apiAddManualMarketPrice, apiRefreshPrices,
  apiCreateOffer, apiDeleteOffer, apiCreatePortfolioItem,
  apiDeletePortfolioItem, apiCreateSnapshot, apiCreateAlert,
  apiDeleteAlert, apiGetDecisionBrief, apiGetCardWeeklyStrategyReferences,
} from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';
import {
  formatMoney, formatDate, formatDateTime,
  statusLabel, opportunityLabel, confidenceLabel, levelLabel,
} from '../utils/format';

interface CardDetailProps {
  cardId: string;
  settings: { currency: string; showDisclaimer: boolean };
  onBack: () => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

type TabId = 'overview' | 'market' | 'offers' | 'portfolio' | 'snapshots' | 'notes';

export default function CardDetail({ cardId, settings, onBack, onNavigateToStrategy }: CardDetailProps) {
  const [card, setCard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [brief, setBrief] = useState<any | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [strategyRefs, setStrategyRefs] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [refsError, setRefsError] = useState<string | null>(null);

  // Inline forms
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
        setRefsError(err instanceof Error ? err.message : 'Errore nel recupero delle menzioni');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await apiRefreshPrices(cardId);
      await fetchCardDetails();
    } catch (err: any) {
      alert(`Aggiornamento non riuscito: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddPrice = async (e: React.FormEvent) => {
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
        language: priceForm.language,
      };
      await apiAddManualMarketPrice(cardId, payload);
      setShowAddPrice(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Registrazione non riuscita: ${err.message}`);
    }
  };

  const handleAddOffer = async (e: React.FormEvent) => {
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
        notes: offerForm.notes || undefined,
      };
      await apiCreateOffer(cardId, payload);
      setShowAddOffer(false);
      setOfferForm({ marketplace: 'VINTED', title: '', price: '', shipping: '', currency: 'EUR', condition: 'Near Mint', language: 'English', sellerReliability: 'MEDIUM', url: '', notes: '' });
      fetchCardDetails();
    } catch (err: any) {
      alert(`Registrazione non riuscita: ${err.message}`);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Eliminare questa offerta?')) return;
    try {
      await apiDeleteOffer(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Eliminazione non riuscita: ${err.message}`);
    }
  };

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        cardId,
        purchasePrice: parseFloat(portfolioForm.purchasePrice),
        shipping: parseFloat(portfolioForm.shipping || '0'),
        purchaseDate: new Date(portfolioForm.purchaseDate),
        marketplace: portfolioForm.marketplace,
        seller: portfolioForm.seller || undefined,
        notes: portfolioForm.notes || undefined,
      };
      await apiCreatePortfolioItem(payload);
      setShowAddPortfolio(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Registrazione non riuscita: ${err.message}`);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    if (!confirm('Rimuovere questa copia dal portafoglio?')) return;
    try {
      await apiDeletePortfolioItem(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Eliminazione non riuscita: ${err.message}`);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      await apiCreateSnapshot(cardId);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Snapshot non riuscito: ${err.message}`);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        cardId,
        targetPrice: parseFloat(alertForm.targetPrice),
        currency: alertForm.currency,
        marketplace: alertForm.marketplace,
      };
      await apiCreateAlert(payload);
      setShowAddAlert(false);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Creazione avviso non riuscita: ${err.message}`);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      await apiDeleteAlert(id);
      fetchCardDetails();
    } catch (err: any) {
      alert(`Eliminazione non riuscita: ${err.message}`);
    }
  };

  const fmt = (val: number, from: string = 'EUR') => formatMoney(val, settings.currency, from);

  if (loading) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', justifyContent: 'center', height: '40vh' }}>
        <Loader2 className="spin-anim" size={18} />
        <span>Caricamento del dettaglio…</span>
      </div>
    );
  }
  if (!card) {
    return (
      <div className="page-wrap">
        <div className="notice notice-error" role="alert">Carta non trovata.</div>
      </div>
    );
  }

  const ownedItems = card.portfolio || [];
  const totalCost = ownedItems.reduce((acc: number, item: any) => acc + item.totalCost, 0);
  const totalValue = ownedItems.reduce((acc: number, item: any) => acc + (item.estimatedCurrentValue || 0), 0);
  const netPL = totalValue - totalCost;
  const cardRoi = totalCost > 0 ? (netPL / totalCost) * 100 : 0;
  const st = statusLabel(card.status);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Panoramica' },
    { id: 'market', label: 'Prezzi' },
    { id: 'offers', label: `Offerte (${card.offers?.length || 0})` },
    { id: 'portfolio', label: `Copie (${ownedItems.length})` },
    { id: 'snapshots', label: 'Storico' },
    { id: 'notes', label: 'Avvisi' },
  ];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button className="btn btn-ghost btn-icon" onClick={onBack} aria-label="Torna alla watchlist">
            <ArrowLeft size={16} />
          </button>
          <div className="page-title-group" style={{ minWidth: 0 }}>
            <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</h1>
            <p>{card.game} · {card.setName} · {card.cardNumber}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleRefreshPrices} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
            {refreshing ? 'Aggiornamento…' : 'Aggiorna prezzi'}
          </button>
        </div>
      </div>

      {settings.showDisclaimer && (
        <div className="notice notice-warn" style={{ marginBottom: 24 }}>
          <ShieldAlert size={14} />
          <span>
            Le fasce eque stimate sono riferimenti algoritmici, non consulenza finanziaria. Nessuna garanzia di rendimento: verifica sempre condizione, autenticità e affidabilità del venditore.
          </span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="card-detail-layout">
        {/* Left: art + quick facts */}
        <div className="card-art-col">
          <div className="card-img-container">
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} />
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Nessuna immagine</span>
            )}
          </div>

          <div className="card" style={{ padding: '10px 16px' }}>
            <div className="def-row">
              <span className="label">Stato</span>
              <span className={`badge ${st.className}`}>{st.label}</span>
            </div>
            <div className="def-row">
              <span className="label">Rarità</span>
              <span className="value">{card.rarity}</span>
            </div>
            <div className="def-row">
              <span className="label">Lingua</span>
              <span className="value">{card.language}</span>
            </div>
            <div className="def-row">
              <span className="label">Versione</span>
              <span className="value">{card.version}</span>
            </div>
            <div className="def-row">
              <span className="label">Domanda</span>
              <span className="value" style={{ color: card.demandLevel === 'HIGH' ? 'var(--positive)' : undefined }}>{levelLabel(card.demandLevel)}</span>
            </div>
            <div className="def-row">
              <span className="label">Offerta</span>
              <span className="value" style={{ color: card.supplyLevel === 'LOW' ? 'var(--positive)' : undefined }}>{levelLabel(card.supplyLevel)}</span>
            </div>
            <div className="def-row">
              <span className="label">Rischio ristampa</span>
              <span className="value" style={{ color: card.reprintRisk === 'HIGH' ? 'var(--negative)' : undefined }}>{levelLabel(card.reprintRisk)}</span>
            </div>
          </div>

          {/* Position summary if owned */}
          {ownedItems.length > 0 && (
            <div className="card" style={{ padding: '10px 16px' }}>
              <div className="def-row">
                <span className="label">Copie possedute</span>
                <span className="value num">{ownedItems.length}</span>
              </div>
              <div className="def-row">
                <span className="label">Costo totale</span>
                <span className="value num">{fmt(totalCost)}</span>
              </div>
              <div className="def-row">
                <span className="label">Risultato</span>
                <span className="value num" style={{ color: netPL >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  {netPL >= 0 ? '+' : ''}{fmt(netPL)} ({cardRoi.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ minWidth: 0 }}>
          <div className="tabs-header" role="tablist">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Valuation */}
              <div className="card" style={{ borderColor: 'var(--accent-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div className="section-title" style={{ marginBottom: 6 }}>Valore stimato</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
                        {card.fairRange.referencePrice > 0
                          ? `${fmt(card.fairRange.fairLow, card.fairRange.currency)} – ${fmt(card.fairRange.fairHigh, card.fairRange.currency)}`
                          : 'Nessun prezzo registrato'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {card.fairRange.referencePrice > 0 && (() => {
                        const conf = confidenceLabel(card.fairRange.confidence);
                        return <span className={`badge ${conf.className}`}>{conf.label}</span>;
                      })()}
                      {card.marketPrices && card.marketPrices.length > 0 && renderDataQualityBadge(card.marketPrices[0].dataQuality)}
                    </div>
                  </div>

                  {card.fairRange.referencePrice > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div className="section-title" style={{ marginBottom: 6, justifyContent: 'flex-end' }}>Prezzo di riferimento</div>
                      <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>
                        {fmt(card.fairRange.referencePrice, card.fairRange.currency)}
                      </div>
                    </div>
                  )}
                </div>

                {card.fairRange.referencePrice > 0 && card.fairRange.explanation && (
                  <p style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Segnale di mercato:</strong> {card.fairRange.explanation}
                  </p>
                )}
              </div>

              {/* Watch thesis */}
              {card.notes && (
                <div className="card">
                  <div className="section-title">
                    <BookOpen size={13} /> Tesi di monitoraggio
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{card.notes}</p>
                </div>
              )}

              {/* Best opportunity */}
              <div className="card">
                <div className="section-title">
                  <Compass size={13} /> Migliore offerta rilevata
                </div>

                {card.offers && card.offers.length > 0 ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Prezzo totale migliore</div>
                        <div className="num" style={{ fontSize: 19, fontWeight: 600, marginTop: 2 }}>
                          {fmt(card.offers[0].totalPrice, card.offers[0].currency)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Punteggio segnale</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, justifyContent: 'flex-end' }}>
                          <span className="num" style={{ fontSize: 19, fontWeight: 600, color: 'var(--positive)' }}>
                            {card.offers[0].opportunityScore}
                          </span>
                          {(() => {
                            const opp = opportunityLabel(card.offers[0].opportunityLabel);
                            return <span className={`badge ${opp.className}`}>{opp.label}</span>;
                          })()}
                        </div>
                      </div>
                    </div>

                    {card.offers[0].opportunityExplanation?.length > 0 && (
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Fattori del punteggio</strong>
                        <ul style={{ paddingLeft: 16, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {card.offers[0].opportunityExplanation.map((exp: string, i: number) => (
                            <li key={i}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    Nessuna offerta registrata. Aggiungi le offerte trovate su Vinted, Cardmarket o da venditori privati nella scheda “Offerte” per calcolare i punteggi.
                  </p>
                )}
              </div>

              {/* Decision brief */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
                  <div className="section-title" style={{ marginBottom: 0 }}>
                    <Activity size={13} /> Brief decisionale
                  </div>
                  {!loadingBrief && brief && (
                    <span className={`badge ${
                      brief.suggestedActionLabel === 'Strong opportunity to verify' ? 'badge-positive'
                        : brief.suggestedActionLabel === 'Interesting to monitor' ? 'badge-info'
                        : brief.suggestedActionLabel === 'Verify carefully' ? 'badge-warn'
                        : brief.suggestedActionLabel === 'Watch' ? 'badge-neutral' : 'badge-negative'
                    }`}>
                      {brief.suggestedActionLabel === 'Strong opportunity to verify' ? 'Opportunità da verificare'
                        : brief.suggestedActionLabel === 'Interesting to monitor' ? 'Interessante da monitorare'
                        : brief.suggestedActionLabel === 'Verify carefully' ? 'Verificare con cautela'
                        : brief.suggestedActionLabel === 'Watch' ? 'Da osservare' : brief.suggestedActionLabel}
                    </span>
                  )}
                </div>

                {loadingBrief ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', padding: '8px 0', fontSize: 12.5 }}>
                    <Loader2 className="spin-anim" size={14} />
                    <span>Analisi dei segnali di prezzo…</span>
                  </div>
                ) : brief ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="grid-cols-2" style={{ gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Riferimento di prezzo</div>
                        <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>{brief.fairRangeSummary}</p>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Posizione migliore offerta</div>
                        <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                          {brief.bestOfferSummary}
                          {brief.pricePosition !== 'UNKNOWN' && (
                            <span className="badge badge-neutral" style={{ marginLeft: 6, fontSize: 10 }}>
                              {brief.pricePosition.replace('_', ' ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid-cols-2" style={{ gap: 14 }}>
                      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--positive-bg)', border: '1px solid var(--positive-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--positive)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Segnali positivi</div>
                        {brief.positiveSignals.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nessun segnale positivo rilevato.</p>
                        ) : (
                          <ul style={{ paddingLeft: 14, margin: 0, fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {brief.positiveSignals.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                          </ul>
                        )}
                      </div>

                      <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--negative-bg)', border: '1px solid var(--negative-border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Rischi</div>
                        {brief.riskSignals.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nessun indicatore di rischio rilevante.</p>
                        ) : (
                          <ul style={{ paddingLeft: 14, margin: 0, fontSize: 12, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {brief.riskSignals.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <span>{brief.confidenceExplanation}</span>
                      <span>{brief.dataQualitySummary}</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <ShieldAlert size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{brief.disclaimer}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Brief decisionale non disponibile.</p>
                )}
              </div>

              {/* Strategy mentions */}
              <div className="card">
                <div className="section-title">
                  <Tag size={13} /> Menzioni nelle note strategiche
                </div>

                {loadingRefs ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12.5 }}>
                    <Loader2 className="spin-anim" size={14} />
                    <span>Caricamento delle menzioni…</span>
                  </div>
                ) : refsError ? (
                  <div className="notice notice-error">
                    <span>Impossibile caricare le menzioni ({refsError}). Riprova più tardi.</span>
                  </div>
                ) : strategyRefs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {strategyRefs.map((ref: any) => (
                      <div key={ref.id} style={{ padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                          <div>
                            <h4 style={{ fontSize: 13.5, fontWeight: 600 }}>{ref.title}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              <Calendar size={10} />
                              <span>{formatDate(ref.weekStartDate)} – {formatDate(ref.weekEndDate)}</span>
                            </div>
                          </div>
                          {onNavigateToStrategy && (
                            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateToStrategy(ref.id)}>
                              Apri nota <ArrowRight size={11} />
                            </button>
                          )}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.5 }}>
                          {ref.marketSummary}
                        </p>

                        {ref.riskNotes && (
                          <p style={{ color: 'var(--warn)', fontSize: 11.5, lineHeight: 1.45, display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: 8 }}>
                            <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span><strong>Rischio:</strong> {ref.riskNotes}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                    Questa carta non è ancora collegata a nessuna nota strategica settimanale.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB: MARKET */}
          {activeTab === 'market' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Rilevazioni di prezzo</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPrice(v => !v)}>
                  <Plus size={13} /> Prezzo manuale
                </button>
              </div>

              {showAddPrice && (
                <form onSubmit={handleAddPrice} className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Registra un prezzo di riferimento</div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Prezzo medio</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 475,00" value={priceForm.averagePrice} onChange={e => setPriceForm({ ...priceForm, averagePrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Prezzo minimo (opzionale)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 450,00" value={priceForm.lowPrice} onChange={e => setPriceForm({ ...priceForm, lowPrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Prezzo trend (opzionale)</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 480,00" value={priceForm.trendPrice} onChange={e => setPriceForm({ ...priceForm, trendPrice: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Valuta</label>
                      <select className="form-control" value={priceForm.currency} onChange={e => setPriceForm({ ...priceForm, currency: e.target.value })}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condizione</label>
                      <input type="text" className="form-control" placeholder="es. Near Mint" value={priceForm.condition} onChange={e => setPriceForm({ ...priceForm, condition: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Lingua</label>
                      <input type="text" className="form-control" placeholder="es. English" value={priceForm.language} onChange={e => setPriceForm({ ...priceForm, language: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => setShowAddPrice(false)}>Annulla</button>
                    <button className="btn btn-primary" type="submit">Salva</button>
                  </div>
                </form>
              )}

              {card.marketPrices?.length === 0 ? (
                <div className="empty-state">
                  <Activity />
                  <h3>Nessuna rilevazione di prezzo</h3>
                  <p>Usa “Aggiorna prezzi” per interrogare i provider esterni, oppure registra un prezzo manuale.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fonte</th>
                        <th style={{ textAlign: 'right' }}>Medio</th>
                        <th style={{ textAlign: 'right' }}>Minimo</th>
                        <th style={{ textAlign: 'right' }}>Trend</th>
                        <th style={{ textAlign: 'right' }}>Gradato</th>
                        <th style={{ textAlign: 'right' }}>Affidabilità</th>
                        <th>Ultimo aggiornamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.marketPrices.map((p: any) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                              <span className="badge badge-neutral">{p.source}</span>
                              {renderDataQualityBadge(p.dataQuality)}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.averagePrice || p.rawPrice ? fmt(p.averagePrice || p.rawPrice, p.currency) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{p.lowPrice ? fmt(p.lowPrice, p.currency) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{p.trendPrice ? fmt(p.trendPrice, p.currency) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{p.gradedPrice ? fmt(p.gradedPrice, p.currency) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{p.confidenceScore.toFixed(2)}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDateTime(p.lastUpdated)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: OFFERS */}
          {activeTab === 'offers' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Offerte valutate</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddOffer(v => !v)}>
                  <Plus size={13} /> Registra offerta
                </button>
              </div>

              {showAddOffer && (
                <form onSubmit={handleAddOffer} className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Nuova offerta da marketplace o venditore privato</div>
                  <div className="grid-cols-2">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Titolo dell’offerta*</label>
                      <input type="text" className="form-control" placeholder="es. Shanks Romance Dawn near mint" value={offerForm.title} onChange={e => setOfferForm({ ...offerForm, title: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Marketplace</label>
                      <select className="form-control" value={offerForm.marketplace} onChange={e => setOfferForm({ ...offerForm, marketplace: e.target.value })}>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook Marketplace</option>
                        <option value="CARDMARKET">Cardmarket</option>
                        <option value="EBAY">eBay</option>
                        <option value="TELEGRAM">Gruppo Telegram</option>
                        <option value="PRIVATE">Venditore privato</option>
                        <option value="OTHER">Altro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Prezzo carta*</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 390,00" value={offerForm.price} onChange={e => setOfferForm({ ...offerForm, price: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Spedizione</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 10,00" value={offerForm.shipping} onChange={e => setOfferForm({ ...offerForm, shipping: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Valuta</label>
                      <select className="form-control" value={offerForm.currency} onChange={e => setOfferForm({ ...offerForm, currency: e.target.value })}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condizione</label>
                      <input type="text" className="form-control" placeholder="es. Near Mint" value={offerForm.condition} onChange={e => setOfferForm({ ...offerForm, condition: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Lingua</label>
                      <input type="text" className="form-control" placeholder="es. English" value={offerForm.language} onChange={e => setOfferForm({ ...offerForm, language: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Affidabilità venditore</label>
                      <select className="form-control" value={offerForm.sellerReliability} onChange={e => setOfferForm({ ...offerForm, sellerReliability: e.target.value })}>
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Media / non valutato</option>
                        <option value="LOW">Bassa</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Link all’annuncio (opzionale)</label>
                      <input type="url" className="form-control" placeholder="https://…" value={offerForm.url} onChange={e => setOfferForm({ ...offerForm, url: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Note sull’offerta</label>
                      <textarea className="form-control" rows={2} placeholder="Foto, risposte del venditore, tempi di spedizione…" value={offerForm.notes} onChange={e => setOfferForm({ ...offerForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => setShowAddOffer(false)}>Annulla</button>
                    <button className="btn btn-primary" type="submit">Aggiungi offerta</button>
                  </div>
                </form>
              )}

              {card.offers?.length === 0 ? (
                <div className="empty-state">
                  <Compass />
                  <h3>Nessuna offerta registrata</h3>
                  <p>Registra le offerte trovate sui marketplace: l’algoritmo le confronta con la fascia equa e assegna un punteggio.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {card.offers.map((o: any) => {
                    const parsedReasons = o.suspiciousReasonsJson ? JSON.parse(o.suspiciousReasonsJson) : [];
                    const opp = opportunityLabel(o.opportunityLabel);
                    return (
                      <div key={o.id} className="card" style={{ borderColor: o.isSuspicious ? 'var(--negative-border)' : undefined }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                              <span className="badge badge-neutral">{o.marketplace}</span>
                              {renderDataQualityBadge(o.dataQuality)}
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{o.condition} · {o.language}</span>
                            </div>
                            <h4 style={{ fontSize: 14.5, marginBottom: 3 }}>{o.title}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Affidabilità venditore: <strong>{levelLabel(o.sellerReliability)}</strong></p>
                            {o.notes && <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 5, whiteSpace: 'pre-wrap' }}>{o.notes}</p>}
                          </div>

                          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Totale</div>
                              <div className="num" style={{ fontSize: 17, fontWeight: 600 }}>{fmt(o.totalPrice, o.currency)}</div>
                              <div className="num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>({fmt(o.price, o.currency)} + sped.)</div>
                            </div>

                            <div style={{ textAlign: 'center', minWidth: 76 }}>
                              <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{o.opportunityScore}</div>
                              <span className={`badge ${opp.className}`} style={{ fontSize: 10 }}>{opp.label}</span>
                            </div>

                            <div style={{ display: 'flex', gap: 6 }}>
                              {o.url && (
                                <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon" aria-label="Apri annuncio">
                                  <ExternalLink size={13} />
                                </a>
                              )}
                              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--negative)' }} aria-label="Elimina offerta" onClick={() => handleDeleteOffer(o.id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {o.isSuspicious && (
                          <div className="notice notice-error" style={{ marginTop: 12 }}>
                            <AlertTriangle size={13} />
                            <div>
                              <strong>Indicatori di cautela rilevati:</strong>
                              <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                                {parsedReasons.map((reason: string, idx: number) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Copie in portafoglio</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddPortfolio(v => !v)}>
                  <Plus size={13} /> Registra acquisto
                </button>
              </div>

              {showAddPortfolio && (
                <form onSubmit={handleAddPortfolio} className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Registra una copia acquistata</div>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label>Prezzo di acquisto*</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 12,00" value={portfolioForm.purchasePrice} onChange={e => setPortfolioForm({ ...portfolioForm, purchasePrice: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Spedizione pagata</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 2,00" value={portfolioForm.shipping} onChange={e => setPortfolioForm({ ...portfolioForm, shipping: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Data di acquisto</label>
                      <input type="date" className="form-control" value={portfolioForm.purchaseDate} onChange={e => setPortfolioForm({ ...portfolioForm, purchaseDate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Piattaforma</label>
                      <select className="form-control" value={portfolioForm.marketplace} onChange={e => setPortfolioForm({ ...portfolioForm, marketplace: e.target.value })}>
                        <option value="CARDMARKET">Cardmarket</option>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook Marketplace</option>
                        <option value="PRIVATE">Venditore privato</option>
                        <option value="TELEGRAM">Telegram</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Venditore</label>
                      <input type="text" className="form-control" placeholder="es. TCGCollectorEU" value={portfolioForm.seller} onChange={e => setPortfolioForm({ ...portfolioForm, seller: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Note di acquisto</label>
                      <textarea className="form-control" rows={2} placeholder="Condizione alla ricezione, piani di gradazione…" value={portfolioForm.notes} onChange={e => setPortfolioForm({ ...portfolioForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => setShowAddPortfolio(false)}>Annulla</button>
                    <button className="btn btn-primary" type="submit">Registra copia</button>
                  </div>
                </form>
              )}

              {ownedItems.length === 0 ? (
                <div className="empty-state">
                  <Tag />
                  <h3>Nessuna copia registrata</h3>
                  <p>Registra un acquisto per monitorare costo, valore stimato e risultato di questa carta nel portafoglio.</p>
                </div>
              ) : (
                <div>
                  <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
                    <div className="kpi-cell">
                      <span className="kpi-title">Copie</span>
                      <span className="kpi-value">{ownedItems.length}</span>
                    </div>
                    <div className="kpi-cell">
                      <span className="kpi-title">Costo totale</span>
                      <span className="kpi-value">{fmt(totalCost)}</span>
                    </div>
                    <div className="kpi-cell">
                      <span className="kpi-title">Risultato teorico</span>
                      <span className="kpi-value" style={{ color: netPL >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                        {netPL >= 0 ? '+' : ''}{fmt(netPL)}
                      </span>
                      <span className={`kpi-sub ${netPL >= 0 ? 'positive' : 'negative'}`}>ROI {cardRoi.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ownedItems.map((item: any) => {
                      const itemTotalCost = item.purchasePrice + item.shipping;
                      const itemVal = item.estimatedCurrentValue || 0;
                      const itemPL = itemVal - itemTotalCost;
                      const itemRoi = itemTotalCost > 0 ? (itemPL / itemTotalCost) * 100 : 0;
                      return (
                        <div key={item.id} className="card" style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span>{item.purchaseDate ? formatDate(item.purchaseDate) : '—'} · {item.marketplace || 'Privato'}</span>
                                {renderDataQualityBadge('MANUAL')}
                              </div>
                              <h4 style={{ fontSize: 13.5, marginTop: 3 }}>Venditore: {item.seller || 'non specificato'}</h4>
                              {item.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{item.notes}</p>}
                            </div>

                            <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo</div>
                                <div className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>{fmt(itemTotalCost)}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valore stimato</div>
                                <div className="num" style={{ fontSize: 13.5, fontWeight: 600 }}>{fmt(itemVal)}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risultato</div>
                                <div className="num" style={{ fontSize: 13.5, fontWeight: 600, color: itemPL >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                                  {itemPL >= 0 ? '+' : ''}{fmt(itemPL)} ({itemRoi.toFixed(1)}%)
                                </div>
                              </div>
                              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--negative)' }} aria-label="Rimuovi copia" onClick={() => handleDeletePortfolioItem(item.id)}>
                                <Trash2 size={13} />
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

          {/* TAB: SNAPSHOTS */}
          {activeTab === 'snapshots' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Storico dei prezzi</h3>
                <button className="btn btn-secondary btn-sm" onClick={handleCreateSnapshot}>
                  <Activity size={13} /> Registra snapshot
                </button>
              </div>

              {card.snapshots?.length === 0 ? (
                <div className="empty-state">
                  <Activity />
                  <h3>Nessuno snapshot salvato</h3>
                  <p>Registra uno snapshot per fissare i valori di mercato di oggi e costruire lo storico dei prezzi.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th style={{ textAlign: 'right' }}>Medio</th>
                        <th style={{ textAlign: 'right' }}>Mediano</th>
                        <th style={{ textAlign: 'right' }}>Min – Max</th>
                        <th style={{ textAlign: 'right' }}>Fascia equa</th>
                        <th style={{ textAlign: 'right' }}>Campioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {card.snapshots.map((s: any) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600 }}>{formatDate(s.date)}</td>
                          <td style={{ textAlign: 'right' }}>{s.averagePrice ? fmt(s.averagePrice) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{s.medianPrice ? fmt(s.medianPrice) : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{s.minPrice && s.maxPrice ? `${fmt(s.minPrice)} – ${fmt(s.maxPrice)}` : '—'}</td>
                          <td style={{ textAlign: 'right', color: 'var(--positive)' }}>{s.fairLow && s.fairHigh ? `${fmt(s.fairLow)} – ${fmt(s.fairHigh)}` : '—'}</td>
                          <td style={{ textAlign: 'right' }}>{s.listingOrSampleCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: ALERTS */}
          {activeTab === 'notes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15 }}>Avvisi di prezzo</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowAddAlert(v => !v)}>
                  <Plus size={13} /> Nuovo avviso
                </button>
              </div>

              {showAddAlert && (
                <form onSubmit={handleAddAlert} className="card" style={{ marginBottom: 20 }}>
                  <div className="section-title">Imposta un prezzo obiettivo</div>
                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label>Prezzo obiettivo*</label>
                      <input type="number" step="0.01" className="form-control" placeholder="es. 400,00" value={alertForm.targetPrice} onChange={e => setAlertForm({ ...alertForm, targetPrice: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Valuta</label>
                      <select className="form-control" value={alertForm.currency} onChange={e => setAlertForm({ ...alertForm, currency: e.target.value })}>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Marketplace</label>
                      <select className="form-control" value={alertForm.marketplace} onChange={e => setAlertForm({ ...alertForm, marketplace: e.target.value })}>
                        <option value="VINTED">Vinted</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="CARDMARKET">Cardmarket</option>
                        <option value="PRIVATE">Privato</option>
                        <option value="ALL">Qualsiasi</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" type="button" onClick={() => setShowAddAlert(false)}>Annulla</button>
                    <button className="btn btn-primary" type="submit">Imposta avviso</button>
                  </div>
                </form>
              )}

              {card.alerts?.length === 0 ? (
                <div className="empty-state">
                  <AlertTriangle />
                  <h3>Nessun avviso configurato</h3>
                  <p>Imposta un prezzo obiettivo per essere avvisato quando un’offerta scende sotto la soglia.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {card.alerts.map((a: any) => (
                    <div key={a.id} className="card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prezzo obiettivo</div>
                          <div className="num" style={{ fontSize: 15.5, fontWeight: 600, marginTop: 2 }}>
                            Sotto {formatMoney(a.targetPrice, a.currency || 'EUR')}
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 10 }}>
                              {a.marketplace || 'Qualsiasi piattaforma'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {a.triggered ? (
                            <span className="badge badge-positive">Soglia raggiunta</span>
                          ) : (
                            <span className="badge badge-neutral">Monitoraggio attivo</span>
                          )}
                          <button className="btn btn-ghost btn-icon" style={{ color: 'var(--negative)' }} aria-label="Elimina avviso" onClick={() => handleDeleteAlert(a.id)}>
                            <Trash2 size={13} />
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
