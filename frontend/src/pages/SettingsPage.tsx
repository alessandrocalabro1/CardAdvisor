import { useRef, useState } from 'react';
import { Settings, Download, Upload, FileSpreadsheet, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { JSON_EXPORT_URL, CSV_EXPORT_URL, apiImportBackup } from '../api/client';

interface SettingsPageProps {
  settings: {
    currency: string;
    defaultGame: string;
    defaultLanguage: string;
    defaultMarketplace: string;
    showDisclaimer: boolean;
  };
  onUpdateSettings: (newSettings: any) => void;
}

export default function SettingsPage({ settings, onUpdateSettings }: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectChange = (key: string, val: string) => {
    onUpdateSettings({ ...settings, [key]: val });
  };

  const handleToggleDisclaimer = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, showDisclaimer: e.target.checked });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        const res = await apiImportBackup(backupData);
        setSuccessMsg(res.message || 'Backup importato correttamente.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setErrorMsg(`Import del backup non riuscito: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Errore nella lettura del file di backup.');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-wrap" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Impostazioni</h1>
          <p>Preferenze dell’applicazione, backup e portabilità dei dati</p>
        </div>
      </div>

      {successMsg && (
        <div className="notice notice-success" style={{ marginBottom: 20 }} role="status">
          <CheckCircle size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="notice notice-error" style={{ marginBottom: 20 }} role="alert">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Preferences */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">
          <Settings size={13} /> Preferenze
        </div>

        <div className="grid-cols-2">
          <div className="form-group">
            <label>Valuta di riferimento</label>
            <select
              className="form-control"
              value={settings.currency}
              onChange={(e) => handleSelectChange('currency', e.target.value)}
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollaro USA ($)</option>
            </select>
            <span className="form-hint">
              I prezzi in USD dei provider vengono convertiti automaticamente.
            </span>
          </div>

          <div className="form-group">
            <label>Gioco predefinito</label>
            <select
              className="form-control"
              value={settings.defaultGame}
              onChange={(e) => handleSelectChange('defaultGame', e.target.value)}
            >
              <option value="One Piece">One Piece TCG</option>
              <option value="Pokémon">Pokémon TCG</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
              <option value="Lorcana">Lorcana</option>
            </select>
          </div>

          <div className="form-group">
            <label>Lingua carte predefinita</label>
            <select
              className="form-control"
              value={settings.defaultLanguage}
              onChange={(e) => handleSelectChange('defaultLanguage', e.target.value)}
            >
              <option value="English">Inglese</option>
              <option value="Japanese">Giapponese</option>
              <option value="French">Francese</option>
              <option value="German">Tedesco</option>
            </select>
          </div>

          <div className="form-group">
            <label>Marketplace preferito</label>
            <select
              className="form-control"
              value={settings.defaultMarketplace}
              onChange={(e) => handleSelectChange('defaultMarketplace', e.target.value)}
            >
              <option value="CARDMARKET">Cardmarket</option>
              <option value="VINTED">Vinted (EU)</option>
              <option value="FACEBOOK">Facebook Marketplace</option>
              <option value="EBAY">eBay</option>
              <option value="TELEGRAM">Gruppi Telegram</option>
            </select>
          </div>
        </div>

        <label style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.showDisclaimer}
            onChange={handleToggleDisclaimer}
            style={{ width: 15, height: 15, cursor: 'pointer' }}
          />
          Mostra l’avvertenza sui limiti delle stime nelle pagine di prezzo (consigliato)
        </label>
      </div>

      {/* Backups */}
      <div className="card">
        <div className="section-title">
          <Download size={13} /> Backup e portabilità
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginBottom: 18, lineHeight: 1.55 }}>
          Scarica un backup JSON completo di tutti i dati, oppure esporta il portafoglio in CSV per tracciamenti esterni. Nessun vincolo: i tuoi dati restano tuoi.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href={JSON_EXPORT_URL} className="btn btn-secondary" download>
            <FileJson size={15} />
            Backup JSON
          </a>

          <a href={CSV_EXPORT_URL} className="btn btn-secondary" download>
            <FileSpreadsheet size={15} />
            Portafoglio CSV
          </a>

          <button className="btn btn-primary" onClick={handleImportClick} disabled={importing}>
            <Upload size={15} />
            {importing ? 'Import in corso…' : 'Ripristina backup JSON'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".json"
          />
        </div>
      </div>
    </div>
  );
}
