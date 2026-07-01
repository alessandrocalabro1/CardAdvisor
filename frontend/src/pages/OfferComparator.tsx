import { useState, useEffect, useMemo } from 'react';
import { Scale, AlertTriangle, ExternalLink, ArrowRight, Loader2 } from 'lucide-react';
import { apiGetCards, apiGetCardById } from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';
import { currencySymbol, opportunityLabelFromScore, levelLabel } from '../utils/format';

interface OfferComparatorProps {
  onNavigateToCard: (id: string) => void;
}

export default function OfferComparator({ onNavigateToCard }: OfferComparatorProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [cardDetails, setCardDetails] = useState<any | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'price'>('score');

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await apiGetCards();
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
      } finally {
        setLoadingCards(false);
      }
    };
    fetchCards();
  }, []);

  useEffect(() => {
    if (!selectedCardId) return;

    const fetchDetails = async () => {
      setLoadingDetails(true);
      try {
        const data = await apiGetCardById(selectedCardId);
        setCardDetails(data);
      } catch (err) {
        console.error('Error fetching card details:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [selectedCardId]);

  const sortedOffers = useMemo(() => {
    if (!cardDetails || !cardDetails.offers) return [];
    const list = [...cardDetails.offers];
    if (sortBy === 'price') {
      return list.sort((a, b) => a.totalPrice - b.totalPrice);
    }
    return list.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [cardDetails, sortBy]);

  if (loadingCards) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', justifyContent: 'center', height: '40vh' }}>
        <Loader2 className="spin-anim" size={18} />
        <span>Caricamento del catalogo…</span>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 1080 }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Comparatore offerte</h1>
          <p>Confronta fianco a fianco le offerte registrate per una carta</p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <Scale />
          <h3>Nessuna carta da confrontare</h3>
          <p>Aggiungi carte alla watchlist e registra le offerte trovate per confrontarle qui.</p>
        </div>
      ) : (
        <>
          {/* Selector toolbar */}
          <div className="toolbar" style={{ marginBottom: 24 }}>
            <select
              className="form-control"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              style={{ flex: 1, minWidth: 240, width: 'auto' }}
              aria-label="Seleziona una carta"
            >
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cardNumber}) · {c.setName}
                </option>
              ))}
            </select>
            <div className="segmented" role="group" aria-label="Ordinamento">
              <button className={sortBy === 'score' ? 'active' : ''} onClick={() => setSortBy('score')} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                Per segnale
              </button>
              <button className={sortBy === 'price' ? 'active' : ''} onClick={() => setSortBy('price')} style={{ padding: '7px 12px', fontSize: 12.5 }}>
                Per prezzo
              </button>
            </div>
          </div>

          {loadingDetails ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 40, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <Loader2 className="spin-anim" size={16} />
              Valutazione delle offerte…
            </div>
          ) : cardDetails ? (
            <div>
              {/* Card summary strip */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: 16.5, marginBottom: 3 }}>{cardDetails.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>
                      {cardDetails.setName} · {cardDetails.cardNumber} · {cardDetails.rarity} · {cardDetails.language}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 28 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Riferimento</div>
                      <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>
                        {currencySymbol(cardDetails.fairRange.currency)}{cardDetails.fairRange.referencePrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fascia equa stimata</div>
                      <div className="num" style={{ fontSize: 18, fontWeight: 600, color: 'var(--positive)' }}>
                        {currencySymbol(cardDetails.fairRange.currency)}{cardDetails.fairRange.fairLow.toFixed(2)} – {currencySymbol(cardDetails.fairRange.currency)}{cardDetails.fairRange.fairHigh.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {sortedOffers.length === 0 ? (
                <div className="empty-state">
                  <Scale />
                  <h3>Nessuna offerta registrata</h3>
                  <p>Per questa carta non ci sono ancora offerte da confrontare. Registrale dalla pagina di dettaglio.</p>
                  <button className="btn btn-primary" onClick={() => onNavigateToCard(cardDetails.id)}>
                    Apri il dettaglio <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="grid-cols-3">
                  {sortedOffers.map((o, idx) => {
                    const parsedReasons = o.suspiciousReasonsJson ? JSON.parse(o.suspiciousReasonsJson) : [];
                    const opp = opportunityLabelFromScore(o.opportunityScore);
                    const sym = currencySymbol(o.currency);
                    return (
                      <div
                        key={o.id}
                        className="card"
                        style={{
                          display: 'flex', flexDirection: 'column', position: 'relative',
                          borderColor: o.isSuspicious ? 'var(--negative-border)' : idx === 0 && sortBy === 'score' ? 'var(--accent-border)' : undefined,
                        }}
                      >
                        <div style={{ position: 'absolute', top: 12, right: 14, fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)' }}>
                          #{idx + 1}
                        </div>

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span className="badge badge-neutral">{o.marketplace}</span>
                            {renderDataQualityBadge(o.dataQuality)}
                          </div>
                          <h3 style={{ fontSize: 13.5, fontWeight: 600, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>
                            {o.title}
                          </h3>
                        </div>

                        {/* Pricing */}
                        <div style={{
                          padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                          marginBottom: 14,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Carta</span>
                            <span className="num" style={{ fontWeight: 500 }}>{sym}{o.price.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 12 }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Spedizione</span>
                            <span className="num" style={{ color: 'var(--text-secondary)' }}>+{sym}{o.shipping.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 7, borderTop: '1px solid var(--border)', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 600, fontSize: 12 }}>Totale</span>
                            <span className="num" style={{ fontWeight: 600, fontSize: 16.5 }}>
                              {sym}{o.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Punteggio</div>
                            <div className="num" style={{ fontSize: 17, fontWeight: 600 }}>
                              {o.opportunityScore} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/ 100</span>
                            </div>
                          </div>
                          <span className={`badge ${opp.className}`}>{opp.label}</span>
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Condizione</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{o.condition}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Lingua</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{o.language}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Affidabilità venditore</span>
                            <span style={{ color: o.sellerReliability === 'HIGH' ? 'var(--positive)' : o.sellerReliability === 'LOW' ? 'var(--negative)' : 'var(--warn)' }}>
                              {levelLabel(o.sellerReliability)}
                            </span>
                          </div>
                        </div>

                        {o.isSuspicious && (
                          <div className="notice notice-error" style={{ marginBottom: 14, fontSize: 11.5 }}>
                            <AlertTriangle size={12} />
                            <div>
                              <strong>Segnali sospetti:</strong>
                              <ul style={{ paddingLeft: 14, marginTop: 3 }}>
                                {parsedReasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                          {o.url && (
                            <a href={o.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                              <ExternalLink size={12} /> Annuncio
                            </a>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => onNavigateToCard(cardDetails.id)} style={{ flex: 1 }}>
                            Dettaglio
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>Seleziona una carta valida.</div>
          )}
        </>
      )}
    </div>
  );
}
