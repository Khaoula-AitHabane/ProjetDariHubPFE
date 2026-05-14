/**
 * Discover : explore la home de chaque site pour trouver les vraies URLs
 * de listings (immobilier ou produits).
 */
import * as cheerio from 'cheerio'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sites = [
  'https://agenz.ma',
  'https://www.sarouty.ma',
  'https://www.selektimmo.com',
  'https://www.logic-immo.ma',
  'https://darmarket.ma',
  'https://richbond.ma',
]

// Mots-cles a chercher dans les href pour reperer une page de listing
const KEYWORDS = [
  'bien', 'annonce', 'propriete', 'property', 'listing', 'louer', 'vendre',
  'a-vendre', 'a-louer', 'recherche', 'search',
  'produit', 'product', 'shop', 'boutique', 'collection',
  'categorie', 'category', 'matelas', 'salon', 'meuble', 'canape', 'lit',
]

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.text()
}

;(async () => {
  for (const site of sites) {
    console.log(`\n========== ${site} ==========`)
    try {
      const html = await fetchHtml(site)
      const $ = cheerio.load(html)
      const found = new Map() // href -> text
      $('a[href]').each((_, a) => {
        const href = $(a).attr('href') ?? ''
        const text = $(a).text().replace(/\s+/g, ' ').trim().slice(0, 60)
        const low = href.toLowerCase()
        if (KEYWORDS.some((k) => low.includes(k))) {
          try {
            const abs = new URL(href, site).toString()
            if (abs.startsWith(site) && !found.has(abs)) {
              found.set(abs, text)
            }
          } catch {}
        }
      })
      const top = [...found.entries()].slice(0, 12)
      for (const [u, t] of top) {
        console.log(`  ${u}\n     "${t}"`)
      }
      if (top.length === 0) console.log('  (rien trouve)')
    } catch (e) {
      console.log(`  !! ${e.message}`)
    }
  }
})()
