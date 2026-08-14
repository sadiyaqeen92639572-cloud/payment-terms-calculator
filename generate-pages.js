const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://net30calculator.com';
const LAST_REVIEWED = '2026-08-14';
// TODO: fill in once domain purchased + GSC property verified
const GSC_TAG = '';

const ORG = {
  '@type': 'Organization',
  name: 'Gesmine-Invest Limited',
  legalName: 'Gesmine-Invest Limited',
  url: DOMAIN,
  identifier: { '@type': 'PropertyValue', propertyID: 'UK Company Number', value: '14120136' },
  address: { '@type': 'PostalAddress', streetAddress: 'Hardy House, 269 Poynders Gardens', addressLocality: 'London', postalCode: 'SW4 8PQ', addressCountry: 'GB' }
};

function webApp(fields) {
  return Object.assign({
    '@type': 'WebApplication',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    dateModified: LAST_REVIEWED,
    author: ORG,
    publisher: ORG,
    version: '2026-08-v1'
  }, fields);
}

function faqJsonLd(items) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

function breadcrumb(pageName, pagePath) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${DOMAIN}/` },
      { '@type': 'ListItem', position: 2, name: pageName, item: `${DOMAIN}${pagePath}` }
    ]
  };
}

function layout({ title, description, canonicalPath, h1, subtitle, jsonLd, bodyHtml }) {
  const gscTag = GSC_TAG ? `<meta name="google-site-verification" content="${GSC_TAG}" />\n` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${DOMAIN}${canonicalPath}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${DOMAIN}${canonicalPath}">
<meta name="twitter:card" content="summary_large_image">
${gscTag}<link rel="stylesheet" href="/assets/styles.css">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header>
  <a href="/">Net 30 Calculator</a>
  <h1>${h1}</h1>
  <p>${subtitle}</p>
  <p class="reviewed-badge">Last reviewed ${LAST_REVIEWED}</p>
</header>
<nav class="crumbs"><a href="/">Home</a> / ${h1}</nav>
<main>
${bodyHtml}
</main>
<footer>
<p>Net30Calculator.com is published by Gesmine-Invest Limited, registered UK company number 14120136, registered office at Hardy House, 269 Poynders Gardens, London, United Kingdom, SW4 8PQ.</p>
<p><a href="/about/">About</a> · <a href="/privacy/">Privacy</a> · <a href="/changelog/">Changelog</a> · &copy; 2026 Net30Calculator. Estimates only — not legal or financial advice.</p>
</footer>
<script src="/assets/calc-engine.js"></script>
</body>
</html>
`;
}

function write(dir, html) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log('wrote', dir);
}

