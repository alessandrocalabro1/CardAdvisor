import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Calendar, AlertTriangle, 
  Trash2, Edit3, Loader2, ShieldAlert, ArrowRight
} from 'lucide-react';
import { 
  apiGetWeeklyStrategies, 
  apiCreateWeeklyStrategy, apiUpdateWeeklyStrategy, 
  apiDeleteWeeklyStrategy, apiGetCards 
} from '../api/client';

interface WeeklyStrategyPageProps {
  onNavigateToCard: (id: string) => void;
  preselectedStrategyId?: string | null;
  onClearPreselectedStrategyId?: () => void;
}

export default function WeeklyStrategyPage({ 
  onNavigateToCard, 
  preselectedStrategyId, 
  onClearPreselectedStrategyId 
}: WeeklyStrategyPageProps) {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form modal state
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form fields state
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
    selectedCardIds: [] as string[]
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
            if (onClearPreselectedStrategyId) {
              onClearPreselectedStrategyId();
            }
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
  }, []);

  useEffect(() => {
    if (preselectedStrategyId && strategies.length > 0) {
      const match = strategies.find(s => s.id === preselectedStrategyId);
      if (match) {
        setSelectedStrategy(match);
        if (onClearPreselectedStrategyId) {
          onClearPreselectedStrategyId();
        }
      }
    }
  }, [preselectedStrategyId, strategies]);

  const handleSelectStrategy = (s: any) => {
    setSelectedStrategy(s);
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setFormFields({
      id: '',
      title: 'Weekly Strategy Outlook',
      weekStartDate: new Date().toISOString().split('T')[0],
      weekEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      marketSummary: '',
      cardsToWatch: '',
      cardsToAvoid: '',
      buyZoneNotes: '',
      sellZoneNotes: '',
      riskNotes: '',
      selectedCardIds: []
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
      selectedCardIds: cardsIds
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete these strategy notes?')) return;
    try {
      await apiDeleteWeeklyStrategy(id);
      await fetchData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
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
        relatedCardIdsJson: JSON.stringify(formFields.selectedCardIds)
      };

      if (editMode) {
        const updated = await apiUpdateWeeklyStrategy(formFields.id, payload);
        setShowForm(false);
        // Refresh strategies and select the updated one
        const list = await apiGetWeeklyStrategies();
        setStrategies(list);
        const match = list.find(s => s.id === updated.id);
        if (match) setSelectedStrategy(match);
      } else {
        const created = await apiCreateWeeklyStrategy(payload);
        setShowForm(false);
        // Refresh strategies and select new one
        const list = await apiGetWeeklyStrategies();
        setStrategies(list);
        const match = list.find(s => s.id === created.id);
        if (match) setSelectedStrategy(match);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateString = (d: string) => {
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get parsed list of related cards
  const getRelatedCards = (relatedIdsStr: string) => {
    if (!relatedIdsStr) return [];
    try {
      const ids: string[] = JSON.parse(relatedIdsStr);
      return cards.filter(c => ids.includes(c.id));
    } catch (e) {
      return [];
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
        <Loader2 className="spin-anim" size={24} style={{ marginRight: '8px' }} />
        Loading weekly strategies...
      </div>
    );
  }

  const relatedCards = selectedStrategy ? getRelatedCards(selectedStrategy.relatedCardIdsJson) : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Weekly Strategy Notes</h1>
          <p>Read risk warnings, zone guidelines, and weekly market observations</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Publish Observation Notes
        </button>
      </div>

      {/* Cautious Disclaimer Banner */}
      <div className="card" style={{ 
        borderLeft: '4px solid var(--color-watch)', padding: '14px 20px', 
        marginBottom: '32px', backgroundColor: 'rgba(245,158,11,0.05)', fontSize: '13px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ShieldAlert size={16} color="var(--color-watch)" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            <strong>Risk warning disclaimer:</strong> These are personal strategy notes for collectible tracking and do not represent financial advice. Never guarantee profits.
          </span>
        </div>
      </div>

      <div className="card-detail-layout">
        
        {/* Left Side: Historical List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '4px' }}>Historical Outlooks</h3>
          
          {strategies.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No strategy logs logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {strategies.map(s => {
                const isActive = selectedStrategy?.id === s.id;
                return (
                  <div 
                    key={s.id}
                    className={`card ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectStrategy(s)}
                    style={{ 
                      padding: '16px', cursor: 'pointer', 
                      borderColor: isActive ? 'var(--accent-primary)' : undefined,
                      backgroundColor: isActive ? 'rgba(99,102,241,0.06)' : undefined 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <Calendar size={12} />
                      <span>{formatDateString(s.weekStartDate)} - {formatDateString(s.weekEndDate)}</span>
                    </div>
                    <h4 style={{ color: isActive ? 'white' : 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>{s.title}</h4>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Observations Panel */}
        <div>
          {!selectedStrategy ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
              <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: 'white' }}>No Active Strategy Log Selected</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '350px', margin: '0 auto 16px' }}>
                Publish weekly TCG observation notes to compute buy/sell zones and monitor risk guides.
              </p>
              <button className="btn btn-primary" onClick={handleOpenCreate}>
                Publish First Strategy Note
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '32px' }}>
              
              {/* Header inside detail */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <Calendar size={14} />
                    <span>Week start: {formatDateString(selectedStrategy.weekStartDate)} • Week end: {formatDateString(selectedStrategy.weekEndDate)}</span>
                  </div>
                  <h2 style={{ color: 'white', fontSize: '24px' }}>{selectedStrategy.title}</h2>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => handleOpenEdit(selectedStrategy)}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px 12px' }} onClick={() => handleDelete(selectedStrategy.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>

              {/* Strategy Content Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* 1. Market Summary */}
                <div>
                  <h3 style={{ fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--accent-secondary)' }}>Market Summary</h3>
                  <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {selectedStrategy.marketSummary}
                  </p>
                </div>

                {/* 2. Cards to Watch & Cards to Avoid Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(16,185,129,0.03)', borderColor: 'rgba(16,185,129,0.12)' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--color-opportunity)', textTransform: 'uppercase', marginBottom: '8px' }}>Cards to Watch</h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.cardsToWatch}
                    </p>
                  </div>

                  <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.12)' }}>
                    <h4 style={{ fontSize: '13px', color: 'var(--color-avoid)', textTransform: 'uppercase', marginBottom: '8px' }}>Cards to Avoid</h4>
                    <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.cardsToAvoid}
                    </p>
                  </div>

                </div>

                {/* 3. Buy & Sell Zones Split */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  <div>
                    <h3 style={{ fontSize: '14px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Buy Zones to Verify</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.buyZoneNotes}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Sell Zones to Verify</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {selectedStrategy.sellZoneNotes}
                    </p>
                  </div>

                </div>

                {/* 4. Risk Notes */}
                <div className="card" style={{ padding: '16px', backgroundColor: 'rgba(245,158,11,0.03)', borderColor: 'rgba(245,158,11,0.12)' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--color-watch)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} /> Risk Notes & Observations
                  </h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {selectedStrategy.riskNotes}
                  </p>
                </div>

                {/* 5. Related Watchlist Cards */}
                {relatedCards.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '14px', color: 'white', marginBottom: '12px' }}>Related Cards from watchlist</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {relatedCards.map(c => (
                        <div 
                          key={c.id}
                          className="card" 
                          onClick={() => onNavigateToCard(c.id)}
                          style={{ 
                            padding: '12px 16px', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.01)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{c.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>{c.setName} • {c.cardNumber}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span>Inspect ranges</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

      </div>

      {/* Create/Edit Modal Form */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Strategy Outlook' : 'Publish Strategy Outlook'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>

            {formError && (
              <div className="card" style={{ borderLeft: '4px solid var(--color-avoid)', padding: '12px', marginBottom: '16px', backgroundColor: 'rgba(239,68,68,0.06)' }}>
                <p style={{ color: 'white', fontSize: '13px' }}>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label>Strategy Outlook Title*</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formFields.title}
                  onChange={e => setFormFields({ ...formFields, title: e.target.value })}
                  placeholder="e.g. Romance Dawn Alt-Art Market Outlook"
                  required
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Week Start Date*</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formFields.weekStartDate}
                    onChange={e => setFormFields({ ...formFields, weekStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Week End Date*</label>
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
                <label>Market Summary*</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  value={formFields.marketSummary}
                  onChange={e => setFormFields({ ...formFields, marketSummary: e.target.value })}
                  placeholder="Summarize general market volume observations, general card lists trends..."
                  required
                />
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Cards to Watch</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    value={formFields.cardsToWatch}
                    onChange={e => setFormFields({ ...formFields, cardsToWatch: e.target.value })}
                    placeholder="List cards currently in a buy observation zone..."
                  />
                </div>
                <div className="form-group">
                  <label>Cards to Avoid</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    value={formFields.cardsToAvoid}
                    onChange={e => setFormFields({ ...formFields, cardsToAvoid: e.target.value })}
                    placeholder="List cards with high reprint risk or price drops..."
                  />
                </div>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label>Buy Zones to Verify</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={formFields.buyZoneNotes}
                    onChange={e => setFormFields({ ...formFields, buyZoneNotes: e.target.value })}
                    placeholder="e.g. Shanks Alt Art: Buy zone between €380-410"
                  />
                </div>
                <div className="form-group">
                  <label>Sell Zones to Verify</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={formFields.sellZoneNotes}
                    onChange={e => setFormFields({ ...formFields, sellZoneNotes: e.target.value })}
                    placeholder="e.g. Nami Parallel: Sell zone above €210"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Risk Notes & Warnings</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  value={formFields.riskNotes}
                  onChange={e => setFormFields({ ...formFields, riskNotes: e.target.value })}
                  placeholder="Document counterfeit alerts, platform vulnerabilities, or shipping warnings..."
                />
              </div>

              {/* Related Cards Selector checklist */}
              <div className="form-group">
                <label>Select Related Watchlist Cards</label>
                <div style={{ 
                  maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px',
                  backgroundColor: 'var(--bg-input)'
                }}>
                  {cards.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No cards in watchlist yet.</p>
                  ) : (
                    cards.map(c => {
                      const isChecked = formFields.selectedCardIds.includes(c.id);
                      return (
                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'white' }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggleCard(c.id)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span>{c.name} ({c.cardNumber}) - {c.setName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editMode ? 'Save strategy' : 'Publish Strategy'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
