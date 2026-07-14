// farmer.js — Farmer portal logic
document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('farmer');
  if (!user) return;
  document.getElementById('farmerChip').textContent = `🌾 ${user.name}`;
  loadMyProducts();

  document.getElementById('uploadForm').addEventListener('submit', handleUpload);
  document.getElementById('imageInput').addEventListener('change', previewImage);
});

// ── Tab switching ──────────────────────────────────────────
function showTab(name, el) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
  if (name === 'myproducts') loadMyProducts();
}

// ── Image preview ─────────────────────────────────────────
function previewImage() {
  const file = document.getElementById('imageInput').files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('Image too large (max 10MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('previewWrap').style.display = 'block';
    const box = document.getElementById('uploadBox');
    box.style.borderColor = 'var(--forest-mid)';
    document.getElementById('uploadBoxContent').innerHTML =
      '<div style="font-size:2rem">✅</div><h3 style="color:var(--forest-mid)">Image Selected</h3><p style="font-size:.8rem;color:var(--muted)">Click to change</p>';
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  document.getElementById('imageInput').value = '';
  document.getElementById('previewWrap').style.display = 'none';
  document.getElementById('previewImg').src = '';
  document.getElementById('uploadBox').style.borderColor = '';
  document.getElementById('uploadBoxContent').innerHTML =
    '<div style="font-size:3rem;margin-bottom:.5rem">📸</div><h3>Upload Cashew Image</h3><p>Click or drag & drop — JPG, PNG, WEBP up to 10MB</p>';
}

// ── GPS capture ───────────────────────────────────────────
function captureGPS() {
  const status = document.getElementById('gpsStatus');
  if (!navigator.geolocation) { status.textContent = 'GPS not supported by browser.'; return; }
  status.textContent = 'Locating…';
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude.toFixed(7);
      const lng = pos.coords.longitude.toFixed(7);
      document.getElementById('latitude').value  = lat;
      document.getElementById('longitude').value = lng;
      status.textContent = '✅ Location captured';
      const display = document.getElementById('gpsDisplay');
      display.style.display = 'block';
      display.innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--forest-mid)"></i>
        &nbsp;Lat: <strong>${lat}</strong> &nbsp;·&nbsp; Lng: <strong>${lng}</strong>`;
    },
    err => { status.textContent = '❌ Could not get location: ' + err.message; }
  );
}

// ── Upload handler ────────────────────────────────────────
async function handleUpload(e) {
  e.preventDefault();
  const imageFile = document.getElementById('imageInput').files[0];
  if (!imageFile) { showToast('Please select a cashew image.', 'error'); return; }

  const grade    = document.getElementById('grade').value;
  const quantity = document.getElementById('quantity').value;
  const price    = document.getElementById('price').value;
  const name     = document.getElementById('productName').value;
  if (!grade || !quantity || !price || !name) { showToast('Please fill all required fields.', 'error'); return; }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting & analysing…';

  const formData = new FormData();
  formData.append('image',        imageFile);
  formData.append('product_name', name);
  formData.append('grade',        grade);
  formData.append('quantity',     quantity);
  formData.append('price',        price);
  formData.append('description',  document.getElementById('description').value);
  formData.append('latitude',     document.getElementById('latitude').value  || '');
  formData.append('longitude',    document.getElementById('longitude').value || '');

  try {
    const data = await farmerUpload(formData);
    showToast('✅ Product submitted! Awaiting admin approval.', 'success');

    // Show AI result if available
    const p = data.product;
    if (p.prediction_grade) {
      const box = document.getElementById('aiResultBox');
      box.style.display = 'block';
      document.getElementById('aiResultContent').innerHTML = `
        <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:.82rem;">
          <span>🏷️ <strong>Grade:</strong> ${p.prediction_grade}</span>
          <span>⭐ <strong>Score:</strong> ${p.prediction_score ?? '—'}</span>
          <span>📊 <strong>Confidence:</strong> ${p.confidence ? p.confidence + '%' : '—'}</span>
        </div>`;
    }

    e.target.reset();
    clearImage();
    document.getElementById('gpsStatus').textContent = 'Not captured yet';
    document.getElementById('gpsDisplay').style.display = 'none';
    setTimeout(() => loadMyProducts(), 800);
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit for Admin Approval';
  }
}

// ── Load my products ──────────────────────────────────────
async function loadMyProducts() {
  try {
    const { products } = await farmerGetMyProducts();
    const pending  = products.filter(p => p.status === 'pending').length;
    const approved = products.filter(p => p.status === 'approved').length;
    const rejected = products.filter(p => p.status === 'rejected').length;

    document.getElementById('myStats').innerHTML = `
      <div class="stat-card"><div class="num">${products.length}</div><div class="lbl">Total</div></div>
      <div class="stat-card"><div class="num" style="color:#f57f17">${pending}</div><div class="lbl">Pending</div></div>
      <div class="stat-card"><div class="num" style="color:#2e7d32">${approved}</div><div class="lbl">Approved</div></div>
      <div class="stat-card"><div class="num" style="color:#c62828">${rejected}</div><div class="lbl">Rejected</div></div>`;

    // Show rejection notice banner if any rejected products
    const rejectedProducts = products.filter(p => p.status === 'rejected');
    const noticeEl = document.getElementById('rejectionNotice');
    if (noticeEl) {
      if (rejectedProducts.length) {
        noticeEl.style.display = 'flex';
        noticeEl.innerHTML = `
          <i class="fas fa-exclamation-circle" style="color:#c62828;font-size:1.2rem;flex-shrink:0;"></i>
          <div>
            <div style="font-weight:700;color:#c62828;font-size:.9rem;">
              ${rejectedProducts.length} product${rejectedProducts.length > 1 ? 's' : ''} rejected by admin
            </div>
            <div style="font-size:.78rem;color:var(--muted);margin-top:.15rem;">
              Your submitted product${rejectedProducts.length > 1 ? 's were' : ' was'} reviewed and rejected. Please check the details below, improve quality or description, and resubmit.
            </div>
          </div>`;
      } else {
        noticeEl.style.display = 'none';
      }
    }

    const tbody = document.getElementById('myProductsBody');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--muted)">No products yet. Upload your first product.</td></tr>';
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image_url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--border);"/></td>
        <td style="font-weight:600">${p.product_name}</td>
        <td><span class="badge-pill">${p.grade}</span></td>
        <td>${p.quantity} kg</td>
        <td style="color:var(--forest-mid);font-weight:700">₹${p.price}</td>
        <td style="color:var(--muted);font-size:.78rem">${p.harvest_date ? new Date(p.harvest_date).toLocaleDateString('en-IN') : '—'}</td>
        <td style="color:var(--muted);font-size:.78rem">${new Date(p.upload_time).toLocaleDateString('en-IN')}</td>
        <td>
          <span class="status-pill status-${p.status}">
            ${p.status === 'pending'  ? '⏳ Pending Review' :
              p.status === 'approved' ? '✅ Approved — Live' :
                                        '❌ Rejected by Admin'}
          </span>
          ${p.status === 'rejected' ? `<div style="font-size:.72rem;color:#c62828;margin-top:.3rem;">Please review and resubmit with better quality details.</div>` : ''}
        </td>
      </tr>`).join('');
  } catch (err) {
    showToast('Failed to load products: ' + err.message, 'error');
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}
