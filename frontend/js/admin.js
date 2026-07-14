// admin.js — Admin portal logic
document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('admin');
  if (!user) return;
  document.getElementById('adminChip').textContent = `⚙ ${user.name}`;

  // Socket.io — real-time pending notifications
  const socket = io('http://localhost:5000');
  socket.emit('join_admin');
  socket.on('new_product_pending', data => {
    showToast(`🌾 New submission from ${data.farmer_name} — Grade: ${data.grade}`, 'info');
    loadPending();
    loadStats();
  });

  loadStats();
  loadPending();
  document.getElementById('uploadForm') && document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

function showTab(name, el) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'pending')   loadPending();
  if (name === 'approved')  loadApproved();
  if (name === 'farmers')   loadFarmers();
  if (name === 'customers') loadCustomers();
  if (name === 'orders')    loadOrders();
}

async function loadStats() {
  try {
    const { stats } = await adminGetStats();
    document.getElementById('adminStats').innerHTML = `
      <div class="stat-card"><div class="num" style="color:#f57f17">${stats.pending}</div><div class="lbl">Pending</div></div>
      <div class="stat-card"><div class="num" style="color:#2e7d32">${stats.approved}</div><div class="lbl">Approved</div></div>
      <div class="stat-card"><div class="num" style="color:#c62828">${stats.rejected}</div><div class="lbl">Rejected</div></div>
      <div class="stat-card"><div class="num">${stats.total}</div><div class="lbl">Total</div></div>`;
    document.getElementById('pendingBadge').textContent = stats.pending;
  } catch (e) { showToast('Stats error: ' + e.message, 'error'); }
}

async function loadPending() {
  try {
    const { products } = await adminGetPending();

    // Render cards — used in both Dashboard and Pending tab
    const makeCards = (items) => {
      if (!items.length) return '<div class="empty-state">✅ No pending products. All caught up!</div>';
      return items.map(p => `
        <div class="review-card" id="rc-${p.id}">
          <img src="${p.image_url}" class="review-img" alt="${p.grade}"/>
          <div class="review-details">
            <div class="review-farmer">
              <div class="farmer-av">${(p.farmer_name||'F').slice(0,2).toUpperCase()}</div>
              <div>
                <div style="font-weight:700;color:var(--brown-dk)">${p.farmer_name}</div>
                <div style="font-size:.75rem;color:var(--muted)">📍 ${p.village||p.district||'Panruti'} &nbsp;·&nbsp; 📞 ${p.farmer_phone||'—'}</div>
              </div>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin:.6rem 0;">
              <span class="badge-pill">${p.grade}</span>
              <span class="badge-pill" style="color:var(--forest-mid);font-weight:700">₹${p.price}/kg</span>
              <span class="badge-pill">📦 ${p.quantity}kg</span>
              <span class="badge-pill">🕐 ${new Date(p.upload_time).toLocaleString('en-IN')}</span>
            </div>
            ${p.latitude ? `<div style="font-size:.78rem;color:var(--muted);margin-bottom:.4rem;">📍 GPS: ${p.latitude}, ${p.longitude}</div>` : ''}
            ${p.description ? `<div class="review-desc">"${p.description}"</div>` : ''}
            <!-- AI Result Box — hidden until admin clicks Analyse -->
            <div id="ai-result-${p.id}" style="display:none;margin-top:.7rem;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:1.5px solid #a5d6a7;border-radius:10px;padding:.85rem 1rem;">
              <div style="font-size:.78rem;font-weight:700;color:#2e7d32;margin-bottom:.5rem;display:flex;align-items:center;gap:.4rem;">
                <i class="fas fa-robot"></i> AI Analysis Result
              </div>
              <div id="ai-result-content-${p.id}" style="display:flex;gap:1.2rem;flex-wrap:wrap;font-size:.82rem;"></div>
            </div>
          </div>
          <div class="review-actions">
            <button class="btn-approve" onclick="approve(${p.id})"><i class="fas fa-check"></i> Approve</button>
            <button class="btn-reject"  onclick="reject(${p.id})"><i class="fas fa-times"></i> Reject</button>
            <button class="btn-analyse" id="ai-btn-${p.id}" onclick="analyseAI(${p.id}, this)">
              <i class="fas fa-robot"></i> Analyse with AI
            </button>
            <span class="status-pill status-pending">Pending</span>
          </div>
        </div>`).join('');
    };

    // Pending tab — all cards
    const pendingEl = document.getElementById('pendingList');
    if (pendingEl) pendingEl.innerHTML = makeCards(products);

    // Dashboard tab — show latest 3 only
    const dashEl = document.getElementById('dashPendingList');
    if (dashEl) dashEl.innerHTML = makeCards(products.slice(0, 3));

  } catch (e) { showToast('Error loading pending: ' + e.message, 'error'); }
}

