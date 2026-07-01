import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Search, Sparkles, AlertCircle, Loader2, Info, CheckCircle } from 'lucide-react';
import { apiCreateCard, apiUpdateCard, apiGetCardById, apiSearchCards } from '../api/client';
import type { GameKey, CardSearchResult, ProviderSearchStatus } from '../api/client';
import CardArtwork from '../components/CardArtwork';

interface CardFormProps {
  cardId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

// UI category (stored value in DB) → unified search game key
const GAME_OPTIONS: { value: string; label: string; key: GameKey }[] = [
  { value: 'One Piece', label: 'One Piece TCG', key: 'ONE_PIECE' },
  { value: 'Pokémon', label: 'Pokémon TCG', key: 'POKEMON' },
  { value: 'Yu-Gi-Oh!', label: 'Yu-Gi-Oh', key: 'YUGIOH' },
  { value: 'Magic', label: 'Magic: The Gathering', key: 'MAGIC' },
  { value: 'Lorcana', label: 'Lorcana', key: 'OTHER' },
  { value: 'Other', label: 'Altro', key: 'OTHER' },
];

function gameToKey(game: string): GameKey {
  return GAME_OPTIONS.find(o => o.value === game)?.key ?? 'OTHER';
}

const PROVIDER_LABELS: Record<string, string> = {
  'pokemon-tcg': 'Pokémon TCG API',
  'ygoprodeck': 'YGOPRODeck',
  'scryfall': 'Scryfall',
  'op-tcg': 'One Piece TCG',
};

// Simple, non-invasive wrong-category hints
const QUERY_HINTS: { game: string; label: string; words: string[] }[] = [
  { game: 'Pokémon', label: 'Pokémon TCG', words: ['charizard', 'pikachu', 'mewtwo', 'eevee', 'gengar', 'bulbasaur', 'squirtle', 'charmander', 'snorlax', 'lugia', 'rayquaza'] },
  { game: 'One Piece', label: 'One Piece TCG', words: ['luffy', 'zoro', 'nami', 'shanks', 'sanji', 'usopp', 'chopper', 'yamato', 'boa hancock', 'doflamingo', 'katakuri'] },
  { game: 'Yu-Gi-Oh!', label: 'Yu-Gi-Oh', words: ['blue-eyes', 'blue eyes', 'dark magician', 'exodia', 'kuriboh', 'red-eyes', 'red eyes', 'obelisk', 'slifer'] },
];

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'unavailable' | 'error';

type AutoField = 'name' | 'setName' | 'cardNumber' | 'rarity' | 'imageUrl';

export default function CardForm({ cardId, onSave, onCancel }: CardFormProps) {
  const isEditMode = !!cardId;

  // Quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderSearchStatus | null>(null);
  const [selectedResult, setSelectedResult] = useState<CardSearchResult | null>(null);

  // Which fields were auto-filled by a provider result (vs typed by the user)
  const [autoFilled, setAutoFilled] = useState<Set<AutoField>>(new Set());

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
        }
      } catch (err) {
        console.error('Error loading card for edit:', err);
        setErrorMsg('Impossibile caricare i dati della carta.');
      }
    };
    fetchCard();
  }, [cardId]);

  /**
   * Category change: reset everything that came from the previous
   * provider so One Piece data is never treated as Pokémon data.
   * Manually typed values are preserved.
   */
  const handleGameChange = (newGame: string) => {
    setGame(newGame);

    // Clear search machinery
    setSearchResults([]);
    setSearchState('idle');
    setProviderStatus(null);
    setSelectedResult(null);
    setErrorMsg(null);

    // Clear provider-filled fields only
    if (autoFilled.has('name')) setName('');
    if (autoFilled.has('setName')) setSetNameField('');
    if (autoFilled.has('cardNumber')) setCardNumber('');
    if (autoFilled.has('rarity')) setRarity('SR');
    if (autoFilled.has('imageUrl')) setImageUrl('');
    setAutoFilled(new Set());
  };

  /** Manual edit of a previously auto-filled field: it becomes "user-owned". */
  const markManual = (field: AutoField) => {
    if (autoFilled.has(field)) {
      setAutoFilled(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchState('error');
      setProviderStatus({ provider: 'none', mode: 'error', message: 'Inserisci almeno 2 caratteri per la ricerca.' });
      return;
    }

    setSearchState('loading');
    setSearchResults([]);
    setProviderStatus(null);

    try {
      const res = await apiSearchCards({ query: q, game: gameToKey(game), limit: 20 });
      setProviderStatus(res.providerStatus);

      if (res.results.length > 0) {
        setSearchResults(res.results);
        setSearchState('results');
      } else if (res.providerStatus.mode === 'unavailable') {
        setSearchState('unavailable');
      } else if (res.providerStatus.mode === 'error') {
        setSearchState('error');
      } else {
        setSearchState('empty');
      }
    } catch (err: any) {
      console.error('Card search failed:', err);
      setProviderStatus(null);
      setSearchState('error');
    }
  };

  const handleSelectResult = (r: CardSearchResult) => {
    const filled = new Set<AutoField>();

    setName(r.name);
    filled.add('name');

    if (r.setName) { setSetNameField(r.setName); filled.add('setName'); }
    if (r.cardNumber) { setCardNumber(r.cardNumber); filled.add('cardNumber'); }
    if (r.rarity) { setRarity(r.rarity); filled.add('rarity'); }

    const img = r.imageLargeUrl || r.imageUrl || r.imageSmallUrl;
    if (img) { setImageUrl(img); filled.add('imageUrl'); }

    setAutoFilled(filled);
    setSelectedResult(r);
    setSearchResults([]);
    setSearchState('idle');
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

  // Wrong-category hint (only when search found nothing useful)
  const categoryHint = (() => {
    if (searchState !== 'empty' && searchState !== 'unavailable') return null;
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 3) return null;
    const match = QUERY_HINTS.find(h => h.game !== game && h.words.some(w => q.includes(w)));
    if (!match) return null;
    return match;
  })();

  const providerLabel = (id: string) => PROVIDER_LABELS[id] || id;

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

      {/* Quick provider search — available for every category in add mode */}
      {!isEditMode && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>
            <Sparkles size={13} color="var(--accent-strong)" /> Ricerca rapida — {GAME_OPTIONS.find(o => o.value === game)?.label}
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Cerca per nome (es. Charizard, Luffy, Blue-Eyes)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" type="submit" disabled={searchState === 'loading'}>
              {searchState === 'loading' ? <Loader2 size={14} className="spin-anim" /> : <Search size={14} />}
              {searchState === 'loading' ? 'Ricerca…' : 'Cerca'}
            </button>
          </form>

          {/* Provider states */}
          {searchState === 'loading' && (
            <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={13} className="spin-anim" /> Interrogazione del provider…
            </p>
          )}

          {searchState === 'empty' && (
            <div className="notice" style={{ marginTop: 12 }}>
              <Info size={14} />
              <span>Nessun risultato trovato per questa categoria. Puoi modificare la ricerca o compilare manualmente.</span>
            </div>
          )}

          {searchState === 'unavailable' && providerStatus && (
            <div className="notice notice-warn" style={{ marginTop: 12 }}>
              <Info size={14} />
              <span>{providerStatus.message}</span>
            </div>
          )}

          {searchState === 'error' && (
            <div className="notice notice-error" style={{ marginTop: 12 }} role="alert">
              <AlertCircle size={14} />
              <span>{providerStatus?.message || 'Ricerca non riuscita. Riprova più tardi o inserisci la carta manualmente.'}</span>
            </div>
          )}

          {categoryHint && (
            <div className="notice" style={{ marginTop: 8 }}>
              <Info size={14} />
              <span>
                Stai cercando una carta {categoryHint.label}?{' '}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '1px 6px', fontSize: 12, verticalAlign: 'baseline' }}
                  onClick={() => handleGameChange(categoryHint.game)}
                >
                  Cambia categoria in {categoryHint.label}
                </button>
              </span>
            </div>
          )}

          {/* Results list */}
          {searchState === 'results' && searchResults.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                {searchResults.length} risultati · seleziona una carta per compilare i campi
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
                {searchResults.map((r) => (
                  <div
                    key={`${r.provider}-${r.externalId}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 10,
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                    }}
                  >
                    <CardArtwork src={r.imageSmallUrl || r.imageUrl} name={r.name} size="thumb" style={{ width: 44, minWidth: 44 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {[r.setName, r.cardNumber, r.rarity].filter(Boolean).join(' · ') || '—'}
                      </div>
                      <span className="badge badge-accent" style={{ fontSize: 9.5, marginTop: 3 }}>{providerLabel(r.provider)}</span>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSelectResult(r)}>
                      Seleziona
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected result confirmation */}
          {selectedResult && (
            <div className="notice notice-success" style={{ marginTop: 12 }}>
              <CheckCircle size={14} />
              <span>
                Campi compilati da {providerLabel(selectedResult.provider)} ({selectedResult.name}). Puoi modificarli liberamente prima di salvare.
              </span>
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
            <select className="form-control" value={game} onChange={(e) => handleGameChange(e.target.value)}>
              {GAME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Nome*</label>
            <input
              type="text"
              className="form-control"
              placeholder="es. Shanks (Parallel)"
              value={name}
              onChange={(e) => { setName(e.target.value); markManual('name'); }}
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
              onChange={(e) => { setSetNameField(e.target.value); markManual('setName'); }}
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
              onChange={(e) => { setCardNumber(e.target.value); markManual('cardNumber'); }}
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
              onChange={(e) => { setRarity(e.target.value); markManual('rarity'); }}
            />
          </div>

          <div className="form-group">
            <label>Lingua</label>
            <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">Inglese</option>
              <option value="Japanese">Giapponese</option>
              <option value="French">Francese</option>
              <option value="German">Tedesco</option>
              <option value="Italian">Italiano</option>
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
              onChange={(e) => { setImageUrl(e.target.value); markManual('imageUrl'); }}
            />
            {imageUrl && (
              <div style={{ marginTop: 8 }}>
                <CardArtwork src={imageUrl} name={name} game={game} cardNumber={cardNumber} size="thumb" style={{ width: 60, minWidth: 60 }} />
              </div>
            )}
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
