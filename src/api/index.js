import axios from 'axios';

// Same-origin /api by default: in dev, Vite proxies /api -> the local API server;
// in prod, Vercel rewrites /api/* to the serverless function. Override with
// VITE_API_URL only if the API lives on a different origin.
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const fetchState = async () => {
  const response = await axios.get(`${API_URL}/state`);
  return response.data;
};

export const customizePlayer = async (character, skin) => {
  const response = await axios.post(`${API_URL}/player/customize`, { character, skin });
  return response.data;
};

export const triggerWebhook = async (leadId, eventType, contactInfo = {}, count = 1) => {
  const response = await axios.post(`${API_URL}/webhook`, {
    leadId,
    eventType,
    contactInfo,
    count,
  });
  return response.data;
};

export const fetchBriefing = async () => {
  const response = await axios.get(`${API_URL}/ai/briefing`);
  return response.data;
};
