import api from './axios';

export const submitReconciliation = (data) =>
  api.post('/reconciliation', data).then((r) => r.data);

export const getReconciliations = (params) =>
  api.get('/reconciliation', { params }).then((r) => r.data);
