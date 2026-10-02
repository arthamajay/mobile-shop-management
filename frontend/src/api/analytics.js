import api from './axios';

export const getDashboardStats = (branch) =>
  api.get('/analytics/dashboard', { params: { branch } }).then((r) => r.data);

export const getBranchComparison = () =>
  api.get('/analytics/branch-comparison').then((r) => r.data);

export const getTopProducts = () =>
  api.get('/analytics/top-products').then((r) => r.data);

export const getEmployeePerformance = () =>
  api.get('/analytics/employee-performance').then((r) => r.data);

export const getRevenueChart = (days = 30) =>
  api.get('/analytics/revenue-chart', { params: { days } }).then((r) => r.data);
