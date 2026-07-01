import { useState, useEffect, useMemo } from 'react';
import {
  Edit3, Trash2, Plus, Search, LayoutGrid, List, Loader2, Inbox,
} from 'lucide-react';
import { apiGetCards, apiDeleteCard } from '../api/client';
import { formatMoney, statusLabel, opportunityLabel } from '../utils/format';

interface WatchlistProps {
  settings: { currency: string };
  onNavigateToDetail: (id: string) => void;
  onNavigateToEdit: (id: string) => void;
  onNavigateToAdd: () => void;
}

const STATUS_OPTIONS = [
  { value: 'All', label: 'Stato: tutti' },
  { value: 'WATCH', label: 'In osservazione' },
  { value: 'CONSIDER', label: 'Da valutare' },
  { value: 'OWNED', label: 'In portafoglio' },
  { value: 'SELL', label: 'Da vendere' },
  { value: 'AVOID', label: 'Da evitare' },
];

export default function Watchlist({ settings, onNavigateToDetail, onNavigateToEdit, onNavigateToAdd }: WatchlistProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGame, setFilterGame] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterOpportunity, setFilterOpportunity] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'price'>('score');

  const fetchCards = async () => {
    try {
      setError(null);
      const data = await apiGetCards();
      setCards(data);
    } catch (err: any) {
      console.error('Error fetching watchlist:', err);
      setError(err.message || 'Impossibile caricare la watchlist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Rimuovere questa carta e tutti i prezzi/offerte registrati?')) return;
    try {
      await apiDeleteCard(id);
      fetchCards();
    } catch (err: any) {
      alert(`Eliminazione non riuscita: ${err.message}`);
    }
  };

  const gamesList = useMemo(() => [...new Set(cards.map(c => c.game))], [cards]);

  const filteredCards = useMemo(() => {
    let list = [...cards];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c => c.name.toLowerCase().includes(q)
          || c.cardNumber.toLowerCase().includes(q)
          || c.setName.toLowerCase().includes(q),
      );
    }
    if (filterGame !== 'All') list = list.filter(c => c.game === filterGame);
    if (filterStatus !== 'All') list = list.filter(c => c.status === filterStatus);
    if (filterOpportunity !== 'All') {
      list = list.filter(c => c.bestOpportunityLabel === filterOpportunity.toLowerCase());
    }

    if (sortBy === 'score') {
      list.sort((a, b) => b.bestOpportunityScore - a.bestOpportunityScore);
    } else if (sortBy === 'price') {
      list.sort((a, b) => b.fairRange.referencePrice - a.fairRange.referencePrice);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [cards, searchQuery, filterGame, filterStatus, filterOpportunity, sortBy]);

  const hasActiveFilters = searchQuery !== '' || filterGame !== 'All' || filterStatus !== 'All' || filterOpportunity !== 'All';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterGame('All');
    setFilterStatus('All');
    setFilterOpportunity('All');
    setSortBy('score');
  };

  const cur = settings.currency;

  const renderFairRange = (c: any) => {
    if (!c.fairRange || c.fairRange.referencePrice <= 0) {
      return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    }
    return (
      <span className="num" style={{ fontWeight: 500 }}>
        {formatMoney(c.fairRange.fairLow, cur, c.fairRange.currency)} – {formatMoney(c.fairRange.fairHigh, cur, c.fairRange.currency)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', justifyContent: 'center', height: '40vh' }}>
        <Loader2 className="spin-anim" size={18} />
        <span>Caricamento della watchlist…</span>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Watchlist</h1>
          <p>{cards.length} {cards.length === 1 ? 'elemento monitorato' : 'elementi monitorati'} · aggiorna ogni pochi giorni ciò che merita attenzione</p>
        </div>
        <div className="header-actions">
          <div className="segmented" role="group" aria-label="Modalità di visualizzazione">
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Vista elenco" aria-label="Vista elenco">
              <List size={15} />
            </button>
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} title="Vista griglia" aria-label="Vista griglia">
              <LayoutGrid size={15} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={onNavigateToAdd}>
            <Plus size={15} /> Nuova carta
          </button>
        </div>
      </div>

      {error && (
        <div className="notice notice-error" style={{ marginBottom: 20 }} role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={14} />
          <input
            type="text"
            className="form-control"
            placeholder="Cerca per nome, codice o set…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="form-control" value={filterGame} onChange={(e) => setFilterGame(e.target.value)} aria-label="Filtra per gioco">
          <option value="All">Gioco: tutti</option>
          {gamesList.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filtra per stato">
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select className="form-control" value={filterOpportunity} onChange={(e) => setFilterOpportunity(e.target.value)} aria-label="Filtra per segnale">
          <option value="All">Segnale: tutti</option>
          <option value="Strong opportunity to verify">Opportunità</option>
          <option value="Interesting">Interessante</option>
          <option value="Watch">Da osservare</option>
          <option value="Avoid">Da evitare</option>
        </select>

        <select className="form-control" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} aria-label="Ordinamento">
          <option value="score">Ordina: segnale</option>
          <option value="price">Ordina: valore</option>
          <option value="date">Ordina: più recenti</option>
        </select>

        {hasActiveFilters && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            Azzera filtri
          </button>
        )}
      </div>

      {/* Content */}
      {filteredCards.length === 0 ? (
        <div className="empty-state">
          <Inbox />
          {cards.length === 0 ? (
            <>
              <h3>La watchlist è vuota</h3>
              <p>Aggiungi le carte o i prodotti che ritieni possano crescere di valore per iniziare a monitorarli.</p>
              <button className="btn btn-primary" onClick={onNavigateToAdd}>
                <Plus size={14} /> Aggiungi la prima carta
              </button>
            </>
          ) : (
            <>
              <h3>Nessun risultato</h3>
              <p>Nessun elemento corrisponde ai filtri o alla ricerca attuale.</p>
              <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
                Azzera filtri
              </button>
            </>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ------- List view (default): fast scan ------- */
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Carta</th>
                <th>Set</th>
                <th>Stato</th>
                <th>Segnale</th>
                <th style={{ textAlign: 'right' }}>Valore stimato</th>
                <th style={{ textAlign: 'right' }}>Fascia equa</th>
                <th aria-label="Azioni" />
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(c => {
                const st = statusLabel(c.status);
                const opp = c.bestOpportunityScore > 0 ? opportunityLabel(c.bestOpportunityLabel) : null;
                return (
                  <tr key={c.id} className="row-link" onClick={() => onNavigateToDetail(c.id)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt="" loading="lazy" style={{ width: 26, height: 36, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 26, height: 36, borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.cardNumber} · {c.rarity}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.setName}</td>
                    <td><span className={`badge ${st.className}`}>{st.label}</span></td>
                    <td>
                      {opp ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <span className="num" style={{ fontWeight: 600 }}>{c.bestOpportunityScore}</span>
                          <span className={`badge ${opp.className}`}>{opp.label}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Nessuna offerta</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {c.fairRange.referencePrice > 0 ? (
                        <span className="num" style={{ fontWeight: 600 }}>
                          {formatMoney(c.fairRange.referencePrice, cur, c.fairRange.currency)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{renderFairRange(c)}</td>
                    <td onClick={e => e.stopPropagation()} style={{ width: 84 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-icon" title="Modifica" aria-label="Modifica" onClick={() => onNavigateToEdit(c.id)}>
                          <Edit3 size={13} />
                        </button>
                        <button className="btn btn-ghost btn-icon" title="Elimina" aria-label="Elimina" style={{ color: 'var(--negative)' }} onClick={(e) => handleDelete(c.id, e)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ------- Grid view ------- */
        <div className="grid-cols-4">
          {filteredCards.map(c => {
            const st = statusLabel(c.status);
            const opp = c.bestOpportunityScore > 0 ? opportunityLabel(c.bestOpportunityLabel) : null;
            return (
              <div key={c.id} className="wl-card" onClick={() => onNavigateToDetail(c.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                  <span className={`badge ${st.className}`} style={{ fontSize: 10 }}>{st.label}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>{c.cardNumber}</span>
                </div>

                <div className="wl-thumb">
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} loading="lazy" />
                  ) : (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Nessuna immagine</span>
                  )}
                  {c.bestOpportunityScore > 0 && (
                    <span className="badge badge-positive num" style={{ position: 'absolute', bottom: 7, right: 7, fontSize: 10.5 }}>
                      {c.bestOpportunityScore}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.setName}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valore stimato</div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {c.fairRange.referencePrice > 0
                        ? formatMoney(c.fairRange.referencePrice, cur, c.fairRange.currency)
                        : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>n.d.</span>}
                    </div>
                  </div>
                  {opp && <span className={`badge ${opp.className}`} style={{ fontSize: 10 }}>{opp.label}</span>}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => onNavigateToEdit(c.id)}>
                    <Edit3 size={12} /> Modifica
                  </button>
                  <button className="btn btn-ghost btn-icon" style={{ color: 'var(--negative)' }} aria-label="Elimina" onClick={(e) => handleDelete(c.id, e)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
