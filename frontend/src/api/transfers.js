import api from './axios';

export const getTransfers = (params) =>
  api.get('/transfers', { params }).then((r) => r.data);

export const requestTransfer = (data) =>
  api.post('/transfers', data).then((r) => r.data);

export const approveTransfer = (id) =>
  api.post(`/transfers/${id}/approve`).then((r) => r.data);

export const rejectTransfer = (id) =>
  api.post(`/transfers/${id}/reject`).then((r) => r.data);