// ---- net-60-calculator ----
{
  const body = `
<section>
  <form onsubmit="event.preventDefault(); calcDueDate();">
    <label>Invoice date<input type="date" id="invoiceDate" onchange="calcDueDate()"></label>
    <label>Start date basis
      <select id="basis" onchange="toggleBasisInputs(); calcDueDate();">
        <option value="invoice">Invoice date</option>
        <option value="delivery">Delivery date</option>
        <option value="eom">End of invoice month (EOM)</option>
      </select>
    </label>
    <label id="deliveryRow" style="display:none;">Delivery date<input type="date" id="deliveryDate" onchange="calcDueDate()"></label>
    <label>Payment term
      <div class="toggle-group" id="term-toggle">
        <button type="button" onclick="setTerm(this,15)">Net 15</button>
        <button type="button" onclick="setTerm(this,30)">Net 30</button>
        <button type="button" onclick="setTerm(this,45)">Net 45</button>
        <button type="button" class="active" onclick="setTerm(this,60)">Net 60</button>
        <button type="button" onclick="setTerm(this,90)">Net 90</button>
        <button type="button" onclick="setTerm(this,'custom')">Custom</button>
      </div>
    </label>
    <label class="concession-input" style="display:flex;"><span>Custom days</span><input type="number" id="customDays" min="1" value="60" onchange="calcDueDate()"></label>
    <label>Day count
      <div class="toggle-group" id="daymode-toggle">
        <button type="button" class="active" onclick="setDayMode(this,'calendar')">Calendar days</button>
        <button type="button" onclick="setDayMode(this,'business')">Business days</button>
      </div>
    </label>
    <p class="basis-note">Business days = weekends excluded. Federal holidays are <strong>not</strong> excluded.</p>
    <button type="submit" class="submit-btn">Calculate Due Date</button>
  </form>
  <div id="results" style="display:none;margin-top:20px;padding:20px;background:var(--brand-light);border-radius:var(--radius);">
    <div class="result-amount" id="r-due"></div>
    <div class="result-row"><span>Start date used</span><span id="r-start"></span></div>
    <div class="result-row"><span>Days remaining</span><span id="r-remaining"></span></div>
    <div id="discount-result-row" style="display:none;"></div>
  </div>
</section>
<section>
  <h2>What Is Net 60?</h2>
  <p>Net 60 means payment is due 60 days after the start date on the invoice — the same start-date ambiguity applies as Net 30: invoice date, delivery date, or end of the invoice month (EOM 60) can all be the agreed clock start. Net 60 terms are common for larger B2B contracts and enterprise vendor agreements where the buyer negotiates extended payment windows.</p>
  <h2>Net 60 vs Net 30</h2>
  <p>Net 60 gives the buyer twice the payment window of Net 30, which improves the buyer's cash flow at the cost of the seller's. Sellers sometimes offer an early payment discount (e.g. 2/10 Net 60) to encourage faster payment — use the <a href="/">main Net 30 calculator</a> to model discount scenarios.</p>
</section>
<section>
  <h2>Related Calculators</h2>
  <ul class="tool-links">
    <li><a href="/">Net 30 Calculator</a></li>
    <li><a href="/invoice-due-date-calculator/">Invoice Due Date Calculator</a></li>
    <li><a href="/days-sales-outstanding-calculator/">DSO Calculator</a></li>
    <li><a href="/net-30-payment-terms-explained/">What is Net 30? (Full Guide)</a></li>
  </ul>
</section>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      webApp({ name: 'Net 60 Calculator', description: 'Free calculator for Net 60 invoice due dates with a start-date basis selector (invoice, delivery, or end of month) and calendar/business-day modes.' }),
      faqJsonLd([
        ['What does Net 60 mean?', 'Payment is due 60 days after the start date on the invoice — invoice date, delivery date, or end of month, depending on the agreed terms.'],
        ['How is a Net 60 due date calculated?', 'Due date = start date + 60 days. Enter your invoice date and start-date basis above for the exact due date.']
      ]),
      breadcrumb('Net 60 Calculator', '/net-60-calculator/')
    ]
  };
  write('net-60-calculator', layout({
    title: 'Net 60 Calculator — Invoice Due Date (2026)',
    description: 'Free Net 60 due date calculator with a start-date selector (invoice, delivery, or end of month) and business-days option.',
    canonicalPath: '/net-60-calculator/',
    h1: 'Net 60 Calculator',
    subtitle: 'Calculate your Net 60 invoice due date — invoice, delivery, or end-of-month basis',
    jsonLd, bodyHtml: body
  }));
}

// ---- invoice-due-date-calculator ----
{
  const body = `
<section>
  <form onsubmit="event.preventDefault(); calcDueDate();">
    <label>Invoice date<input type="date" id="invoiceDate" onchange="calcDueDate()"></label>
    <label>Start date basis
      <select id="basis" onchange="toggleBasisInputs(); calcDueDate();">
        <option value="invoice">Invoice date</option>
        <option value="delivery">Delivery date</option>
        <option value="eom">End of invoice month (EOM)</option>
      </select>
    </label>
    <label id="deliveryRow" style="display:none;">Delivery date<input type="date" id="deliveryDate" onchange="calcDueDate()"></label>
    <label>Payment term
      <div class="toggle-group" id="term-toggle">
        <button type="button" onclick="setTerm(this,15)">Net 15</button>
        <button type="button" class="active" onclick="setTerm(this,30)">Net 30</button>
        <button type="button" onclick="setTerm(this,45)">Net 45</button>
        <button type="button" onclick="setTerm(this,60)">Net 60</button>
        <button type="button" onclick="setTerm(this,90)">Net 90</button>
        <button type="button" onclick="setTerm(this,'custom')">Custom</button>
      </div>
    </label>
    <label class="concession-input" style="display:flex;"><span>Custom days</span><input type="number" id="customDays" min="1" value="30" onchange="calcDueDate()"></label>
    <label>Day count
      <div class="toggle-group" id="daymode-toggle">
        <button type="button" class="active" onclick="setDayMode(this,'calendar')">Calendar days</button>
        <button type="button" onclick="setDayMode(this,'business')">Business days</button>
      </div>
    </label>
    <p class="basis-note">Business days = weekends excluded. Federal holidays are <strong>not</strong> excluded.</p>
    <button type="submit" class="submit-btn">Calculate Due Date</button>
  </form>
  <div id="results" style="display:none;margin-top:20px;padding:20px;background:var(--brand-light);border-radius:var(--radius);">
    <div class="result-amount" id="r-due"></div>
    <div class="result-row"><span>Start date used</span><span id="r-start"></span></div>
    <div class="result-row"><span>Days remaining</span><span id="r-remaining"></span></div>
    <div id="discount-result-row" style="display:none;"></div>
  </div>
</section>
<section>
  <h2>Why the Start Date Matters</h2>
  <p>The most common source of invoice due-date disputes isn't the term length — it's which date the term counts from. "30 days" from the invoice date, from the delivery/completion date, and from the end of the invoice month (EOM 30) can produce due dates weeks apart for the same invoice. Always confirm the start-date basis in your contract or purchase order before assuming.</p>
</section>
<section>
  <h2>Related Calculators</h2>
  <ul class="tool-links">
    <li><a href="/">Net 30 Calculator</a></li>
    <li><a href="/net-60-calculator/">Net 60 Calculator</a></li>
    <li><a href="/days-sales-outstanding-calculator/">DSO Calculator</a></li>
    <li><a href="/net-30-payment-terms-explained/">What is Net 30? (Full Guide)</a></li>
  </ul>
</section>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      webApp({ name: 'Invoice Due Date Calculator', description: 'Free calculator for invoice due dates from any payment term, with a start-date basis selector (invoice, delivery, or end of month) and calendar/business-day modes.' }),
      faqJsonLd([
        ['How do I calculate an invoice due date?', 'Due date = start date + payment term days. Choose your start-date basis (invoice, delivery, or end of month) and term length above.'],
        ['What if my invoice does not state a start-date basis?', 'Default to the invoice date unless your contract or PO specifies delivery date or end-of-month terms.']
      ]),
      breadcrumb('Invoice Due Date Calculator', '/invoice-due-date-calculator/')
    ]
  };
  write('invoice-due-date-calculator', layout({
    title: 'Invoice Due Date Calculator — Any Payment Term (2026)',
    description: 'Free invoice due date calculator for any payment term (Net 15/30/45/60/90), with invoice/delivery/EOM start-date basis and business-days option.',
    canonicalPath: '/invoice-due-date-calculator/',
    h1: 'Invoice Due Date Calculator',
    subtitle: 'Calculate any invoice due date — pick your start-date basis and term',
    jsonLd, bodyHtml: body
  }));
}

