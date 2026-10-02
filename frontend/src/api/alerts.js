import api from './axios';

export const getAlerts = () =>
  api.get('/alerts').then((r) => r.data);

export const acknowledgeAlert = (id) =>
  api.put(`/alerts/${id}/acknowledge`).then((r) => r.data);

export const getAlertHistory = (params) =>
  api.get('/alerts/history', { params }).then((r) => r.data);

export const getSseToken = () =>
  api.post('/sse/token').then((r) => r.data.sseToken);
