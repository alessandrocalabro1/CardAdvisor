import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Search, Sparkles, AlertCircle 
} from 'lucide-react';
import { apiCreateCard, apiUpdateCard, apiSearchOptcg, apiGetCardById } from '../api/client';

interface CardFormProps {
  cardId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function CardForm({ cardId, onSave, onCancel }: CardFormProps) {
  const isEditMode = !!cardId;
  
  // Search state for meta autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(true);

  // Form states
  const [game, setGame] = useState('One Piece');
  const [name, setName] = useState('');
  const [setNameField, setSetNameField] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [rarity, setRarity] = useState('SR');
  const [language, setLanguage] = useState('English');
  const [version, setVersion] = useState('Regular');
  const [condition, setCondition] = useState('Near Mint');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('WATCH');
  const [demandLevel, setDemandLevel] = useState('MEDIUM');
  const [supplyLevel, setSupplyLevel] = useState('MEDIUM');
  const [reprintRisk, setReprintRisk] = useState('MEDIUM');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load details if editing
  useEffect(() => {
    if (!cardId) return;
    const fetchCard = async () => {
      try {
        const card = await apiGetCardById(cardId);
        if (card) {
          setGame(card.game);
          setName(card.name);
          setSetNameField(card.setName);
          setCardNumber(card.cardNumber);
          setRarity(card.rarity);
          setLanguage(card.language);
          setVersion(card.version);
          setCondition(card.condition);
          setImageUrl(card.imageUrl || '');
          setNotes(card.notes || '');
          setStatus(card.status);
          setDemandLevel(card.demandLevel);
          setSupplyLevel(card.supplyLevel);
          setReprintRisk(card.reprintRisk);
          setShowSearchBox(false); // No need to autofill if editing
        }
      } catch (err) {
        console.error('Error loading card for edit:', err);
        setErrorMsg('Failed to load card information.');
      }
    };
    fetchCard();
  }, [cardId]);

  const handleMetaSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setErrorMsg(null);
    try {
      const data = await apiSearchOptcg(searchQuery);
      setSearchResults(data);
      if (data.length === 0) {
        setErrorMsg('No matching cards found. You can fill out fields manually.');
      }
    } catch (err: any) {
      setErrorMsg('Error searching metadata. Fallback to manual entry.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectTemplateCard = (c: any) => {
    setName(c.name);
    setSetNameField(c.setName);
    setCardNumber(c.cardNumber);
    setRarity(c.rarity);
    if (c.imageUrl) setImageUrl(c.imageUrl);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !setNameField || !cardNumber) {
      setErrorMsg('Card Name, Set Name, and Card Number are required fields.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      game,
      name,
      setName: setNameField,
      cardNumber,
      rarity,
      language,
      version,
      condition,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      demandLevel,
      supplyLevel,
      reprintRisk,
    };

    try {
      if (isEditMode) {
        await apiUpdateCard(cardId!, payload);
      } else {
        await apiCreateCard(payload);
      }
      onSave();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ padding: '8px 12px' }}>
            <ArrowLeft size={16} />
          </button>
          <div className="page-title-group">
            <h1>{isEditMode ? 'Edit Card Meta' : 'Add New Card to Track'}</h1>
            <p>{isEditMode ? 'Modify tracking metrics and attributes' : 'Register card details or search metadata databases'}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-avoid)', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <p style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} color="var(--color-avoid)" />
            {errorMsg}
          </p>
        </div>
      )}

      {/* Metdata Search Section for Autofill */}
      {!isEditMode && showSearchBox && (
        <div className="card" style={{ marginBottom: '24px', background: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }}>
          <h3 style={{ fontSize: '15px', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--accent-primary)" /> Search OPTCG Metadata for Autofill
          </h3>
          <form onSubmit={handleMetaSearch} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Card Name or Code (e.g., Shanks or OP01-120)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" type="submit" disabled={searching}>
              <Search size={14} />
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click a card to fill out the form fields:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {searchResults.map((c, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectTemplateCard(c)}
                    style={{ 
                      padding: '10px 14px', borderRadius: '6px', 
                      backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                      transition: 'border-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt="" style={{ width: '28px', height: '40px', objectFit: 'cover', borderRadius: '2px' }} />
                    )}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{c.cardNumber} • {c.setName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '24px' }}>Card Identity Details</h3>
        
        <div className="grid-cols-2">
          
          <div className="form-group">
            <label>Card Game</label>
            <select className="form-control" value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="One Piece">One Piece TCG</option>
              <option value="Pokémon">Pokémon TCG</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
              <option value="Lorcana">Lorcana</option>
            </select>
          </div>

          <div className="form-group">
            <label>Card Name*</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Shanks (Parallel)" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Set Name*</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Romance Dawn" 
              value={setNameField} 
              onChange={(e) => setSetNameField(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Card Number*</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. OP01-120" 
              value={cardNumber} 
              onChange={(e) => setCardNumber(e.target.value)} 
              required
            />
          </div>

          <div className="form-group">
            <label>Rarity</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. SEC, SR, R, UC, C" 
              value={rarity} 
              onChange={(e) => setRarity(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Card Language</label>
            <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div className="form-group">
            <label>Version / Art Type</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Parallel Alt Art, Special Illustration, Regular" 
              value={version} 
              onChange={(e) => setVersion(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Target Condition Grade</label>
            <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="Near Mint">Near Mint (NM)</option>
              <option value="Excellent">Excellent (EX)</option>
              <option value="Played">Played (GD/PL)</option>
              <option value="Mint / Slab">Pristine / Graded slab</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Image URL (Optional)</label>
            <input 
              type="url" 
              className="form-control" 
              placeholder="e.g. https://domain.com/image.jpg" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>Notes / Personal target observations</label>
            <textarea 
              className="form-control" 
              rows={3} 
              placeholder="Write any personal context, target purchase prices, or notes..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>

        </div>

        <h3 style={{ fontSize: '18px', color: 'white', marginTop: '32px', marginBottom: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          Signals & Market Metrics
        </h3>

        <div className="grid-cols-2">

          <div className="form-group">
            <label>Tracking Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="WATCH">Watching (Watchlist)</option>
              <option value="CONSIDER">Considering offer</option>
              <option value="OWNED">Owned (Portfolio)</option>
              <option value="SELL">Intend to Sell</option>
              <option value="AVOID">Avoid listing</option>
            </select>
          </div>

          <div className="form-group">
            <label>Market Demand Level</label>
            <select className="form-control" value={demandLevel} onChange={(e) => setDemandLevel(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Market Supply Level</label>
            <select className="form-control" value={supplyLevel} onChange={(e) => setSupplyLevel(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reprint Risk</label>
            <select className="form-control" value={reprintRisk} onChange={(e) => setReprintRisk(e.target.value)}>
              <option value="LOW">Low Reprint Risk</option>
              <option value="MEDIUM">Medium Reprint Risk</option>
              <option value="HIGH">High Reprint Risk</option>
            </select>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Card Metadata'}
          </button>
        </div>
      </form>
    </div>
  );
}