// ---- days-sales-outstanding-calculator ----
{
  const body = `
<section>
  <form onsubmit="event.preventDefault(); calcDSO();">
    <label>Accounts receivable ($)<input type="number" id="dsoAR" placeholder="e.g. 50000" onchange="calcDSO()"></label>
    <label>Total credit sales for period ($)<input type="number" id="dsoSales" placeholder="e.g. 600000" onchange="calcDSO()"></label>
    <label>Period (days)<input type="number" id="dsoPeriod" value="365" onchange="calcDSO()"></label>
    <button type="submit" class="submit-btn">Calculate DSO</button>
  </form>
  <div id="dso-results" style="display:none;margin-top:20px;padding:20px;background:var(--brand-light);border-radius:var(--radius);">
    <div class="result-amount" id="r-dso"></div>
    <p class="privacy-note">Days Sales Outstanding — average number of days it takes to collect payment after a sale.</p>
  </div>
</section>
<section class="formula-section">
  <h2>DSO Formula</h2>
  <div class="formula-code">DSO = (accounts receivable ÷ total credit sales) × days in period</div>
  <p class="formula-footnote">A lower DSO means faster collections. Compare your DSO against your own stated payment terms (e.g. Net 30) — a DSO significantly higher than your terms signals collection problems, not just slow-paying customers.</p>
</section>
<section>
  <h2>What Counts as a Good DSO?</h2>
  <p>There's no universal "good" DSO — it depends on your industry and your own payment terms. As a rule of thumb, a DSO within 10-15 days of your standard term (e.g. 40-45 for Net 30 terms) is typical; a DSO well beyond that suggests either lenient enforcement or real collection issues worth investigating.</p>
</section>
<section>
  <h2>Related Calculators</h2>
  <ul class="tool-links">
    <li><a href="/">Net 30 Calculator</a></li>
    <li><a href="/net-60-calculator/">Net 60 Calculator</a></li>
    <li><a href="/invoice-due-date-calculator/">Invoice Due Date Calculator</a></li>
    <li><a href="/net-30-payment-terms-explained/">What is Net 30? (Full Guide)</a></li>
  </ul>
</section>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      webApp({ name: 'Days Sales Outstanding (DSO) Calculator', description: 'Free DSO calculator: (accounts receivable / total credit sales) x days in period.' }),
      faqJsonLd([
        ['What is DSO?', 'Days Sales Outstanding measures the average number of days it takes a company to collect payment after a sale, calculated as (accounts receivable / total credit sales) × days in period.'],
        ['How is DSO calculated?', 'DSO = (accounts receivable ÷ total credit sales) × number of days in the period being measured.']
      ]),
      breadcrumb('DSO Calculator', '/days-sales-outstanding-calculator/')
    ]
  };
  write('days-sales-outstanding-calculator', layout({
    title: 'Days Sales Outstanding (DSO) Calculator (2026)',
    description: 'Free DSO calculator — measure how long it takes your business to collect payment after a sale. Formula: (AR / credit sales) x days.',
    canonicalPath: '/days-sales-outstanding-calculator/',
    h1: 'Days Sales Outstanding (DSO) Calculator',
    subtitle: 'Measure your average collection period from accounts receivable and credit sales',
    jsonLd, bodyHtml: body
  }));
}

// ---- net-30-payment-terms-explained ----
{
  const body = `
<section>
  <h2>What Is Net 30?</h2>
  <p>Net 30 is a payment term meaning the full invoice amount is due 30 days after a start date — most commonly the invoice date, though delivery date and end-of-month (EOM 30) are also used depending on the vendor agreement. It's one of the most common B2B payment terms, giving buyers a short-term interest-free window to pay after receiving goods or services.</p>
</section>
<section>
  <h2>What Does Net 30 Mean in Practice?</h2>
  <p>"Net" refers to the full (net) amount owed with no discount applied, as opposed to terms like 2/10 Net 30 where an early-payment discount is available. "30" is the number of days until the full amount is due. So Net 30 simply means: pay the full invoice amount within 30 days of the agreed start date.</p>
</section>
<section>
  <h2>Net 30 Payment Terms — What Sellers and Buyers Should Know</h2>
  <p>For sellers, Net 30 terms extend credit to the buyer — the seller is effectively financing the purchase for up to 30 days. For buyers, Net 30 improves cash flow by delaying payment. Many businesses negotiate shorter (Net 15) or longer (Net 60, Net 90) terms depending on bargaining power, industry norms, and the buyer's credit history.</p>
</section>
<section>
  <h2>The Real Ambiguity: 30 Days From What?</h2>
  <p>The single biggest source of confusion in Net 30 terms isn't the "30" — it's the start date. In practice, three conventions exist:</p>
  <table>
    <tr><th>Basis</th><th>Start date</th></tr>
    <tr><td>Invoice date</td><td>Day the invoice is issued (most common default)</td></tr>
    <tr><td>Delivery date</td><td>Day goods are delivered or services completed</td></tr>
    <tr><td>End of month (EOM 30)</td><td>Last calendar day of the invoice's month</td></tr>
  </table>
  <p>Use our <a href="/">Net 30 calculator</a> to compute the exact due date under any of these three conventions, in calendar or business days.</p>
</section>
<section>
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item"><h3>What does Net 30 mean?</h3><p>Full payment due 30 days after the agreed start date on the invoice.</p></div>
  <div class="faq-item"><h3>What is net 30 payment terms?</h3><p>A common B2B credit arrangement where the buyer has 30 days to pay the full invoice amount with no discount.</p></div>
  <div class="faq-item"><h3>What does 30 net terms mean?</h3><p>Same as Net 30 — the full amount is due within 30 days of the invoice/delivery/EOM start date.</p></div>
  <div class="faq-item"><h3>Is Net 30 good or bad for a small business?</h3><p>As a seller, Net 30 means financing your buyer for up to 30 days — manageable with healthy cash flow, risky if you depend on fast payment. As a buyer, Net 30 improves your own cash flow.</p></div>
</section>
<section>
  <h2>More Net Terms Calculators</h2>
  <ul class="tool-links">
    <li><a href="/">Net 30 Calculator</a></li>
    <li><a href="/net-60-calculator/">Net 60 Calculator</a></li>
    <li><a href="/invoice-due-date-calculator/">Invoice Due Date Calculator</a></li>
    <li><a href="/days-sales-outstanding-calculator/">DSO Calculator</a></li>
  </ul>
</section>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'What Is Net 30? Payment Terms Explained',
        dateModified: LAST_REVIEWED,
        author: ORG,
        publisher: ORG
      },
      faqJsonLd([
        ['What does Net 30 mean?', 'Full payment due 30 days after the agreed start date on the invoice.'],
        ['What is net 30 payment terms?', 'A common B2B credit arrangement where the buyer has 30 days to pay the full invoice amount with no discount.'],
        ['What does 30 net terms mean?', 'Same as Net 30 — the full amount is due within 30 days of the invoice, delivery, or end-of-month start date.'],
        ['Is Net 30 good or bad for a small business?', 'As a seller, Net 30 means financing your buyer for up to 30 days. As a buyer, it improves your own cash flow.']
      ]),
      breadcrumb('What Is Net 30?', '/net-30-payment-terms-explained/')
    ]
  };
  write('net-30-payment-terms-explained', layout({
    title: 'What Is Net 30? Payment Terms Explained (2026)',
    description: 'Net 30 payment terms explained: what it means, how the start date works (invoice, delivery, or EOM), and how it compares to other net terms.',
    canonicalPath: '/net-30-payment-terms-explained/',
    h1: 'What Is Net 30? Payment Terms Explained',
    subtitle: 'Full guide to Net 30 payment terms and the start-date ambiguity that trips most calculators up',
    jsonLd, bodyHtml: body
  }));
}

