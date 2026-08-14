// ─── Date helpers (UTC-based to avoid timezone drift) ──────────────────────

function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function endOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

// mode: 'calendar' | 'business'. Business = weekends excluded only.
// Federal holidays are NOT excluded (deliberate — see /net-30-payment-terms-explained/
// for why: avoids a maintained yearly holiday-calendar dataset).
function addDays(date, days, mode) {
  const result = new Date(date.getTime());
  if (mode === 'calendar') {
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (!isWeekend(result)) remaining--;
  }
  return result;
}

// basis: 'invoice' | 'delivery' | 'eom'
function getStartDate({ basis, invoiceDate, deliveryDate }) {
  if (basis === 'delivery') return parseISO(deliveryDate || invoiceDate);
  if (basis === 'eom') return endOfMonth(parseISO(invoiceDate));
  return parseISO(invoiceDate);
}

function computeDueDate({ basis, invoiceDate, deliveryDate, termDays, dayMode }) {
  const start = getStartDate({ basis, invoiceDate, deliveryDate });
  const due = addDays(start, termDays, dayMode);
  const today = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  const daysRemaining = Math.round((due - today) / 86400000);
  return { startDate: toISO(start), dueDate: toISO(due), daysRemaining };
}

function computeDiscount({ basis, invoiceDate, deliveryDate, discountDays, discountPct, invoiceAmount }) {
  const start = getStartDate({ basis, invoiceDate, deliveryDate });
  const deadline = addDays(start, discountDays, 'calendar');
  const savings = (invoiceAmount || 0) * (discountPct / 100);
  return { deadline: toISO(deadline), savings, amountDue: (invoiceAmount || 0) - savings };
}

// DSO = (accounts receivable / total credit sales) × days in period
function computeDSO({ accountsReceivable, creditSales, periodDays }) {
  if (!creditSales) return null;
  return (accountsReceivable / creditSales) * periodDays;
}

if (typeof module !== 'undefined') {
  module.exports = { parseISO, toISO, endOfMonth, isWeekend, addDays, getStartDate, computeDueDate, computeDiscount, computeDSO };
}

// ─── UI wiring (due-date + discount calculator) ────────────────────────────
// Call with a preset term (in days) for landing pages like /net-60-calculator/;
// omit for the homepage, which exposes the full preset toggle group.

let termDays = 30;
let dayMode = 'calendar';
let discountOn = false;

function fmtDate(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function setTerm(btn, days) {
  termDays = days;
  document.querySelectorAll('#term-toggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const customInput = document.getElementById('customDays');
  if (customInput) customInput.parentElement.classList.toggle('visible', days === 'custom');
  if (days !== 'custom') calcDueDate();
}

function setDayMode(btn, mode) {
  dayMode = mode;
  document.querySelectorAll('#daymode-toggle button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  calcDueDate();
}

function toggleBasisInputs() {
  const basis = document.getElementById('basis').value;
  const deliveryRow = document.getElementById('deliveryRow');
  if (deliveryRow) deliveryRow.style.display = basis === 'delivery' ? 'flex' : 'none';
}

function toggleDiscountSection() {
  discountOn = document.getElementById('discountEnable').checked;
  document.getElementById('discountFields').style.display = discountOn ? 'grid' : 'none';
  calcDueDate();
}

function calcDueDate() {
  const invoiceDate = document.getElementById('invoiceDate').value;
  if (!invoiceDate) return;
  const basis = document.getElementById('basis').value;
  const deliveryDate = document.getElementById('deliveryDate') ? document.getElementById('deliveryDate').value : null;
  const customInput = document.getElementById('customDays');
  const days = termDays === 'custom' ? (parseInt(customInput.value) || 0) : termDays;

  const result = computeDueDate({ basis, invoiceDate, deliveryDate, termDays: days, dayMode });

  document.getElementById('r-due').textContent = fmtDate(result.dueDate);
  document.getElementById('r-start').textContent = fmtDate(result.startDate);
  document.getElementById('r-remaining').textContent = result.daysRemaining >= 0
    ? `${result.daysRemaining} days from today`
    : `${Math.abs(result.daysRemaining)} days overdue`;

  const discountRow = document.getElementById('discount-result-row');
  if (discountOn && discountRow) {
    const discountDays = parseInt(document.getElementById('discountDays').value) || 10;
    const discountPct = parseFloat(document.getElementById('discountPct').value) || 2;
    const invoiceAmount = parseFloat(document.getElementById('invoiceAmount').value) || 0;
    const disc = computeDiscount({ basis, invoiceDate, deliveryDate, discountDays, discountPct, invoiceAmount });
    document.getElementById('r-discount-deadline').textContent = fmtDate(disc.deadline);
    document.getElementById('r-discount-savings').textContent = '$' + disc.savings.toFixed(2);
    document.getElementById('r-discount-amount-due').textContent = '$' + disc.amountDue.toFixed(2);
    discountRow.style.display = 'block';
  } else if (discountRow) {
    discountRow.style.display = 'none';
  }

  document.getElementById('results').style.display = 'block';
}

// ─── DSO calculator UI ──────────────────────────────────────────────────────

function calcDSO() {
  const ar = parseFloat(document.getElementById('dsoAR').value) || 0;
  const sales = parseFloat(document.getElementById('dsoSales').value) || 0;
  const period = parseInt(document.getElementById('dsoPeriod').value) || 365;
  const dso = computeDSO({ accountsReceivable: ar, creditSales: sales, periodDays: period });
  document.getElementById('r-dso').textContent = dso === null ? '—' : dso.toFixed(1) + ' days';
  document.getElementById('dso-results').style.display = 'block';
}
