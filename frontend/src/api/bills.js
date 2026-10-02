import api from './axios';

export const getBills = (params) =>
  api.get('/bills', { params }).then((r) => r.data);

export const getBill = (id) =>
  api.get(`/bills/${id}`).then((r) => r.data);

export const createBill = (data) =>
  api.post('/bills', data).then((r) => r.data);

export const requestCancellation = (id, reason) =>
  api.post(`/bills/${id}/cancel-request`, { reason }).then((r) => r.data);

export const approveCancellation = (id) =>
  api.post(`/bills/${id}/approve-cancel`).then((r) => r.data);

export const getDailySummary = (branch, date) =>
  api.get('/bills/summary', { params: { branch, date } }).then((r) => r.data);