// ---- about ----
{
  const body = `
<section>
  <h2>About Net30Calculator.com</h2>
  <p>Net30Calculator.com is a free tool for calculating invoice due dates and early payment discounts under Net 30 and related payment terms (Net 15/45/60/90). It's published by Gesmine-Invest Limited, a UK-registered company (company number 14120136, registered office Hardy House, 269 Poynders Gardens, London, SW4 8PQ).</p>
</section>
<section>
  <h2>Sourcing Methodology</h2>
  <p>All calculations on this site are deterministic date and financial arithmetic — invoice due date = start date + term days; early payment discount = invoice amount × discount percentage; DSO = (accounts receivable ÷ credit sales) × period days. These are standard, publicly documented formulas, not estimates or survey-derived figures, so there is no sourcing-honesty tradeoff to manage: the numbers are exact given the inputs provided.</p>
  <p>The one deliberate simplification: business-day mode excludes weekends only, not federal holidays. We chose this to avoid depending on a yearly-maintained holiday calendar, which would need annual updates to stay accurate. Always confirm exact terms against your own contract when a due date falls near a public holiday.</p>
</section>
<section>
  <h2>Monetization Disclosure</h2>
  <p>This site may link to third-party invoicing and accounts-payable software (e.g. FreshBooks, Melio, Bill.com). Where a link is a tracked affiliate link, this is disclosed on the relevant page per FTC guidelines. As of publication, links point to vendor homepages without tracking.</p>
</section>`;
  const jsonLd = { '@context': 'https://schema.org', '@graph': [ORG] };
  write('about', layout({
    title: 'About — Net30Calculator.com',
    description: 'About Net30Calculator.com — publisher info, calculation methodology, and monetization disclosure.',
    canonicalPath: '/about/',
    h1: 'About',
    subtitle: '',
    jsonLd, bodyHtml: body
  }));
}

