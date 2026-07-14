// customer.js
let allProducts = [];
let cart = [];
let selectedPay = 'COD';

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth('customer');
  if (!user) return;
  document.getElementById('customerChip').textContent = `🛒 ${user.name}`;
  loadProducts();
});

function showTab(name, el) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(n => n && n.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');
  if (name === 'cart')   renderCart();
  if (name === 'orders') loadOrders();
}

// ── Marketplace ───────────────────────────────────────────
async function loadProducts() {
  try {
    const { products } = await getApprovedProducts();
    allProducts = products;
    renderProducts(products);
  } catch (e) { showToast('Failed to load products: ' + e.message, 'error'); }
}

function filterProducts() {
  const q     = document.getElementById('searchInput').value.toLowerCase();
  const grade = document.getElementById('gradeFilter').value;
  const price = document.getElementById('priceFilter').value;
  let filtered = allProducts.filter(p => {
    const matchQ = !q || (p.product_name + p.grade + (p.farmer_name||'')).toLowerCase().includes(q);
    const matchG = !grade || p.grade === grade;
    let matchP = true;
    if (price === 'low')  matchP = p.price < 700;
    if (price === 'mid')  matchP = p.price >= 700 && p.price <= 1000;
    if (price === 'high') matchP = p.price > 1000;
    return matchQ && matchG && matchP;
  });
  renderProducts(filtered);
}

function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  if (!products.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:3rem;">No products found.</p>';
    return;
  }
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="product-img-wrap">
        <img src="${p.image_url}" class="product-img" alt="${p.grade}"/>
        <div class="product-verified">✓ Admin Verified</div>
      </div>
      <div class="product-body">
        <div class="product-farmer-row">
          <div class="farmer-av">${(p.farmer_name||'F').slice(0,2).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:.85rem;color:var(--brown-dk)">${p.farmer_name||'Farmer'}</div>
            <div style="font-size:.73rem;color:var(--muted)">📍 ${p.village||'Panruti'}</div>
          </div>
        </div>
        <div class="product-name">${p.product_name}</div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:.4rem 0;">
          <span class="badge-pill">${p.grade}</span>
          <span class="badge-pill">📦 ${p.quantity}kg</span>
        </div>
        <div class="product-footer">
          <div class="product-price">₹${p.price}<small>/kg</small></div>
          <button class="btn-buy" onclick="addToCart(${p.id},'${p.product_name}',${p.price},'${p.image_url}','${p.grade}')">
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>`).join('');
}

// ── Cart ──────────────────────────────────────────────────
function addToCart(id, name, price, img, grade) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; showToast(`${name} quantity updated!`, 'success'); }
  else { cart.push({ id, name, price, img, grade, qty: 1 }); showToast(`${name} added to cart!`, 'success'); }
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartCountNav').textContent = count;
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cartContent');
  if (!cart.length) {
    el.innerHTML = `<div class="empty-state" style="text-align:center;padding:3rem;">
      <div style="font-size:3rem;opacity:.3;margin-bottom:.8rem;">🛒</div>
      <p style="color:var(--muted)">Your cart is empty.</p>
      <button class="btn-submit" style="margin-top:1rem;max-width:200px;" onclick="showTab('marketplace',null)">Browse Products</button>
    </div>`;
    return;
  }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border:1px solid #a5d6a7;border-radius:10px;padding:.6rem 1rem;margin-bottom:1rem;font-size:.78rem;font-weight:600;color:#2e7d32;">
      <i class="fas fa-leaf"></i> Farm-fresh · Admin-verified · Delivered in 2–5 days
    </div>
    <div style="display:flex;flex-direction:column;gap:.8rem;max-height:400px;overflow-y:auto;padding-right:.2rem;">
      ${cart.map(i => `
        <div style="display:flex;align-items:center;gap:1rem;background:var(--white);border:1px solid var(--border);border-radius:12px;padding:1rem;">
          <img src="${i.img}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:1.5px solid var(--border);flex-shrink:0;"/>
          <div style="flex:1;min-width:0;">
            <div style="font-family:'Playfair Display',serif;font-weight:700;color:var(--brown-dk);font-size:.95rem;">${i.name}</div>
            <div style="font-size:.75rem;color:var(--muted);margin:.2rem 0;">₹${i.price}/kg</div>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <button onclick="changeQty(${i.id},-1)" style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border);background:var(--warm);cursor:pointer;font-weight:700;">−</button>
              <span style="font-weight:700;min-width:22px;text-align:center;">${i.qty} kg</span>
              <button onclick="changeQty(${i.id},1)"  style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border);background:var(--warm);cursor:pointer;font-weight:700;">+</button>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-family:'Playfair Display',serif;font-weight:700;color:var(--forest-mid);font-size:1rem;">₹${(i.price*i.qty).toLocaleString()}</div>
            <button onclick="changeQty(${i.id},-99)" style="background:none;border:none;color:var(--muted);font-size:.72rem;cursor:pointer;margin-top:.3rem;">✕ Remove</button>
          </div>
        </div>`).join('')}
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 0 .5rem;border-top:2px dashed var(--border);margin-top:.8rem;">
      <div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--brown);">Total Payable</div>
           <div style="font-size:.75rem;color:var(--muted);">${cart.reduce((s,i)=>s+i.qty,0)} kg · incl. all taxes</div></div>
      <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--forest-mid);">₹${total.toLocaleString()}</div>
    </div>
    <button onclick="openCheckout()" class="btn-submit" style="display:flex;align-items:center;justify-content:center;gap:.5rem;margin-top:.8rem;">
      <i class="fas fa-lock" style="font-size:.85rem;"></i> Proceed to Checkout
    </button>`;
}