async function analyseAI(id, btn) {
  // Disable all AI buttons for this product id (could be in 2 tabs)
  document.querySelectorAll('#ai-btn-' + id).forEach(b => {
    b.disabled = true;
    b.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analysing…';
  });
  try {
    const result = await adminAnalyse(id);

    const gradeColor = result.grade === 'W180' ? '#1b5e20' :
                       result.grade === 'W210' ? '#2e7d32' :
                       result.grade === 'W240' ? '#388e3c' :
                       result.grade === 'W450' ? '#f57f17' :
                       result.grade === 'WBB'  ? '#e65100' : '#c62828';

    const resultHTML = `
      <div style="display:flex;align-items:center;gap:.4rem;">
        <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);">AI Grade</span>
        <span style="background:${gradeColor};color:#fff;padding:.2rem .65rem;border-radius:20px;font-size:.78rem;font-weight:700;">${result.grade}</span>
      </div>
      <div>
        <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);">Quality Score</span>
        <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:#2e7d32;line-height:1.1;">${result.quality_score}<small style="font-size:.7rem;font-family:'DM Sans',sans-serif;">/100</small></div>
      </div>
      <div>
        <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);">Confidence</span>
        <div style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;color:#1565c0;line-height:1.1;">${result.confidence}<small style="font-size:.7rem;font-family:'DM Sans',sans-serif;">%</small></div>
      </div>`;

    // Show result in all cards with this id
    document.querySelectorAll('#ai-result-' + id).forEach(box => { box.style.display = 'block'; });
    document.querySelectorAll('#ai-result-content-' + id).forEach(c => { c.innerHTML = resultHTML; });
    document.querySelectorAll('#ai-btn-' + id).forEach(b => {
      b.innerHTML = '<i class="fas fa-check-circle"></i> Analysis Done';
      b.style.background = '#e8f5e9';
      b.style.color = '#2e7d32';
      b.style.border = '1px solid #a5d6a7';
    });
    showToast(`AI Analysis — Grade: ${result.grade} | Score: ${result.quality_score}/100 | Confidence: ${result.confidence}%`, 'success');
  } catch (e) {
    document.querySelectorAll('#ai-btn-' + id).forEach(b => {
      b.disabled = false;
      b.innerHTML = '<i class="fas fa-robot"></i> Analyse with AI';
    });
    showToast('AI analysis failed: ' + e.message, 'error');
  }
}

async function approve(id) {
  try {
    await adminApprove(id);
    // Remove from both dashboard and pending tab
    document.querySelectorAll('#rc-' + id).forEach(card => {
      card.style.transition = 'all .35s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(() => card.remove(), 360);
    });
    showToast('✅ Product approved and listed in marketplace!', 'success');
    loadStats();
    setTimeout(() => loadPending(), 500);
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function reject(id) {
  if (!confirm('Are you sure you want to reject this product? The farmer will be notified.')) return;
  try {
    await adminReject(id);
    document.querySelectorAll('#rc-' + id).forEach(card => {
      card.style.transition = 'all .35s';
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      setTimeout(() => card.remove(), 360);
    });
    showToast('Product rejected. Farmer has been notified.', 'error');
    loadStats();
    setTimeout(() => loadPending(), 500);
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadApproved() {
  try {
    const { products } = await apiRequest('/customer/products');
    const el = document.getElementById('approvedList');
    if (!products.length) { el.innerHTML = '<div class="empty-state">No approved products yet.</div>'; return; }
    el.innerHTML = `<div class="products-grid">${products.map(p => `
      <div class="product-card">
        <img src="${p.image_url}" class="product-img"/>
        <div class="product-body">
          <div class="product-name">${p.product_name}</div>
          <div style="display:flex;gap:.4rem;margin:.4rem 0;flex-wrap:wrap;">
            <span class="badge-pill">${p.grade}</span>
            <span class="badge-pill status-approved">Live</span>
          </div>
          <div style="font-size:.82rem;color:var(--muted)">₹${p.price}/kg · ${p.quantity}kg · ${p.farmer_name}</div>
        </div>
      </div>`).join('')}</div>`;
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadFarmers() {
  try {
    const { farmers } = await adminGetFarmers();
    renderTable('farmersList', ['Name','Email','Phone','Village','District','Farm Size','Joined'],
      farmers.map(f => [f.name, f.email, f.phone||'—', f.village||'—', f.district||'—',
        f.farm_size ? f.farm_size+' acres' : '—', new Date(f.created_at).toLocaleDateString('en-IN')]));
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadCustomers() {
  try {
    const { customers } = await adminGetCustomers();
    renderTable('customersList', ['Name','Email','Phone','City','Joined'],
      customers.map(c => [c.name, c.email, c.phone||'—', c.city||'—', new Date(c.created_at).toLocaleDateString('en-IN')]));
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function loadOrders() {
  try {
    const { orders } = await adminGetOrders();
    renderTable('ordersList', ['Order ID','Customer','Total','Payment','City','Status','Date'],
      orders.map(o => ['#'+o.id, o.customer_name, '₹'+o.total, o.payment_method, o.city||'—',
        `<span class="status-pill status-approved">${o.status}</span>`,
        new Date(o.created_at).toLocaleDateString('en-IN')]));
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

function renderTable(containerId, headers, rows) {
  const el = document.getElementById(containerId);
  if (!rows.length) { el.innerHTML = '<div class="empty-state">No records found.</div>'; return; }
  el.innerHTML = `<div style="overflow-x:auto"><table class="data-table">
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
}
