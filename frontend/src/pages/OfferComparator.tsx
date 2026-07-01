import { useState, useEffect } from 'react';
import { 
  Scale, AlertTriangle, ExternalLink, ArrowRight 
} from 'lucide-react';
import { apiGetCards, apiGetCardById } from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';

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

  const handleCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCardId(e.target.value);
  };

  const getSortedOffers = () => {
    if (!cardDetails || !cardDetails.offers) return [];
    const list = [...cardDetails.offers];

    if (sortBy === 'price') {
      return list.sort((a, b) => a.totalPrice - b.totalPrice);
    }
    // Default sort by opportunity score (descending)
    return list.sort((a, b) => b.opportunityScore - a.opportunityScore);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <span className="badge badge-opportunity">Strong Opportunity</span>;
    if (score >= 60) return <span className="badge badge-interesting">Interesting</span>;
    if (score >= 40) return <span className="badge badge-watch">Watch</span>;
    return <span className="badge badge-avoid">Avoid</span>;
  };

  if (loadingCards) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading catalog...</div>;
  }

  const sortedOffers = getSortedOffers();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Offer Comparator</h1>
          <p>Compare private and marketplace listings side-by-side for a selected card</p>
        </div>
      </div>

      {/* Card Selector Card */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '260px' }}>
            <label>Select a Card to Compare Listings</label>
            <select 
              className="form-control" 
              value={selectedCardId} 
              onChange={handleCardChange}
            >
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.cardNumber}) - {c.setName}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button 
              className={`btn ${sortBy === 'score' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSortBy('score')}
            >
              Rank by Opportunity
            </button>
            <button 
              className={`btn ${sortBy === 'price' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSortBy('price')}
            >
              Rank by Total Price
            </button>
          </div>
        </div>
      </div>

      {loadingDetails ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
          Evaluating price metrics and listings...
        </div>
      ) : cardDetails ? (
        <div>
          {/* Card Meta Overview Banner */}
          <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '4px' }}>{cardDetails.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                  {cardDetails.setName} • Card #: {cardDetails.cardNumber} • Rarity: {cardDetails.rarity} • Language: {cardDetails.language}
                </p>
              </div>

              {/* Fair Range Metric */}
              <div style={{ display: 'flex', gap: '32px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference Price</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'white' }}>
                    {cardDetails.fairRange.currency === 'EUR' ? '€' : '$'}
                    {cardDetails.fairRange.referencePrice.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Fair Range</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-opportunity)' }}>
                    {cardDetails.fairRange.currency === 'EUR' ? '€' : '$'}
                    {cardDetails.fairRange.fairLow.toFixed(2)} - {cardDetails.fairRange.currency === 'EUR' ? '€' : '$'}{cardDetails.fairRange.fairHigh.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side Grid */}
          {sortedOffers.length === 0 ? (
            <div className="empty-state">
              <Scale size={48} />
              <h3>No Offers Found</h3>
              <p>There are no marketplace or private offers recorded for this card yet. Head to the card detail view to add some offers!</p>
              <button 
                className="btn btn-primary"
                onClick={() => onNavigateToCard(cardDetails.id)}
              >
                Go to Card Detail View
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="grid-cols-3">
              {sortedOffers.map((o, idx) => {
                const parsedReasons = o.suspiciousReasonsJson ? JSON.parse(o.suspiciousReasonsJson) : [];
                return (
                  <div 
                    key={o.id} 
                    className={`card ${o.opportunityScore >= 80 ? 'card-glow-strong' : ''}`}
                    style={{ 
                      display: 'flex', flexDirection: 'column', 
                      position: 'relative', borderTop: o.isSuspicious ? '3px solid var(--color-suspicious)' : undefined 
                    }}
                  >
                    {/* Rank Ribbon */}
                    <div style={{ 
                      position: 'absolute', top: '12px', right: '16px', 
                      fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' 
                    }}>
                      Rank #{idx + 1}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span className="badge badge-gray">
                          {o.marketplace}
                        </span>
                        {renderDataQualityBadge(o.dataQuality)}
                      </div>
                      <h3 style={{ color: 'white', fontSize: '16px', minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {o.title}
                      </h3>
                    </div>

                    {/* Pricing */}
                    <div style={{ 
                      padding: '12px 16px', borderRadius: '6px', 
                      backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)',
                      marginBottom: '16px' 
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Card Price:</span>
                        <span style={{ color: 'white', fontWeight: '500' }}>{o.currency === 'EUR' ? '€' : '$'}{o.price.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Shipping:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>+{o.currency === 'EUR' ? '€' : '$'}{o.shipping.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Total Cost:</span>
                        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>
                          {o.currency === 'EUR' ? '€' : '$'}{o.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Score section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opportunity Score</div>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'white', fontFamily: 'var(--font-header)' }}>
                          {o.opportunityScore} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 100</span>
                        </div>
                      </div>
                      {getScoreBadge(o.opportunityScore)}
                    </div>

                    {/* Condition details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Condition:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{o.condition}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Language:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{o.language}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Seller Reliability:</span>
                        <span style={{ color: o.sellerReliability === 'HIGH' ? 'var(--color-opportunity)' : o.sellerReliability === 'LOW' ? 'var(--color-avoid)' : 'var(--color-watch)' }}>
                          {o.sellerReliability}
                        </span>
                      </div>
                    </div>

                    {/* Suspicion list */}
                    {o.isSuspicious && (
                      <div style={{ 
                        backgroundColor: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)',
                        borderRadius: '4px', padding: '10px', marginBottom: '16px', fontSize: '12px' 
                      }}>
                        <div style={{ color: 'var(--color-suspicious)', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Suspicious Signals Detected:
                        </div>
                        <ul style={{ paddingLeft: '14px', color: 'var(--text-primary)' }}>
                          {parsedReasons.map((r: string, idx: number) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action links */}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                      {o.url && (
                        <a 
                          href={o.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ flex: 1, padding: '8px' }}
                        >
                          <ExternalLink size={12} />
                          Open Link
                        </a>
                      )}
                      <button 
                        className="btn btn-primary" 
                        onClick={() => onNavigateToCard(cardDetails.id)}
                        style={{ flex: 1, padding: '8px' }}
                      >
                        Inspect Card
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)' }}>Select a valid card catalog index.</div>
      )}
    </div>
  );
}
