import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Search, Sparkles, AlertCircle } from 'lucide-react';
import { apiCreateCard, apiUpdateCard, apiSearchOptcg, apiGetCardById } from '../api/client';

interface CardFormProps {
  cardId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function CardForm({ cardId, onSave, onCancel }: CardFormProps) {
  const isEditMode = !!cardId;

  // Metadata autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(true);

  // Form state
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
          setShowSearchBox(false);
        }
      } catch (err) {
        console.error('Error loading card for edit:', err);
        setErrorMsg('Impossibile caricare i dati della carta.');
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
        setErrorMsg('Nessuna carta trovata. Puoi compilare i campi manualmente.');
      }
    } catch {
      setErrorMsg('Errore nella ricerca dei metadati. Procedi con l’inserimento manuale.');
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
      setErrorMsg('Nome, set e codice carta sono campi obbligatori.');
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
      setErrorMsg(err.message || 'Errore durante il salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Torna alla watchlist">
            <ArrowLeft size={16} />
          </button>
          <div className="page-title-group">
            <h1>{isEditMode ? 'Modifica carta' : 'Nuova carta'}</h1>
            <p>{isEditMode ? 'Aggiorna attributi e parametri di monitoraggio' : 'Aggiungi un elemento alla watchlist in pochi secondi'}</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="notice notice-error" style={{ marginBottom: 20 }} role="alert">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metadata autocomplete */}
      {!isEditMode && showSearchBox && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>
            <Sparkles size={13} color="var(--accent-strong)" /> Compilazione rapida (One Piece TCG)
          </div>
          <form onSubmit={handleMetaSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Cerca per nome o codice (es. Shanks, OP01-120)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" type="submit" disabled={searching}>
              <Search size={14} />
              {searching ? 'Ricerca…' : 'Cerca'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Seleziona una carta per compilare i campi:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {searchResults.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectTemplateCard(c)}
                    style={{
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'border-color 0.15s', fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-border)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt="" style={{ width: 26, height: 37, objectFit: 'cover', borderRadius: 2 }} />
                    )}
                    <span>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>{c.cardNumber} · {c.setName}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: 28 }}>
        <div className="section-title">Identità della carta</div>

        <div className="grid-cols-2">
          <div className="form-group">
            <label>Gioco / categoria</label>
            <select className="form-control" value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="One Piece">One Piece TCG</option>
              <option value="Pokémon">Pokémon TCG</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
              <option value="Lorcana">Lorcana</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nome*</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Shanks (Parallel)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Set*</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Romance Dawn"
              value={setNameField}
              onChange={(e) => setSetNameField(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Codice carta*</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. OP01-120"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Rarità</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. SEC, SR, R, UC, C"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Lingua</label>
            <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">Inglese</option>
              <option value="Japanese">Giapponese</option>
              <option value="French">Francese</option>
              <option value="German">Tedesco</option>
            </select>
          </div>

          <div className="form-group">
            <label>Versione / tipo di art</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Parallel Alt Art, Regular"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Condizione obiettivo</label>
            <select className="form-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="Near Mint">Near Mint (NM)</option>
              <option value="Excellent">Excellent (EX)</option>
              <option value="Played">Played (GD/PL)</option>
              <option value="Mint / Slab">Gradata / Slab</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label>URL immagine (opzionale)</label>
            <input
              type="url"
              className="form-control"
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
            <label>Tesi di monitoraggio / note</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Perché questa carta merita attenzione: prezzo obiettivo, contesto di mercato, fonte…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <span className="form-hint">La tesi resta visibile nella pagina di dettaglio come promemoria della tua valutazione.</span>
          </div>
        </div>

        <div className="section-title" style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          Segnali di mercato
        </div>

        <div className="grid-cols-2">
          <div className="form-group">
            <label>Priorità di osservazione</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="WATCH">In osservazione</option>
              <option value="CONSIDER">Da valutare</option>
              <option value="OWNED">In portafoglio</option>
              <option value="SELL">Da vendere</option>
              <option value="AVOID">Da evitare</option>
            </select>
          </div>

          <div className="form-group">
            <label>Domanda di mercato</label>
            <select className="form-control" value={demandLevel} onChange={(e) => setDemandLevel(e.target.value)}>
              <option value="LOW">Bassa</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label>Offerta di mercato</label>
            <select className="form-control" value={supplyLevel} onChange={(e) => setSupplyLevel(e.target.value)}>
              <option value="LOW">Bassa</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rischio di ristampa</label>
            <select className="form-control" value={reprintRisk} onChange={(e) => setReprintRisk(e.target.value)}>
              <option value="LOW">Basso</option>
              <option value="MEDIUM">Medio</option>
              <option value="HIGH">Alto</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={saving}>
            Annulla
          </button>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            <Save size={14} />
            {saving ? 'Salvataggio…' : isEditMode ? 'Salva modifiche' : 'Aggiungi alla watchlist'}
          </button>
        </div>
      </form>
    </div>
  );
}
