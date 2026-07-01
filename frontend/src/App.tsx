import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Table2, Scale, Database, Settings as SettingsIcon,
  Info, TrendingUp, Plus, ShieldAlert,
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

interface NavEntry {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: (tab: string) => boolean;
}

const MAIN_NAV: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, isActive: t => t === 'dashboard' },
  { id: 'watchlist', label: 'Watchlist', icon: <Table2 />, isActive: t => t === 'watchlist' || t.startsWith('card-') },
  { id: 'comparator', label: 'Comparatore', icon: <Scale />, isActive: t => t === 'comparator' },
];

const ANALYSIS_NAV: NavEntry[] = [
  { id: 'weekly-strategy', label: 'Strategia', icon: <TrendingUp />, isActive: t => t === 'weekly-strategy' },
  { id: 'providers', label: 'Provider', icon: <Database />, isActive: t => t === 'providers' },
];

const SYSTEM_NAV: NavEntry[] = [
  { id: 'settings', label: 'Impostazioni', icon: <SettingsIcon />, isActive: t => t === 'settings' },
  { id: 'disclaimer', label: 'Disclaimer', icon: <Info />, isActive: t => t === 'disclaimer' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editCardId, setEditCardId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AppSettings>({
    currency: 'EUR',
    defaultGame: 'One Piece',
    defaultLanguage: 'English',
    defaultMarketplace: 'VINTED',
    showDisclaimer: true,
  });

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

  const goToAdd = () => {
    setEditCardId(null);
    setActiveTab('card-add');
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
            onNavigateToAdd={goToAdd}
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
            onNavigateToAdd={goToAdd}
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
        return <div style={{ color: 'var(--text-secondary)' }}>Pagina non trovata.</div>;
    }
  };

  const renderNavItems = (entries: NavEntry[]) =>
    entries.map(entry => (
      <button
        key={entry.id}
        type="button"
        className={`nav-item ${entry.isActive(activeTab) ? 'active' : ''}`}
        onClick={() => setActiveTab(entry.id)}
      >
        {entry.icon}
        {entry.label}
      </button>
    ));

  return (
    <div className="app-container">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">CA</div>
          <span className="brand-name">CardAdvisor</span>
        </div>

        <button type="button" className="btn btn-primary sidebar-add-btn" onClick={goToAdd}>
          <Plus size={15} />
          Nuova carta
        </button>

        <nav className="nav-links" aria-label="Navigazione principale">
          {renderNavItems(MAIN_NAV)}
          <div className="nav-section-label">Analisi</div>
          {renderNavItems(ANALYSIS_NAV)}
          <div className="nav-section-label">Sistema</div>
          {renderNavItems(SYSTEM_NAV)}
        </nav>

        <div className="disclaimer-badge">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, color: 'var(--text-secondary)', fontWeight: 500 }}>
            <ShieldAlert size={12} style={{ flexShrink: 0 }} />
            <span>Strumento di supporto</span>
          </div>
          Segnali di mercato, non consulenza finanziaria. Nessuna garanzia di rendimento.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-row">
          <div className="brand-section" style={{ padding: 0 }}>
            <div className="brand-logo">CA</div>
            <span className="brand-name">CardAdvisor</span>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={goToAdd}>
            <Plus size={14} />
            Nuova
          </button>
        </div>
        <nav className="mobile-nav" aria-label="Navigazione principale">
          {renderNavItems([...MAIN_NAV, ...ANALYSIS_NAV, ...SYSTEM_NAV])}
        </nav>
      </div>

      {/* Main viewport */}
      <main className="main-content">
        {renderActiveScreen()}
      </main>
    </div>
  );
}
