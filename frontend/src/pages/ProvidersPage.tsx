import { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, 
  ShieldCheck, Play, ArrowDownWideNarrow 
} from 'lucide-react';
import { 
  apiGetProviderStatuses, apiCheckProviders, 
  apiImportCardmarketSample, apiTestPriceCharting, apiTestJustTcg 
} from '../api/client';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatuses = async () => {
    try {
      const data = await apiGetProviderStatuses();
      setProviders(data);
    } catch (err: any) {
      console.error('Error fetching provider statuses:', err);
      setErrorMessage('Could not retrieve provider status list.');
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
      setSuccessMessage('Updated provider statuses successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification scan failed.');
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
      setErrorMessage(err.message || 'Cardmarket import failed. Check if sample file exists.');
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
      setErrorMessage(`Test query failed for ${name}: ${err.message}`);
    } finally {
      setTestingProvider(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle2 size={20} color="var(--color-opportunity)" />;
      case 'MOCKED':
        return <ShieldCheck size={20} color="var(--color-interesting)" />;
      case 'NOT_CONFIGURED':
        return <AlertCircle size={20} color="var(--color-watch)" />;
      default:
        return <XCircle size={20} color="var(--color-avoid)" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="badge badge-opportunity">Available</span>;
      case 'MOCKED':
        return <span className="badge badge-interesting">Mock Active</span>;
      case 'NOT_CONFIGURED':
        return <span className="badge badge-watch">Unconfigured</span>;
      default:
        return <span className="badge badge-avoid">Error</span>;
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading provider status...</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Data Providers</h1>
          <p>Manage API status, check tokens, and import reference CSV sheets</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={handleCheckStatuses} 
          disabled={refreshing}
        >
          <RefreshCw size={16} className={refreshing ? 'spin-anim' : ''} />
          {refreshing ? 'Scanning...' : 'Scan Connections'}
        </button>
      </div>

      {successMessage && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-opportunity)', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(16,185,129,0.06)' }}>
          <p style={{ color: 'white' }}>{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-avoid)', padding: '16px', marginBottom: '24px', backgroundColor: 'rgba(239,68,68,0.06)' }}>
          <p style={{ color: 'white' }}>{errorMessage}</p>
        </div>
      )}

      {/* Cardmarket Import Section */}
      <div className="card" style={{ marginBottom: '32px', background: 'radial-gradient(circle at 0% 100%, rgba(99,102,241,0.06) 0%, transparent 60%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowDownWideNarrow size={20} color="var(--accent-primary)" /> Cardmarket Public Export Loader
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '650px' }}>
              Import daily pricing lists using the public export formats. The app maps these references to your watched card catalogue automatically to compute estimated fair ranges.
            </p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleImportSample} 
            disabled={importing}
          >
            {importing ? 'Importing...' : 'Load Sample export.csv'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {providers.map(p => {
          const testRes = testResults[p.providerName];
          return (
            <div key={p.id || p.providerName} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '8px', 
                    backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center'
                  }}>
                    {getStatusIcon(p.status)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ color: 'white', fontSize: '18px' }}>{p.providerName}</h3>
                      {getStatusBadge(p.status)}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{p.message || 'No description available.'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {(p.providerName === 'PRICECHARTING' || p.providerName === 'JUSTTCG') && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleTestProvider(p.providerName)}
                      disabled={testingProvider === p.providerName}
                    >
                      <Play size={14} />
                      {testingProvider === p.providerName ? 'Testing...' : 'Test Connection'}
                    </button>
                  )}
                  {p.providerName === 'OPTCG' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-resolves meta</span>
                  )}
                  {p.providerName === 'MANUAL' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Local inputs only</span>
                  )}
                </div>

              </div>

              {/* Requirement details */}
              <div style={{ 
                marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' 
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Target Platform: </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {p.providerName === 'PRICECHARTING' && 'PriceCharting aggregated market prices'}
                    {p.providerName === 'CARDMARKET_EXPORT' && 'Cardmarket EU marketplace sheets'}
                    {p.providerName === 'JUSTTCG' && 'Alternative pricing/sold lists'}
                    {p.providerName === 'OPTCG' && 'One Piece TCG official metadata'}
                    {p.providerName === 'MANUAL' && 'Manual private logs'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Requirements: </span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {p.providerName === 'PRICECHARTING' && 'PRICECHARTING_API_TOKEN (.env)'}
                    {p.providerName === 'JUSTTCG' && 'JUSTTCG_API_KEY (.env)'}
                    {p.providerName === 'CARDMARKET_EXPORT' && 'sample export file or CARDMARKET_EXPORT_PATH'}
                    {p.providerName === 'OPTCG' && 'None (Uses mock if URL missing)'}
                    {p.providerName === 'MANUAL' && 'None'}
                  </span>
                </div>
              </div>

              {/* Display Test query results */}
              {testRes && (
                <div style={{ 
                  marginTop: '16px', padding: '16px', borderRadius: '6px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)',
                  fontFamily: 'monospace', fontSize: '13px'
                }}>
                  <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>Connection Check Output:</h4>
                  <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
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
