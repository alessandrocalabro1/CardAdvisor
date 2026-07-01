import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Table, Scale, Database, Settings as SettingsIcon, 
  HelpCircle, Info, TrendingUp 
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Watchlist from './pages/Watchlist';
import CardForm from './pages/CardForm';
import CardDetail from './pages/CardDetail';
import OfferComparator from './pages/OfferComparator';
import ProvidersPage from './pages/ProvidersPage';
import SettingsPage from './pages/SettingsPage';
import DisclaimerPage from './pages/DisclaimerPage';
import WeeklyStrategyPage from './pages/WeeklyStrategyPage';

interface AppSettings {
  currency: string;
  defaultGame: string;
  defaultLanguage: string;
  defaultMarketplace: string;
  showDisclaimer: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Global preferences state
  const [settings, setSettings] = useState<AppSettings>({
    currency: 'EUR',
    defaultGame: 'One Piece',
    defaultLanguage: 'English',
    defaultMarketplace: 'VINTED',
    showDisclaimer: true,
  });

  // Load preferences from localstorage on start
  useEffect(() => {
    const saved = localStorage.getItem('cardadvisor_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse settings cache:', err);
      }
    }
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('cardadvisor_settings', JSON.stringify(newSettings));
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            settings={settings} 
            onNavigateToTab={setActiveTab}
            onNavigateToCard={(id) => {
              setSelectedCardId(id);
              setActiveTab('card-detail');
            }}
          />
        );
      case 'watchlist':
        return (
          <Watchlist 
            settings={settings}
            onNavigateToDetail={(id) => {
              setSelectedCardId(id);
              setActiveTab('card-detail');
            }}
            onNavigateToEdit={(id) => {
              setEditCardId(id);
              setActiveTab('card-edit');
            }}
            onNavigateToAdd={() => {
              setEditCardId(null);
              setActiveTab('card-add');
            }}
          />
        );
      case 'card-add':
        return (
          <CardForm 
            onSave={() => setActiveTab('watchlist')}
            onCancel={() => setActiveTab('watchlist')}
          />
        );
      case 'card-edit':
        return (
          <CardForm 
            cardId={editCardId}
            onSave={() => setActiveTab('watchlist')}
            onCancel={() => setActiveTab('watchlist')}
          />
        );
      case 'card-detail':
        return (
          <CardDetail 
            cardId={selectedCardId!}
            settings={settings}
            onBack={() => setActiveTab('watchlist')}
            onNavigateToStrategy={(strategyId) => {
              setSelectedStrategyId(strategyId);
              setActiveTab('weekly-strategy');
            }}
          />
        );
      case 'comparator':
        return (
          <OfferComparator 
            onNavigateToCard={(id) => {
              setSelectedCardId(id);
              setActiveTab('card-detail');
            }}
          />
        );
      case 'providers':
        return <ProvidersPage />;
      case 'settings':
        return (
          <SettingsPage 
            settings={settings} 
            onUpdateSettings={handleUpdateSettings} 
          />
        );
      case 'weekly-strategy':
        return (
          <WeeklyStrategyPage 
            onNavigateToCard={(id) => {
              setSelectedCardId(id);
              setActiveTab('card-detail');
            }}
            preselectedStrategyId={selectedStrategyId}
            onClearPreselectedStrategyId={() => setSelectedStrategyId(null)}
          />
        );
      case 'disclaimer':
        return <DisclaimerPage />;
      default:
        return <div style={{ color: 'var(--text-secondary)' }}>Screen not found.</div>;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">CA</div>
          <span className="brand-name">CardAdvisor</span>
        </div>

        <nav className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard />
            Dashboard
          </div>
          
          <div 
            className={`nav-item ${activeTab === 'watchlist' || activeTab.startsWith('card-') ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            <Table />
            Watchlist
          </div>

          <div 
            className={`nav-item ${activeTab === 'comparator' ? 'active' : ''}`}
            onClick={() => setActiveTab('comparator')}
          >
            <Scale />
            Comparator
          </div>

          <div 
            className={`nav-item ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            <Database />
            Providers
          </div>

          <div 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon />
            Settings
          </div>

          <div 
            className={`nav-item ${activeTab === 'weekly-strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly-strategy')}
          >
            <TrendingUp />
            Weekly Strategy
          </div>

          <div 
            className={`nav-item ${activeTab === 'disclaimer' ? 'active' : ''}`}
            onClick={() => setActiveTab('disclaimer')}
          >
            <HelpCircle />
            Disclaimer
          </div>
        </nav>

        {/* Cautious Positioning Notice */}
        <div className="disclaimer-badge">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '6px' }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} color="var(--color-watch)" />
            <span style={{ fontWeight: '600', color: 'white' }}>Support Tool Only</span>
          </div>
          <p>Calculations represent market signals, NOT financial advice. Value ranges may be incomplete.</p>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="main-content">
        {renderActiveScreen()}
      </main>
    </div>
  );
}
