/**
 * api.js — Central API helper for all frontend pages
 * All fetch() calls go through these functions.
 */

const API_BASE = 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────
function getToken()        { return localStorage.getItem('cashew_token'); }
function setToken(t)       { localStorage.setItem('cashew_token', t); }
function removeToken()     { localStorage.removeItem('cashew_token'); }
function setUser(u)        { localStorage.setItem('cashew_user', JSON.stringify(u)); }
function getUser()         { try { return JSON.parse(localStorage.getItem('cashew_user')); } catch { return null; } }
function removeUser()      { localStorage.removeItem('cashew_user'); }

function authHeaders(extra = {}) {
  const t = getToken();
  return { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}), ...extra };
}

// ── Generic request ───────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  try {
    const res  = await fetch(API_BASE + endpoint, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────
async function register(payload) {
  const data = await apiRequest('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (data.token) { setToken(data.token); setUser(data.user); }
  return data;
}

async function login(email, password) {
  const data = await apiRequest('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (data.token) { setToken(data.token); setUser(data.user); }
  return data;
}

function logout() {
  removeToken(); removeUser();
  window.location.href = '/';
}

// ── Farmer ────────────────────────────────────────────────
async function farmerUpload(formData) {
  const token = getToken();
  return apiRequest('/farmer/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData   // FormData — do NOT set Content-Type manually
  });
}

async function farmerGetMyProducts() {
  return apiRequest('/farmer/products', { headers: authHeaders() });
}

// ── Customer ──────────────────────────────────────────────
async function getApprovedProducts() {
  return apiRequest('/customer/products');
}

async function placeOrder(payload) {
  return apiRequest('/customer/orders', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
}

async function getMyOrders() {
  return apiRequest('/customer/orders', { headers: authHeaders() });
}

// ── Admin ─────────────────────────────────────────────────
async function adminGetPending() {
  return apiRequest('/admin/pending', { headers: authHeaders() });
}

async function adminApprove(id) {
  return apiRequest(`/admin/approve/${id}`, { method: 'POST', headers: authHeaders() });
}

async function adminReject(id) {
  return apiRequest(`/admin/reject/${id}`, { method: 'POST', headers: authHeaders() });
}

async function adminGetStats() {
  return apiRequest('/admin/stats', { headers: authHeaders() });
}

async function adminGetFarmers() {
  return apiRequest('/admin/farmers', { headers: authHeaders() });
}

async function adminGetCustomers() {
  return apiRequest('/admin/customers', { headers: authHeaders() });
}

async function adminGetOrders() {
  return apiRequest('/admin/orders', { headers: authHeaders() });
}

async function adminAnalyse(id) {
  return apiRequest(`/admin/analyse/${id}`, { method: 'POST', headers: authHeaders() });
}

// Role guard (call at top of each portal page)
function requireAuth(expectedRole) {
  const user  = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/login.html';
    return null;
  }
  if (expectedRole && user.role !== expectedRole) {
    // Clear stale token and redirect to login
    removeToken();
    removeUser();
    window.location.href = '/login.html?error=wrong_role&need=' + expectedRole;
    return null;
  }
  return user;
}
