import api from './axios';

export const getProducts = (params) =>
  api.get('/products', { params }).then((r) => r.data);

export const getProduct = (id) =>
  api.get(`/products/${id}`).then((r) => r.data);

export const createProduct = (data) =>
  api.post('/products', data).then((r) => r.data);

export const updateProduct = (id, data) =>
  api.put(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id) =>
  api.delete(`/products/${id}`).then((r) => r.data);

export const addIMEI = (id, imei) =>
  api.post(`/products/${id}/imei`, { imei }).then((r) => r.data);

export const getIMEIHistory = (imei) =>
  api.get(`/products/imei/${imei}/history`).then((r) => r.data);
