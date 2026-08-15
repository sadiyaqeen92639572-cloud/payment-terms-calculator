const fs = require('fs');
const DOMAIN = 'https://paymenttermscalculator.com';

const paths = [
  '/', '/net-60-calculator/', '/invoice-due-date-calculator/',
  '/days-sales-outstanding-calculator/', '/net-30-payment-terms-explained/',
  '/about/', '/privacy/', '/changelog/'
];

const today = new Date().toISOString().slice(0, 10);
const existing = paths.filter(p => fs.existsSync('.' + p + 'index.html'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${existing.map(p => `  <url><loc>${DOMAIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync('sitemap.xml', xml);
console.log(`sitemap.xml written with ${existing.length} URLs`);
