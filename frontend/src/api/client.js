import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 15000 });

export async function fetchCurrentPrices() {
  const { data } = await api.get('/prices');
  return data;
}

export async function fetchHistory(fuel = 'diesel_b7', days = 30) {
  const { data } = await api.get('/prices/history', { params: { fuel, days } });
  return data;
}

export async function fetchAllHistory(days = 90) {
  const { data } = await api.get('/prices/all-history', { params: { days } });
  return data;
}

export async function fetchPredictions(days = 7) {
  const { data } = await api.get('/prediction', { params: { days } });
  return data;
}

export async function fetchFuelPrediction(fuel, days = 7) {
  const { data } = await api.get(`/prediction/${fuel}`, { params: { days } });
  return data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}
