import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const getUsers = (params) =>
  api.get('/auth/users', { params }).then((r) => r.data);

export const updateUser = (id, data) =>
  api.put(`/auth/users/${id}`, data).then((r) => r.data);