function openCheckout() {
  if (!cart.length) { showToast('Cart is empty.', 'info'); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById('checkoutSummary').innerHTML = `
    <div class="checkout-section-title" style="margin-top:0;">Order Summary</div>
    ${cart.map(i => `<div style="display:flex;justify-content:space-between;font-size:.85rem;padding:.3rem 0;color:var(--muted);">
      <span>${i.name} × ${i.qty}kg</span><span>₹${(i.price*i.qty).toLocaleString()}</span></div>`).join('')}
    <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;border-top:1px solid var(--border);margin-top:.5rem;padding-top:.7rem;">
      <span>Total Payable</span><span style="color:var(--forest-mid)">₹${total.toLocaleString()}</span>
    </div>`;
  const user = getUser();
  if (user) {
    document.getElementById('ckName').value = user.name || '';
    document.getElementById('ckMobile').value = user.phone || '';
  }
  document.querySelectorAll('.payment-opt').forEach((el,i) => el.classList.toggle('active', i===0));
  selectedPay = 'COD';
  showTab('checkout', null);
}

function selectPay(input) {
  selectedPay = input.value;
  document.querySelectorAll('.payment-opt').forEach(el => el.classList.remove('active'));
  input.closest('.payment-opt').classList.add('active');
}

async function placeOrderHandler(e) {
  e.preventDefault();
  const items = cart.map(i => ({ product_id: i.id, qty: i.qty, price: i.price }));
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  try {
    await placeOrder({
      items, total,
      payment_method: selectedPay,
      address:  document.getElementById('ckAddress').value,
      city:     document.getElementById('ckCity').value,
      state:    document.getElementById('ckState').value,
      pin:      document.getElementById('ckPin').value,
      mobile:   document.getElementById('ckMobile').value
    });
    cart = [];
    updateCartCount();
    e.target.reset();
    showToast(`✅ Order placed via ${selectedPay}! We'll contact you shortly.`, 'success');
    showTab('orders', null);
  } catch (err) { showToast('Order failed: ' + err.message, 'error'); }
}

// ── Orders ────────────────────────────────────────────────
async function loadOrders() {
  try {
    const { orders } = await getMyOrders();
    const el = document.getElementById('ordersList');
    if (!orders.length) { el.innerHTML = '<div class="empty-state">No orders yet.</div>'; return; }
    el.innerHTML = orders.map(o => `
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem;">
          <div style="font-family:'Playfair Display',serif;font-weight:700;color:var(--brown-dk);">Order #${o.id}</div>
          <span class="status-pill status-approved">${o.status}</span>
        </div>
        <div style="font-size:.82rem;color:var(--muted);margin-bottom:.6rem;">
          📅 ${new Date(o.created_at).toLocaleDateString('en-IN')} &nbsp;·&nbsp;
          💳 ${o.payment_method} &nbsp;·&nbsp;
          📍 ${o.city}, ${o.state} - ${o.pin}
        </div>
        <div style="display:flex;flex-direction:column;gap:.3rem;">
          ${(o.items||[]).map(i => `
            <div style="display:flex;align-items:center;gap:.8rem;background:var(--warm);padding:.5rem .8rem;border-radius:8px;">
              <img src="${i.image_url||''}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;"/>
              <span style="flex:1;font-size:.83rem;font-weight:600;">${i.product_name} (${i.grade})</span>
              <span style="font-size:.8rem;color:var(--muted);">${i.qty}kg · ₹${(i.price*i.qty).toLocaleString()}</span>
            </div>`).join('')}
        </div>
        <div style="text-align:right;margin-top:.6rem;font-family:'Playfair Display',serif;font-weight:700;color:var(--forest-mid);">Total: ₹${parseFloat(o.total).toLocaleString()}</div>
      </div>`).join('');
  } catch (e) { showToast('Failed to load orders: ' + e.message, 'error'); }
}

function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span> ${msg}`;
  c.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
}
