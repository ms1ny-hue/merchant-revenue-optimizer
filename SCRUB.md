# SCRUB — Publish prep

**Scope:** Scrub and publish prep only. All code work must be complete before this file is opened.

**Title tag and meta.** Update `<title>` on line 6 and `<meta name="description">` on line 7 to match final product name.

**Open Graph tags.** Add to `<head>`:
```html
<meta property="og:title" content="[final product name]">
<meta property="og:description" content="[one-sentence summary]">
<meta property="og:type" content="website">
<meta property="og:url" content="https://[your-netlify-url]">
<meta property="og:image" content="https://[your-netlify-url]/og-image.png">
<meta name="twitter:card" content="summary_large_image">
```
Create a 1200×630 OG image. Screenshot Tab 2 with the header visible.

**Mobile Lighthouse.** Run Lighthouse in Chrome DevTools on mobile emulation. Fix any score below 85 on Performance, Accessibility, Best Practices.

**Print-to-PDF Tab 7.** Open Tab 7 in Chrome. Cmd+P. Check page breaks, fonts, header and footer. Adjust `@media print` CSS block (starts line 208) if anything breaks.

**Disclosure visibility.** Footer disclosure (line 318) visible on every tab. Add a "Prototype. Not a real financial product" chip to the top header strip.

**Author attribution.** Keep "Created by Michael Stanat" in footer.

**Employer scrub.** Search `index.html` for "Selective", "SIS", "NYU", "Stern". Remove all.

**Consumer transaction leak check.** Re-verify after all previous sessions. Search rendered UI for "Uber", "McDonald's", "Starbucks", "KFC", "FUN", "United Airlines", "Alberta", "Charleson", "Platypus". None should appear.

**GitHub repo.** Confirm public, README current, link in site footer.

**Distribution.** Private email to Kieran Mehta first. Subject: "Payments prototype." Body: "Kieran, built this over a few weekends. A relationship-economics view of merchant acquiring for a mid-market 3PL. Live Plaid integration on Netlify Functions. Thought your team might find the framing interesting. [URL]. No ask, just sharing. Michael." Do not copy Cassio. Do not mention JPM.

Wait 7 days. Then LinkedIn post, link in comments, no JPM reference.
