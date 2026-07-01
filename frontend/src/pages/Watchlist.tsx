import { useState, useEffect } from 'react';
import { 
  Eye, Edit3, Trash2, Plus, ArrowUpDown, Filter, 
  Search, BadgeHelp, LayoutGrid, List 
} from 'lucide-react';
import { apiGetCards, apiDeleteCard } from '../api/client';
import { renderDataQualityBadge } from '../utils/transparency';

interface WatchlistProps {
  settings: { currency: string };
  onNavigateToDetail: (id: string) => void;
  onNavigateToEdit: (id: string) => void;
  onNavigateToAdd: () => void;
}

export default function Watchlist({ settings, onNavigateToDetail, onNavigateToEdit, onNavigateToAdd }: WatchlistProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRarity, setFilterRarity] = useState('All');
  const [filterLanguage, setFilterLanguage] = useState('All');
  const [filterOpportunity, setFilterOpportunity] = useState('All');

  // Sort State
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'price'>('score');

  const fetchCards = async () => {
    try {
      const data = await apiGetCards();
      setCards(data);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this card and all its logged prices/offers?')) return;
    try {
      await apiDeleteCard(id);
      fetchCards();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Get distinct values for filter lists
  const gamesList = ['All', ...new Set(cards.map(c => c.game))];
  const raritiesList = ['All', ...new Set(cards.map(c => c.rarity))];
  const languagesList = ['All', ...new Set(cards.map(c => c.language))];
  const statusesList = ['All', 'WATCH', 'CONSIDER', 'OWNED', 'SELL', 'AVOID'];

  const getFilteredCards = () => {
    let list = [...cards];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || c.cardNumber.toLowerCase().includes(q) || c.setName.toLowerCase().includes(q)
      );
    }

    // Dropdown filters
    if (filterGame !== 'All') {
      list = list.filter(c => c.game === filterGame);
    }
    if (filterStatus !== 'All') {
      list = list.filter(c => c.status === filterStatus);
    }
    if (filterRarity !== 'All') {
      list = list.filter(c => c.rarity === filterRarity);
    }
    if (filterLanguage !== 'All') {
      list = list.filter(c => c.language === filterLanguage);
    }
    if (filterOpportunity !== 'All') {
      list = list.filter(c => c.bestOpportunityLabel === filterOpportunity.toLowerCase());
    }

    // Sort operations
    if (sortBy === 'score') {
      // highest opportunity score first
      list.sort((a, b) => b.bestOpportunityScore - a.bestOpportunityScore);
    } else if (sortBy === 'price') {
      // highest reference price first
      list.sort((a, b) => b.fairRange.referencePrice - a.fairRange.referencePrice);
    } else {
      // date created (newest first)
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OWNED':
        return <span className="badge badge-opportunity" style={{ fontSize: '10px' }}>Owned</span>;
      case 'WATCH':
        return <span className="badge badge-gray" style={{ fontSize: '10px' }}>Watching</span>;
      case 'CONSIDER':
        return <span className="badge badge-interesting" style={{ fontSize: '10px' }}>Consider</span>;
      case 'SELL':
        return <span className="badge badge-watch" style={{ fontSize: '10px' }}>To Sell</span>;
      default:
        return <span className="badge badge-avoid" style={{ fontSize: '10px' }}>Avoid</span>;
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading catalog database...</div>;
  }

  const filteredCards = getFilteredCards();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Tracked Catalog</h1>
          <p>Search, filter, and monitor pricing scopes for all collectibles</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
            <button 
              className="btn btn-secondary" 
              style={{ borderRadius: 0, padding: '8px 12px', border: 'none', backgroundColor: viewMode === 'grid' ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ borderRadius: 0, padding: '8px 12px', border: 'none', backgroundColor: viewMode === 'list' ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            <Plus size={16} />
            Track New Card
          </button>
        </div>
      </div>

      {/* Filters & Search Card */}
      <div className="card" style={{ marginBottom: '28px', padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Top row: Search & Sorting */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by name, number, set..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '40px' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpDown size={14} /> Sort By:
              </span>
              <select 
                className="form-control"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                style={{ width: '180px', padding: '8px 12px' }}
              >
                <option value="score">Opportunity Score</option>
                <option value="price">Reference Price</option>
                <option value="date">Date Tracked</option>
              </select>
            </div>
          </div>

          {/* Bottom row: Filter selectors */}
          <div style={{ 
            display: 'flex', gap: '16px', flexWrap: 'wrap', 
            paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <Filter size={14} /> Filter:
            </div>

            <select className="form-control" value={filterGame} onChange={(e) => setFilterGame(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}>
              <option value="All">Game: All</option>
              {gamesList.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
            </select>

            <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}>
              <option value="All">Status: All</option>
              {statusesList.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select className="form-control" value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}>
              <option value="All">Rarity: All</option>
              {raritiesList.filter(r => r !== 'All').map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select className="form-control" value={filterLanguage} onChange={(e) => setFilterLanguage(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}>
              <option value="All">Language: All</option>
              {languagesList.filter(l => l !== 'All').map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            <select className="form-control" value={filterOpportunity} onChange={(e) => setFilterOpportunity(e.target.value)} style={{ padding: '6px 12px', fontSize: '13px', width: 'auto' }}>
              <option value="All">Opportunity: All</option>
              <option value="Avoid">Avoid</option>
              <option value="Watch">Watch</option>
              <option value="Interesting">Interesting</option>
              <option value="Strong opportunity to verify">Strong Opportunity</option>
            </select>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', marginLeft: 'auto', fontSize: '12px' }}
              onClick={() => {
                setSearchQuery('');
                setFilterGame('All');
                setFilterStatus('All');
                setFilterRarity('All');
                setFilterLanguage('All');
                setFilterOpportunity('All');
                setSortBy('score');
              }}
            >
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* Catalog Display */}
      {filteredCards.length === 0 ? (
        <div className="empty-state">
          <BadgeHelp size={48} />
          <h3>No Cards Found</h3>
          <p>No cards matched your filters or search query. Adjust filters or register a new card copy to start monitoring.</p>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            <Plus size={14} /> Add Card Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid Catalog View
        <div className="grid-cols-4">
          {filteredCards.map(c => {
            const hasImage = !!c.imageUrl;
            return (
              <div 
                key={c.id} 
                className={`card ${c.bestOpportunityScore >= 80 ? 'card-glow-strong' : ''}`}
                style={{ 
                  display: 'flex', flexDirection: 'column', cursor: 'pointer',
                  padding: '16px', overflow: 'hidden' 
                }}
                onClick={() => onNavigateToDetail(c.id)}
              >
                {/* Status Badges overlay */}
                <div style={{ display: 'flex', justifyItems: 'space-between', justifyContent: 'space-between', marginBottom: '10px' }}>
                  {getStatusBadge(c.status)}
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                    {c.cardNumber}
                  </span>
                </div>

                {/* Card Art Thumbnail */}
                <div 
                  style={{ 
                    width: '100%', aspectRatio: '11 / 15', borderRadius: '6px', 
                    backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '14px', position: 'relative'
                  }}
                >
                  {hasImage ? (
                    <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No Art File</span>
                  )}
                  
                  {/* Score badge Overlay */}
                  {c.bestOpportunityScore > 0 && (
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
                      <span className="badge badge-opportunity" style={{ fontSize: '11px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        Sig: {c.bestOpportunityScore}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    {c.setName}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Fair Range:</span>
                      {c.marketPrices && c.marketPrices.length > 0 && renderDataQualityBadge(c.marketPrices[0].dataQuality)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>
                        {c.fairRange.referencePrice > 0 ? (
                          <>
                            {settings.currency === 'EUR' ? '€' : '$'}
                            {c.fairRange.fairLow.toFixed(1)} - {settings.currency === 'EUR' ? '€' : '$'}{c.fairRange.fairHigh.toFixed(1)}
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No price feed</span>
                        )}
                      </span>
                      {c.bestOpportunityScore > 0 ? getOppBadge(c.bestOpportunityLabel) : <span className="badge badge-gray">No Offers</span>}
                    </div>
                  </div>
                </div>

                {/* Actions Hover Layer */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '6px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToEdit(c.id);
                    }}
                  >
                    <Edit3 size={12} />
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ flex: 1, padding: '6px' }}
                    onClick={(e) => handleDelete(c.id, e)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        // List Table View
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Card Info</th>
                <th>Set</th>
                <th>Card Code</th>
                <th>Status</th>
                <th>Opportunity Signal</th>
                <th>Reference Price</th>
                <th>Est. Fair Range</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(c => (
                <tr key={c.id} onClick={() => onNavigateToDetail(c.id)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {c.imageUrl && (
                        <img src={c.imageUrl} alt="" style={{ width: '28px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          {c.name}
                          {c.marketPrices && c.marketPrices.length > 0 && renderDataQualityBadge(c.marketPrices[0].dataQuality)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.game} • {c.rarity}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.setName}</td>
                  <td>{c.cardNumber}</td>
                  <td>{getStatusBadge(c.status)}</td>
                  <td>
                    {c.bestOpportunityScore > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: 'white' }}>{c.bestOpportunityScore}</span>
                        {getOppBadge(c.bestOpportunityLabel)}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active offers</span>
                    )}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {c.fairRange.referencePrice > 0 ? (
                      `${settings.currency === 'EUR' ? '€' : '$'}${c.fairRange.referencePrice.toFixed(2)}`
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ color: 'var(--color-opportunity)', fontWeight: '600' }}>
                    {c.fairRange.referencePrice > 0 ? (
                      `${settings.currency === 'EUR' ? '€' : '$'}${c.fairRange.fairLow.toFixed(1)} - ${settings.currency === 'EUR' ? '€' : '$'}${c.fairRange.fairHigh.toFixed(1)}`
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => onNavigateToDetail(c.id)}>
                        <Eye size={12} />
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => onNavigateToEdit(c.id)}>
                        <Edit3 size={12} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px' }} onClick={(e) => handleDelete(c.id, e)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