// ---- privacy ----
{
  const body = `
<section>
  <h2>Privacy Policy</h2>
  <p>Net30Calculator.com does not require account creation and does not store the invoice dates, amounts, or figures you enter into the calculators — all calculations run entirely in your browser (client-side JavaScript) and are never transmitted to our servers.</p>
  <p>We may use standard, privacy-respecting analytics to understand aggregate site traffic. We do not sell personal data. Outbound links to third-party invoicing software providers are subject to those providers' own privacy policies.</p>
</section>`;
  const jsonLd = { '@context': 'https://schema.org', '@graph': [ORG] };
  write('privacy', layout({
    title: 'Privacy Policy — Net30Calculator.com',
    description: 'Privacy policy for Net30Calculator.com.',
    canonicalPath: '/privacy/',
    h1: 'Privacy Policy',
    subtitle: '',
    jsonLd, bodyHtml: body
  }));
}

// ---- changelog ----
{
  const body = `
<section>
<h2>Changelog</h2>
<ul>
<li><strong>${LAST_REVIEWED}</strong> — Site launched: Net 30 calculator with invoice/delivery/EOM start-date basis selector, calendar/business-day toggle, 2/10 early payment discount calculator, Net 60 and invoice-due-date landing pages, DSO calculator, and Net 30 payment terms guide.</li>
</ul>
</section>`;
  const jsonLd = { '@context': 'https://schema.org', '@graph': [ORG] };
  write('changelog', layout({
    title: 'Changelog — Net30Calculator.com',
    description: 'What changed on Net30Calculator.com and when.',
    canonicalPath: '/changelog/',
    h1: 'Changelog',
    subtitle: '',
    jsonLd, bodyHtml: body
  }));
}

console.log('Done.');
