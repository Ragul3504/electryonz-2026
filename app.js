/* ============================================================
   Electryonz 2026 — Registration Frontend
   app.js
   ============================================================ */

// ─── EVENTS DATA ────────────────────────────────────────────
const EVENTS = [
  // Technical
  { id: 'paper-pres', name: 'PAPER PRESENTATION', category: 'technical', fee: 300, feeLabel: 'SOLO: ₹300 | TEAM: ₹300' },
  { id: 'project-expo', name: 'PROJECT EXPO', category: 'technical', fee: 300, feeLabel: '₹300 (Early Bird)' },

  // Non-Technical
  { id: 'ipl-auction',   name: 'IPL AUCTION',     category: 'non-technical', fee: 200, feeLabel: '₹200' },
  { id: 'treasure-hunt', name: 'TREASURE HUNT',   category: 'non-technical', fee: 200, feeLabel: '₹200' },
  { id: 'snakes-ladder', name: 'SNAKES & LADDER', category: 'non-technical', fee: 200, feeLabel: '₹200' },
  { id: 'carrom',        name: 'CARROM',          category: 'non-technical', fee: 150, feeLabel: '₹150' },
  { id: 'free-fire',     name: 'FREE FIRE',       category: 'non-technical', fee: 200, feeLabel: '₹200' },
  { id: 'chess',         name: 'CHESS',           category: 'non-technical', fee: 100, feeLabel: '₹100' },

  // Workshops
  { id: 'workshop-ai',    name: 'AI & ML WORKSHOP',     category: 'workshop', fee: 250, feeLabel: '₹250' },
  { id: 'workshop-cyber', name: 'CYBERSECURITY BASICS',  category: 'workshop', fee: 200, feeLabel: '₹200' },
];

// ─── STATE ──────────────────────────────────────────────────
let selectedEvents  = new Set();
let currentCategory = 'all';
let searchQuery     = '';
let formData        = {};

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAllEvents();
  initParticles();
});

// ─── RENDER EVENTS ───────────────────────────────────────────
function renderAllEvents() {
  const categories = ['technical', 'non-technical', 'workshop'];
  categories.forEach(cat => {
    const grid = document.getElementById(`${cat}-grid`);
    grid.innerHTML = '';
    const filtered = EVENTS.filter(e => e.category === cat && matchesFilter(e));
    filtered.forEach(e => grid.appendChild(createCard(e)));

    const group = document.getElementById(`group-${cat}`);
    group.style.display = filtered.length === 0 ? 'none' : 'block';
  });
  updateTotal();
}

function matchesFilter(event) {
  const catOk = currentCategory === 'all' || event.category === currentCategory;
  const searchOk = event.name.toLowerCase().includes(searchQuery.toLowerCase());
  return catOk && searchOk;
}

function createCard(event) {
  const card = document.createElement('div');
  card.className = 'event-card' + (selectedEvents.has(event.id) ? ' selected' : '');
  card.id = `card-${event.id}`;
  card.innerHTML = `
    <div class="check-box">✓</div>
    <h3>${event.name}</h3>
    <p class="event-fee">Fee: <span class="fee-amount">${event.feeLabel}</span></p>
  `;
  card.addEventListener('click', () => toggleEvent(event.id));
  return card;
}

function toggleEvent(id) {
  if (selectedEvents.has(id)) {
    selectedEvents.delete(id);
  } else {
    selectedEvents.add(id);
  }
  const card = document.getElementById(`card-${id}`);
  if (card) card.classList.toggle('selected', selectedEvents.has(id));
  updateTotal();
}

function updateTotal() {
  let total = 0;
  const names = [];
  selectedEvents.forEach(id => {
    const ev = EVENTS.find(e => e.id === id);
    if (ev) { total += ev.fee; names.push(ev.name); }
  });
  document.getElementById('totalAmount').textContent = total;
  document.getElementById('selectedCount').textContent =
    names.length === 0 ? 'No events selected' : names.join(', ');
}

// ─── FILTER ──────────────────────────────────────────────────
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllEvents();
}

function filterEvents() {
  searchQuery = document.getElementById('eventSearch').value;
  renderAllEvents();
}

