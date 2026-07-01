import { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
  ShieldCheck, Play, FileDown, CheckCircle,
} from 'lucide-react';
import {
  apiGetProviderStatuses, apiCheckProviders,
  apiImportCardmarketSample, apiTestPriceCharting, apiTestJustTcg,
} from '../api/client';

const PROVIDER_INFO: Record<string, { target: string; requirement: string; nextStep: string }> = {
  PRICECHARTING: {
    target: 'Prezzi di mercato aggregati (PriceCharting)',
    requirement: 'PRICECHARTING_API_TOKEN nel backend (.env)',
    nextStep: 'Configura il token sul server per prezzi reali.',
  },
  CARDMARKET_EXPORT: {
    target: 'Listini del marketplace Cardmarket (EU)',
    requirement: 'File di export o CARDMARKET_EXPORT_PATH',
    nextStep: 'Importa un export per aggiornare i riferimenti.',
  },
  JUSTTCG: {
    target: 'Prezzi e liste di vendita alternative (JustTCG)',
    requirement: 'JUSTTCG_API_KEY nel backend (.env)',
    nextStep: 'Configura la chiave API sul server.',
  },
  OPTCG: {
    target: 'Metadati ufficiali One Piece TCG',
    requirement: 'Nessuno (usa dati simulati se l’URL manca)',
    nextStep: 'Usato per la compilazione rapida delle carte.',
  },
  MANUAL: {
    target: 'Inserimenti manuali',
    requirement: 'Nessuno',
    nextStep: 'Registra prezzi e offerte dalle pagine di dettaglio.',
  },
};

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchStatuses = async () => {
    try {
      const data = await apiGetProviderStatuses();
      setProviders(data);
    } catch (err: any) {
      console.error('Error fetching provider statuses:', err);
      setErrorMessage('Impossibile recuperare lo stato dei provider.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleCheckStatuses = async () => {
    setRefreshing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const updated = await apiCheckProviders();
      setProviders(updated);
      setLastCheck(new Date());
      setSuccessMessage('Stato dei provider aggiornato.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verifica non riuscita.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleImportSample = async () => {
    setImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await apiImportCardmarketSample();
      setSuccessMessage(res.message);
      fetchStatuses();
    } catch (err: any) {
      setErrorMessage(err.message || 'Import Cardmarket non riuscito. Verifica che il file di esempio esista.');
    } finally {
      setImporting(false);
    }
  };

  const handleTestProvider = async (name: string) => {
    setTestingProvider(name);
    setErrorMessage(null);
    try {
      let res;
      if (name === 'PRICECHARTING') {
        res = await apiTestPriceCharting();
      } else if (name === 'JUSTTCG') {
        res = await apiTestJustTcg();
      } else {
        return;
      }
      setTestResults(prev => ({ ...prev, [name]: res }));
    } catch (err: any) {
      setErrorMessage(`Test non riuscito per ${name}: ${err.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle2 size={18} color="var(--positive)" />;
      case 'MOCKED':
        return <ShieldCheck size={18} color="var(--info)" />;
      case 'NOT_CONFIGURED':
        return <AlertCircle size={18} color="var(--warn)" />;
      default:
        return <XCircle size={18} color="var(--negative)" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge badge-positive">Attivo</span>;
      case 'MOCKED':
        return <span className="badge badge-info">Simulato</span>;
      case 'NOT_CONFIGURED':
        return <span className="badge badge-warn">Non configurato</span>;
      default:
        return <span className="badge badge-negative">Errore</span>;
    }
  };

  if (loading) {
    return (
      <div className="page-wrap" style={{ color: 'var(--text-secondary)', display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        Caricamento dello stato dei provider…
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 960 }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Fonti dati</h1>
          <p>
            Stato dei provider di prezzo e import di riferimento
            {lastCheck && ` · ultima verifica ${lastCheck.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleCheckStatuses} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
          {refreshing ? 'Verifica…' : 'Verifica connessioni'}
        </button>
      </div>

      {successMessage && (
        <div className="notice notice-success" style={{ marginBottom: 20 }} role="status">
          <CheckCircle size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="notice notice-error" style={{ marginBottom: 20 }} role="alert">
          <AlertCircle size={14} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cardmarket import */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{ marginBottom: 6 }}>
              <FileDown size={13} /> Import export Cardmarket
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, maxWidth: 560, lineHeight: 1.55 }}>
              Importa i listini pubblici di Cardmarket: i riferimenti vengono associati automaticamente alle carte in watchlist per calcolare le fasce eque stimate.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleImportSample} disabled={importing}>
            {importing ? 'Import in corso…' : 'Carica export di esempio'}
          </button>
        </div>
      </div>

      {/* Providers list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map(p => {
          const testRes = testResults[p.providerName];
          const info = PROVIDER_INFO[p.providerName];
          return (
            <div key={p.id || p.providerName} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 0 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {getStatusIcon(p.status)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 14.5 }}>{p.providerName}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12.5 }}>{p.message || info?.target || 'Nessuna descrizione disponibile.'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {(p.providerName === 'PRICECHARTING' || p.providerName === 'JUSTTCG') && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleTestProvider(p.providerName)}
                      disabled={testingProvider === p.providerName}
                    >
                      <Play size={12} />
                      {testingProvider === p.providerName ? 'Test in corso…' : 'Testa connessione'}
                    </button>
                  )}
                </div>
              </div>

              {info && (
                <div style={{
                  marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)',
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, fontSize: 12,
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Fonte: </span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{info.target}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Requisiti: </span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{info.requirement}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Prossimo passo: </span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{info.nextStep}</span>
                  </div>
                </div>
              )}

              {testRes && (
                <div style={{
                  marginTop: 14, padding: 14, borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                  fontSize: 12,
                }}>
                  <div className="section-title" style={{ marginBottom: 8 }}>Risultato del test</div>
                  <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, lineHeight: 1.5 }}>
                    {JSON.stringify(testRes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
