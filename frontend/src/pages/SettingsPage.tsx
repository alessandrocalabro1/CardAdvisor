import { useRef, useState } from 'react';
import { 
  Settings, Download, Upload, FileSpreadsheet, FileJson
} from 'lucide-react';
import { 
  JSON_EXPORT_URL, CSV_EXPORT_URL, apiImportBackup 
} from '../api/client';

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

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, currency: e.target.value });
  };

  const handleToggleDisclaimer = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, showDisclaimer: e.target.checked });
  };

  const handleSelectChange = (key: string, val: string) => {
    onUpdateSettings({ ...settings, [key]: val });
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
        setSuccessMsg(res.message || 'Backup imported successfully. Refreshing database...');
        // Clear value to allow re-upload
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setErrorMsg(`Failed to import backup: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading the backup file.');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Settings & Backups</h1>
          <p>Configure currencies, default filters, and database import/export options</p>
        </div>
      </div>

      {successMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-opportunity)', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(16,185,129,0.06)' }}>
          <p style={{ color: 'white' }}>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-avoid)', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <p style={{ color: 'white' }}>{errorMsg}</p>
        </div>
      )}

      {/* Configuration Section */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="var(--accent-primary)" /> Application Preferences
        </h3>

        <div className="grid-cols-2">
          
          <div className="form-group">
            <label>Preferred Base Currency</label>
            <select 
              className="form-control" 
              value={settings.currency} 
              onChange={handleCurrencyChange}
            >
              <option value="EUR">Euro (€)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              PriceCharting and JustTCG USD prices will convert automatically to this currency.
            </p>
          </div>

          <div className="form-group">
            <label>Default Card Game</label>
            <select 
              className="form-control" 
              value={settings.defaultGame} 
              onChange={(e) => handleSelectChange('defaultGame', e.target.value)}
            >
              <option value="One Piece">One Piece TCG</option>
              <option value="Pokémon">Pokémon TCG (Future)</option>
              <option value="Yu-Gi-Oh!">Yu-Gi-Oh! (Future)</option>
              <option value="Lorcana">Lorcana (Future)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Default Card Language</label>
            <select 
              className="form-control" 
              value={settings.defaultLanguage} 
              onChange={(e) => handleSelectChange('defaultLanguage', e.target.value)}
            >
              <option value="English">English</option>
              <option value="Japanese">Japanese</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div className="form-group">
            <label>Preferred Listing Marketplace</label>
            <select 
              className="form-control" 
              value={settings.defaultMarketplace} 
              onChange={(e) => handleSelectChange('defaultMarketplace', e.target.value)}
            >
              <option value="CARDMARKET">Cardmarket</option>
              <option value="VINTED">Vinted (EU)</option>
              <option value="FACEBOOK">Facebook Marketplace</option>
              <option value="EBAY">eBay</option>
              <option value="TELEGRAM">Telegram Group chats</option>
            </select>
          </div>

        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            id="toggle-disc"
            checked={settings.showDisclaimer}
            onChange={handleToggleDisclaimer}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="toggle-disc" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Show short warning banner on pricing tools (recommended)
          </label>
        </div>
      </div>

      {/* Database Backup Section */}
      <div className="card">
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={20} color="var(--accent-primary)" /> Backups & Data Portability
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          Avoid lock-in by downloading full JSON backups of all models, or export your current portfolio ledger to a CSV sheet for external tracking.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          
          <a 
            href={JSON_EXPORT_URL} 
            className="btn btn-secondary"
            style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
            download
          >
            <FileJson size={16} />
            Export Database Backup
          </a>

          <a 
            href={CSV_EXPORT_URL} 
            className="btn btn-secondary"
            style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
            download
          >
            <FileSpreadsheet size={16} />
            Export Portfolio CSV
          </a>

          <button 
            className="btn btn-primary" 
            onClick={handleImportClick}
            disabled={importing}
          >
            <Upload size={16} />
            {importing ? 'Importing...' : 'Restore JSON Backup'}
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
