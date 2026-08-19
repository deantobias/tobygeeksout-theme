/*
 * print-audit.js — page-fit audit for the Toby Geeks Out! print stylesheet
 * Built 2026-08-19 against custom.css section 87 (rules 1-19).
 *
 * HOW TO RUN: open any post on tobygeeksout.micro.blog, open the browser
 * console (Cmd+Option+J), paste this whole file, hit return. ~40s for 800 posts.
 * Two tables print at the end; raw results are left on window.printAudit.
 *
 * PAGE MODEL: US Letter, 18mm top/bottom and 16mm side margins.
 * For A4, change P from 920 to 1016.
 *
 * WHAT IT MEASURES:
 *   holes   - blank space mid-document, left when a block that cannot be split
 *             does not fit in the space remaining and moves whole to the next page
 *   slivers - posts running just past a page boundary, so the last sheet is nearly empty
 *
 * THE LIMIT: holes cannot be designed away, only bounded. An image is an atomic
 * block, and CSS cannot reflow text around a page break to fill the gap. The worst
 * possible hole is roughly the height of the tallest unbreakable thing in the post.
 * Corollary: break-inside:avoid on something TALLER than the page is worse than
 * useless — the browser pushes it to a fresh page and then breaks it anyway.
 */
(async () => {
  const P = 920, W = 695;                          // Letter, less 18mm / 16mm margins
  const sm = await (await fetch('/sitemap.xml', {cache:'reload'})).text();
  const posts = (sm.match(/<loc>[^<]+<\/loc>/g)||[])
    .map(x => x.replace(/<\/?loc>/g,''))
    .filter(u => /\/\d{4}\/\d{2}\/\d{2}\//.test(u));

  const css = await (await fetch('/css/custom.css?b='+Date.now(), {cache:'reload'})).text();
  const i = css.indexOf('@media print {');
  let d = 0, j = i;
  for (; j < css.length; j++) { if (css[j]==='{') d++; else if (css[j]==='}') { d--; if (!d) break; } }
  const blk = css.slice(i, j+1);
  const printCSS = blk.slice(blk.indexOf('{')+1, -1);

  const AVOID = 'figure, blockquote:not(.reblog-v3), pre, .define-card, .link-card,'
              + ' .blog-card, .micro-card, .reblog-v3, .post-body table[role="presentation"]';

  const measure = url => new Promise(res => {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:-10000px;width:${W}px;height:${P}px;border:0`;
    const done = o => { f.remove(); res(o); };
    const t = setTimeout(() => done(null), 25000);
    f.onload = async () => {
      const dc = f.contentDocument;
      dc.head.appendChild(Object.assign(dc.createElement('style'), {textContent: printCSS}));
      await Promise.all([...dc.images].map(im => im.complete ? 0
        : new Promise(r => { im.onload = im.onerror = r; setTimeout(r, 6000); })));
      await new Promise(r => setTimeout(r, 150));
      const art = dc.querySelector('article.h-entry');
      if (!art) { clearTimeout(t); return done(null); }
      const box = art.getBoundingClientRect();
      const nodes = [...art.querySelectorAll(AVOID + ', img')]
        .filter(e => e.getBoundingClientRect().height >= 10
                  && !(e.parentElement && e.parentElement.closest(AVOID)))
        .map(e => { const r = e.getBoundingClientRect();
                    return {top: r.top - box.top, h: r.height}; })
        .sort((a,b) => a.top - b.top);
      let shift = 0, worst = 0, holes = 0;
      for (const n of nodes) {
        const off = (n.top + shift) % P;
        if (n.h <= P && off + n.h > P) {
          const gap = P - off; worst = Math.max(worst, gap); holes++; shift += gap;
        }
      }
      const total = box.height + shift, pages = Math.max(1, Math.ceil(total / P));
      clearTimeout(t);
      done({url, pages, holes, worst: Math.round(worst),
            last: Math.round(total - (pages-1)*P),
            title: dc.title.replace(' | Toby Geeks Out!','').trim()});
    };
    f.src = url;
    document.body.appendChild(f);
  });

  const out = [], queue = posts.slice();
  const worker = async () => { while (queue.length) {
    const r = await measure(queue.shift());
    if (r) out.push(r);
    if (out.length % 50 === 0) console.log(out.length + '/' + posts.length);
  }};
  await Promise.all(Array.from({length: 5}, worker));

  console.log('%c' + out.filter(r => r.pages === 1).length + ' of ' + out.length
    + ' fit on one page', 'font-weight:bold');
  console.log('--- holes 250px or bigger ---');
  console.table(out.filter(r => r.worst >= 250)
    .sort((a,b) => b.worst - a.worst)
    .map(r => ({title: r.title, pages: r.pages, holes: r.holes, worst: r.worst})));
  console.log('--- spilling a sliver onto the last page ---');
  console.table(out.filter(r => r.pages > 1 && r.last < 200)
    .sort((a,b) => a.last - b.last)
    .map(r => ({title: r.title, pages: r.pages, onLastPage: r.last})));
  window.printAudit = out;
})();
