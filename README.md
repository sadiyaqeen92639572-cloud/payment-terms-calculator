# Net 30 Calculator

Free invoice due-date and early-payment-discount calculator with a start-date basis
selector (invoice date / delivery date / end-of-month) and calendar-vs-business-days
toggle — the ambiguity ("30 days from what?") that thin competitor calculators don't
address.

**Domain (provisional, not yet purchased/verified):** net30calculator.com

## Pages

- `/` — Net 30 calculator (default term, full basis/day-mode/discount UI)
- `/net-60-calculator/` — Net 60 landing page
- `/invoice-due-date-calculator/` — generic any-term landing page
- `/days-sales-outstanding-calculator/` — DSO calculator (separate formula, AR/finance audience)
- `/net-30-payment-terms-explained/` — informational hub (what is net 30 / net 30 terms cluster)
- `/about/`, `/privacy/`, `/changelog/`

## Build

```
node generate-pages.js     # regenerates all inner pages (not index.html — hand-written)
node generate-sitemap.js   # regenerates sitemap.xml
```

## Deploy (once domain purchased)

```
npx wrangler pages deploy . --project-name net30-calculator --commit-dirty=true
```

## Monetization

Day-1: plain outbound links to FreshBooks/Melio/Bill.com (no tracking). Apply to
FreshBooks/ShareASale first (most accessible for a new domain); Bill.com/Melio ($200-250
CPA) likely need reapplication once real traffic exists. Add FTC affiliate disclosure on
any page carrying a tracked link once approved — see `/about/`.

## Still open

- Domain purchase (candidates: net30calculator.com, paymenttermscalculator.com,
  invoicetermscalculator.com, duedatecalc.com) — needs explicit confirmation before buying.
- GSC tag — add once domain verified (`GSC_TAG` const in `generate-pages.js`, plus
  `index.html`'s commented-out meta tag).
- Affiliate applications (FreshBooks first, Bill.com/Melio after traffic).
