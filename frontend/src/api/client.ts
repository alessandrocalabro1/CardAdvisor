const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const BASE_URL = `${API_BASE.replace(/\/$/, '')}/api`;

/**
 * Common request helper. Handles base URL routing, JSON formatting,
 * header configurations, and API error formatting.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Connection error' }));
    throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as any;
  }
  return response.json() as Promise<T>;
}

// -------------------------------------------------------------
// Cards CRUD
// -------------------------------------------------------------
export async function apiGetCards(): Promise<any[]> {
  return request<any[]>('/cards');
}

export async function apiGetCardById(id: string): Promise<any> {
  return request<any>(`/cards/${id}`);
}

export async function apiCreateCard(data: any): Promise<any> {
  return request<any>('/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateCard(id: string, data: any): Promise<any> {
  return request<any>(`/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteCard(id: string): Promise<void> {
  return request<void>(`/cards/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Market Prices
// -------------------------------------------------------------
export async function apiGetMarketPrices(cardId: string): Promise<any[]> {
  return request<any[]>(`/cards/${cardId}/market-prices`);
}

export async function apiAddManualMarketPrice(cardId: string, data: any): Promise<any> {
  return request<any>(`/cards/${cardId}/market-prices/manual`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiRefreshPrices(cardId: string): Promise<any> {
  return request<any>(`/cards/${cardId}/refresh-prices`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Offers
// -------------------------------------------------------------
export async function apiGetOffers(cardId: string): Promise<any[]> {
  return request<any[]>(`/cards/${cardId}/offers`);
}

export async function apiCreateOffer(cardId: string, data: any): Promise<any> {
  return request<any>(`/cards/${cardId}/offers`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateOffer(offerId: string, data: any): Promise<any> {
  return request<any>(`/offers/${offerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteOffer(offerId: string): Promise<void> {
  return request<void>(`/offers/${offerId}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Portfolio
// -------------------------------------------------------------
export async function apiGetPortfolio(): Promise<any[]> {
  return request<any[]>('/portfolio');
}

export async function apiCreatePortfolioItem(data: any): Promise<any> {
  return request<any>('/portfolio', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdatePortfolioItem(id: string, data: any): Promise<any> {
  return request<any>(`/portfolio/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeletePortfolioItem(id: string): Promise<void> {
  return request<void>(`/portfolio/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Price Snapshots
// -------------------------------------------------------------
export async function apiGetSnapshots(cardId: string): Promise<any[]> {
  return request<any[]>(`/cards/${cardId}/snapshots`);
}

export async function apiCreateSnapshot(cardId: string): Promise<any> {
  return request<any>(`/cards/${cardId}/snapshots/create`, {
    method: 'POST',
  });
}

// -------------------------------------------------------------
// Alerts
// -------------------------------------------------------------
export async function apiGetAlerts(): Promise<any[]> {
  return request<any[]>('/alerts');
}

export async function apiCreateAlert(data: any): Promise<any> {
  return request<any>('/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateAlert(id: string, data: any): Promise<any> {
  return request<any>(`/alerts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteAlert(id: string): Promise<void> {
  return request<void>(`/alerts/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Provider Actions
// -------------------------------------------------------------
export async function apiGetProviderStatuses(): Promise<any[]> {
  return request<any[]>('/providers/status');
}

export async function apiCheckProviders(): Promise<any[]> {
  return request<any[]>('/providers/check', {
    method: 'POST',
  });
}

export async function apiImportCardmarketSample(): Promise<any> {
  return request<any>('/providers/cardmarket/import-sample', {
    method: 'POST',
  });
}

export async function apiTestPriceCharting(): Promise<any> {
  return request<any>('/providers/pricecharting/test', {
    method: 'POST',
  });
}

export async function apiTestJustTcg(): Promise<any> {
  return request<any>('/providers/justtcg/test', {
    method: 'POST',
  });
}

export async function apiSearchOptcg(query: string): Promise<any[]> {
  return request<any[]>('/providers/optcg/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// -------------------------------------------------------------
// Exports / Backup Imports
// -------------------------------------------------------------
export const JSON_EXPORT_URL = `${BASE_URL}/export/json`;
export const CSV_EXPORT_URL = `${BASE_URL}/export/portfolio.csv`;

export async function apiImportBackup(backupData: any): Promise<any> {
  return request<any>('/import/json', {
    method: 'POST',
    body: JSON.stringify(backupData),
  });
}

// -------------------------------------------------------------
// Weekly Strategy CRUD
// -------------------------------------------------------------
export async function apiGetWeeklyStrategies(): Promise<any[]> {
  return request<any[]>('/weekly-strategies');
}

export async function apiGetLatestWeeklyStrategy(): Promise<any> {
  return request<any>('/weekly-strategies/latest');
}

export async function apiGetWeeklyStrategyById(id: string): Promise<any> {
  return request<any>(`/weekly-strategies/${id}`);
}

export async function apiCreateWeeklyStrategy(data: any): Promise<any> {
  return request<any>('/weekly-strategies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateWeeklyStrategy(id: string, data: any): Promise<any> {
  return request<any>(`/weekly-strategies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteWeeklyStrategy(id: string): Promise<void> {
  return request<void>(`/weekly-strategies/${id}`, {
    method: 'DELETE',
  });
}

// -------------------------------------------------------------
// Decision Brief
// -------------------------------------------------------------
export async function apiGetDecisionBrief(cardId: string): Promise<any> {
  return request<any>(`/cards/${cardId}/decision-brief`);
}

// -------------------------------------------------------------
// Card Weekly Strategy Mentions
// -------------------------------------------------------------
export async function apiGetCardWeeklyStrategyReferences(cardId: string): Promise<any[]> {
  return request<any[]>(`/cards/${cardId}/weekly-strategy-references`);
}
