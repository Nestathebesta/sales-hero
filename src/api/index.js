import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const fetchState = async () => {
  const response = await axios.get(`${API_URL}/state`);
  return response.data;
};

export const customizePlayer = async (character, skin) => {
  const response = await axios.post(`${API_URL}/player/customize`, { character, skin });
  return response.data;
};

export const triggerWebhook = async (leadId, eventType, contactInfo = {}) => {
  const response = await axios.post(`${API_URL}/webhook`, {
    leadId,
    eventType,
    contactInfo,
  });
  return response.data;
};
