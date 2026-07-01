import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Calendar, AlertTriangle,
  Trash2, Edit3, Loader2, ShieldAlert, ArrowRight,
} from 'lucide-react';
import {
  apiGetWeeklyStrategies,
  apiCreateWeeklyStrategy, apiUpdateWeeklyStrategy,
  apiDeleteWeeklyStrategy, apiGetCards,
} from '../api/client';
import { formatDate } from '../utils/format';

interface WeeklyStrategyPageProps {
  onNavigateToCard: (id: string) => void;
  preselectedStrategyId?: string | null;
  onClearPreselectedStrategyId?: () => void;
}

export default function WeeklyStrategyPage({
  onNavigateToCard,
  preselectedStrategyId,
  onClearPreselectedStrategyId,
}: WeeklyStrategyPageProps) {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formFields, setFormFields] = useState({
    id: '',
    title: '',
    weekStartDate: new Date().toISOString().split('T')[0],
    weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    marketSummary: '',
    cardsToWatch: '',
    cardsToAvoid: '',
    buyZoneNotes: '',
    sellZoneNotes: '',
    riskNotes: '',
    selectedCardIds: [] as string[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await apiGetWeeklyStrategies();
      setStrategies(list);

      const allCards = await apiGetCards();
      setCards(allCards);

      if (list.length > 0) {
        if (preselectedStrategyId) {
          const match = list.find(s => s.id === preselectedStrategyId);
          if (match) {
            setSelectedStrategy(match);
            onClearPreselectedStrategyId?.();
            return;
          }
        }
        setSelectedStrategy(list[0]);
      } else {
        setSelectedStrategy(null);
      }
    } catch (err) {
      console.error('Error fetching strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (preselectedStrategyId && strategies.length > 0) {
      const match = strategies.find(s => s.id === preselectedStrategyId);
      if (match) {
        setSelectedStrategy(match);
        onClearPreselectedStrategyId?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedStrategyId, strategies]);

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormFields({
      id: '',
      title: 'Nota strategica settimanale',
      weekStartDate: new Date().toISOString().split('T')[0],
      weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      marketSummary: '',
      cardsToWatch: '',
      cardsToAvoid: '',
      buyZoneNotes: '',
      sellZoneNotes: '',
      riskNotes: '',
      selectedCardIds: [],
    });
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditMode(true);
    let cardsIds: string[] = [];
    try {
      cardsIds = s.relatedCardIdsJson ? JSON.parse(s.relatedCardIdsJson) : [];
    } catch (e) {
      console.warn('Error parsing related card ids', e);
    }

    setFormFields({
      id: s.id,
      title: s.title,
      weekStartDate: new Date(s.weekStartDate).toISOString().split('T')[0],
      weekEndDate: new Date(s.weekEndDate).toISOString().split('T')[0],
      marketSummary: s.marketSummary,
      cardsToWatch: s.cardsToWatch,
      cardsToAvoid: s.cardsToAvoid,
      buyZoneNotes: s.buyZoneNotes,
      sellZoneNotes: s.sellZoneNotes,
      riskNotes: s.riskNotes,
      selectedCardIds: cardsIds,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questa nota strategica?')) return;
    try {
      await apiDeleteWeeklyStrategy(id);
      await fetchData();
    } catch (err: any) {
      alert(`Eliminazione non riuscita: ${err.message}`);
    }
  };

  const handleToggleCard = (cardId: string) => {
    const activeIds = [...formFields.selectedCardIds];
    const idx = activeIds.indexOf(cardId);
    if (idx >= 0) {
      activeIds.splice(idx, 1);
    } else {
      activeIds.push(cardId);
    }
    setFormFields({ ...formFields, selectedCardIds: activeIds });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        title: formFields.title,
        weekStartDate: formFields.weekStartDate,
        weekEndDate: formFields.weekEndDate,
        marketSummary: formFields.marketSummary,
        cardsToWatch: formFields.cardsToWatch,
        cardsToAvoid: formFields.cardsToAvoid,
        buyZoneNotes: formFields.buyZoneNotes,
        sellZoneNotes: formFields.sellZoneNotes,
        riskNotes: formFields.riskNotes,
        relatedCardIdsJson: JSON.stringify(formFields.selectedCardIds),
      };

      if (editMode) {
        const updated = await apiUpdateWeeklyStrategy(formFields.id, payload);
        setShowForm(false);
        const list = await apiGetWeeklyStrategies();
        setStrategies(list);
        const match = list.find(s => s.id === updated.id);
        if (match) setSelectedStrategy(match);
      } else {
        const created = await apiCreateWeeklyStrategy(payload);
        setShowForm(false);
        const list = await apiGetWeeklyStrategies();
        setStrategies(list);
        const match = list.find(s => s.id === created.id);
        if (match) setSelectedStrategy(match);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operazione non riuscita');
    } finally {
      setSubmitting(false);
    }
  };

  const getRelatedCards = (relatedIdsStr: string) => {
    if (!relatedIdsStr) return [];
    try {
      const ids: string[] = JSON.parse(relatedIdsStr);
      return cards.filter(c => ids.includes(c.id));
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--text-secondary)', gap: 8 }}>
        <Loader2 className="spin-anim" size={18} />
        Caricamento delle note strategiche…
      </div>
    );
  }

  const relatedCards = selectedStrategy ? getRelatedCards(selectedStrategy.relatedCardIdsJson) : [];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Strategia settimanale</h1>
          <p>Note d’analisi personali: sintesi di mercato, zone da verificare, rischi</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={15} /> Nuova nota
        </button>
      </div>

      <div className="notice notice-warn" style={{ marginBottom: 24 }}>
        <ShieldAlert size={14} />
        <span>
          Note personali di monitoraggio, non consulenza finanziaria. Nessuna garanzia di rendimento.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 24 }} className="strategy-grid">
        {/* Left: history */}
        <div>
          <div className="section-title">Archivio note</div>

          {strategies.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Nessuna nota pubblicata.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {strategies.map(s => {
                const isActive = selectedStrategy?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStrategy(s)}
                    style={{
                      textAlign: 'left', padding: '11px 13px', cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)', fontFamily: 'inherit',
                      border: `1px solid ${isActive ? 'var(--accent-border)' : 'var(--border)'}`,
                      background: isActive ? 'var(--accent-bg)' : 'var(--bg-raised)',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                      <Calendar size={10} />
                      {formatDate(s.weekStartDate)} – {formatDate(s.weekEndDate)}
                    </span>
                    <span style={{ display: 'block', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                      {s.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: selected note */}
        <div style={{ minWidth: 0 }}>
          {!selectedStrategy ? (
            <div className="empty-state">
              <BookOpen />
              <h3>Nessuna nota selezionata</h3>
              <p>Pubblica una nota settimanale con osservazioni di mercato, zone d’acquisto da verificare e rischi.</p>
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                <Plus size={14} /> Scrivi la prima nota
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 28 }}>
              {/* Note header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, borderBottom: '1px solid var(--border)', paddingBottom: 18, marginBottom: 22 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 5 }}>
                    <Calendar size={12} />
                    <span>Settimana {formatDate(selectedStrategy.weekStartDate)} – {formatDate(selectedStrategy.weekEndDate)}</span>
                    {selectedStrategy.updatedAt && (
                      <span>· Ultimo aggiornamento {formatDate(selectedStrategy.updatedAt)}</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: 19 }}>{selectedStrategy.title}</h2>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(selectedStrategy)}>
                    <Edit3 size={13} /> Modifica
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--negative)' }} onClick={() => handleDelete(selectedStrategy.id)}>
                    <Trash2 size={13} /> Elimina
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Market summary */}
                <section>
                  <div className="section-title" style={{ marginBottom: 8 }}>Sintesi di mercato</div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {selectedStrategy.marketSummary}
                  </p>
                </section>

                {/* Watch / avoid */}
                <div className="grid-cols-2" style={{ gap: 14 }}>
                  <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--positive-bg)', border: '1px solid var(--positive-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--positive)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Da osservare</div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.cardsToWatch || '—'}
                    </p>
                  </div>

                  <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--negative-bg)', border: '1px solid var(--negative-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--negative)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Da evitare</div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.cardsToAvoid || '—'}
                    </p>
                  </div>
                </div>

                {/* Buy / sell zones */}
                <div className="grid-cols-2" style={{ gap: 14 }}>
                  <section>
                    <div className="section-title" style={{ marginBottom: 8 }}>Zone d’acquisto da verificare</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.buyZoneNotes || '—'}
                    </p>
                  </section>

                  <section>
                    <div className="section-title" style={{ marginBottom: 8 }}>Zone di vendita da verificare</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.sellZoneNotes || '—'}
                    </p>
                  </section>
                </div>

                {/* Risks */}
                {selectedStrategy.riskNotes && (
                  <div style={{ padding: 14, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--warn-bg)', border: '1px solid var(--warn-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <AlertTriangle size={12} /> Rischi e osservazioni
                    </div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.riskNotes}
                    </p>
                  </div>
                )}

                {/* Related cards */}
                {relatedCards.length > 0 && (
                  <section style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                    <div className="section-title">Carte collegate della watchlist</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {relatedCards.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => onNavigateToCard(c.id)}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                            background: 'var(--bg-surface)', transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                        >
                          <span style={{ minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{c.setName} · {c.cardNumber}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-secondary)', flexShrink: 0 }}>
                            Apri dettaglio <ArrowRight size={12} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content" style={{ width: 680 }}>
            <div className="modal-header">
              <h2>{editMode ? 'Modifica nota strategica' : 'Nuova nota strategica'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Chiudi">×</button>
            </div>

            {formError && (
              <div className="notice notice-error" style={{ marginBottom: 16 }} role="alert">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titolo*</label>
                <input
                  type="text"
                  className="form-control"
                  value={formFields.title}
                  onChange={e => setFormFields({ ...formFields, title: e.target.value })}
                  placeholder="es. Outlook alt-art Romance Dawn"
                  required
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Inizio settimana*</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formFields.weekStartDate}
                    onChange={e => setFormFields({ ...formFields, weekStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fine settimana*</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formFields.weekEndDate}
                    onChange={e => setFormFields({ ...formFields, weekEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sintesi di mercato*</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formFields.marketSummary}
                  onChange={e => setFormFields({ ...formFields, marketSummary: e.target.value })}
                  placeholder="Volumi, trend generali, osservazioni della settimana…"
                  required
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Da osservare</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formFields.cardsToWatch}
                    onChange={e => setFormFields({ ...formFields, cardsToWatch: e.target.value })}
                    placeholder="Carte in zona di osservazione…"
                  />
                </div>
                <div className="form-group">
                  <label>Da evitare</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formFields.cardsToAvoid}
                    onChange={e => setFormFields({ ...formFields, cardsToAvoid: e.target.value })}
                    placeholder="Carte con rischio ristampa o in calo…"
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Zone d’acquisto da verificare</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formFields.buyZoneNotes}
                    onChange={e => setFormFields({ ...formFields, buyZoneNotes: e.target.value })}
                    placeholder="es. Shanks Alt Art: zona 380–410 €"
                  />
                </div>
                <div className="form-group">
                  <label>Zone di vendita da verificare</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formFields.sellZoneNotes}
                    onChange={e => setFormFields({ ...formFields, sellZoneNotes: e.target.value })}
                    placeholder="es. Nami Parallel: sopra 210 €"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Rischi e avvertenze</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={formFields.riskNotes}
                  onChange={e => setFormFields({ ...formFields, riskNotes: e.target.value })}
                  placeholder="Contraffazioni, vulnerabilità delle piattaforme, spedizioni…"
                />
              </div>

              <div className="form-group">
                <label>Carte collegate della watchlist</label>
                <div style={{
                  maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: 12, display: 'flex', flexDirection: 'column', gap: 7,
                  backgroundColor: 'var(--bg-input)',
                }}>
                  {cards.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Nessuna carta in watchlist.</p>
                  ) : (
                    cards.map(c => {
                      const isChecked = formFields.selectedCardIds.includes(c.id);
                      return (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5 }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCard(c.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{c.name} ({c.cardNumber}) · {c.setName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Annulla</button>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Salvataggio…' : editMode ? 'Salva modifiche' : 'Pubblica nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .strategy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