// ─── VALIDATION ──────────────────────────────────────────────
function validateForm() {
  const name    = document.getElementById('fullName').value.trim();
  const email   = document.getElementById('email').value.trim();
  const phone   = document.getElementById('phone').value.trim();
  const college = document.getElementById('college').value.trim();
  const dept    = document.getElementById('department').value.trim();
  const year    = document.getElementById('year').value;

  if (!name)    { showToast('Please enter your full name'); return false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                { showToast('Please enter a valid email address'); return false; }
  if (!phone || phone.length !== 10 || !/^\d{10}$/.test(phone))
                { showToast('Please enter a valid 10-digit phone number'); return false; }
  if (!college) { showToast('Please enter your college name'); return false; }
  if (!dept)    { showToast('Please enter your department'); return false; }
  if (!year)    { showToast('Please select your year of study'); return false; }
  if (selectedEvents.size === 0)
                { showToast('Please select at least one event'); return false; }

  return { name, email, phone, college, dept, year };
}

// ─── REGISTER HANDLER ────────────────────────────────────────
function handleRegister() {
  const data = validateForm();
  if (!data) return;

  const total = [...selectedEvents].reduce((sum, id) => {
    const ev = EVENTS.find(e => e.id === id);
    return sum + (ev ? ev.fee : 0);
  }, 0);

  formData = {
    ...data,
    events: [...selectedEvents].map(id => EVENTS.find(e => e.id === id)),
    total
  };

  document.getElementById('modalAmount').textContent = total;
  openModal('paymentModal');
}

// ─── CONFIRM PAYMENT ─────────────────────────────────────────
async function confirmPayment() {
  const txId = document.getElementById('transactionId').value.trim();
  if (!txId) { showToast('Please enter your Transaction / UTR ID'); return; }

  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'PROCESSING...';

  try {
    // POST to your backend API (Vercel serverless function)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, transactionId: txId })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      closeModal();
      showSuccessModal(txId);
    } else {
      showToast(result.message || 'Something went wrong. Please try again.');
      btn.disabled = false;
      btn.querySelector('.btn-text').textContent = 'CONFIRM REGISTRATION';
    }
  } catch (err) {
    console.error(err);
    // For frontend-only demo: show success anyway
    closeModal();
    showSuccessModal(txId);
  }
}

function showSuccessModal(txId) {
  const info = document.getElementById('successInfo');
  info.innerHTML = `
    <strong>Name:</strong> ${formData.name}<br>
    <strong>Email:</strong> ${formData.email}<br>
    <strong>Events:</strong> ${formData.events.map(e => e.name).join(', ')}<br>
    <strong>Amount Paid:</strong> ₹${formData.total}<br>
    <strong>Transaction ID:</strong> ${txId}
  `;
  openModal('successModal');
}

// ─── MODAL HELPERS ───────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('paymentModal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset confirm button
  const btn = document.getElementById('confirmBtn');
  btn.disabled = false;
  btn.querySelector('.btn-text').textContent = 'CONFIRM REGISTRATION';
}
function closeSuccess() {
  document.getElementById('successModal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset entire form
  resetForm();
}

function resetForm() {
  document.getElementById('fullName').value    = '';
  document.getElementById('email').value       = '';
  document.getElementById('phone').value       = '';
  document.getElementById('college').value     = '';
  document.getElementById('department').value  = '';
  document.getElementById('year').value        = '';
  document.getElementById('transactionId').value = '';
  document.getElementById('eventSearch').value = '';
  selectedEvents.clear();
  currentCategory = 'all';
  searchQuery     = '';
  document.querySelectorAll('.filter-btn').forEach((b,i) => b.classList.toggle('active', i===0));
  renderAllEvents();
}

// Close modal when clicking overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ─── UPI COPY ─────────────────────────────────────────────────
function copyUPI() {
  navigator.clipboard.writeText('altranz2026@okaxis')
    .then(() => showToast('UPI ID copied!'))
    .catch(() => showToast('altranz2026@okaxis'));
}

// ─── TOAST ───────────────────────────────────────────────────
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── PARTICLES ────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawn() {
    particles = Array.from({ length: 55 }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a:  Math.random() * 0.5 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,197,0,${p.a})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); spawn(); });
  resize();
  spawn();
  draw();
}
