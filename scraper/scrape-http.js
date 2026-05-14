/**
 * DariHub - Scraper HTTP multi-strategies
 * ========================================
 *
 * Strategies utilisees selon la techno detectee :
 *   - SHOPIFY        : GET /products.json?limit=250 (JSON natif, ultra-robuste)
 *   - WOOCOMMERCE    : GET /wp-json/wc/store/v1/products (REST publique)
 *   - HTML custom    : fetch + cheerio + selecteurs site-specifiques
 *
 * Sites cibles :
 *   IMMOBILIER  : mubawab (HTML), agenz (HTML), sarouty/selektimmo/logic-immo (Woo)
 *   MEUBLES     : mobilia (Shopify), decormeuble/furniva (Woo), darmarket/richbond (HTML)
 *   SERVICES    : (Avito via Playwright dans scrape.js, ce fichier ne les couvre pas)
 *
 * Usage :
 *   node scrape-http.js                 # tous les sites
 *   node scrape-http.js --source=mobilia
 *   node scrape-http.js --source=immobilier
 *   node scrape-http.js --source=meubles
 *   node scrape-http.js --merge         # ne pas ecraser, fusionner
 *   node scrape-http.js --pages=3       # plusieurs pages
 *
 * Puis :
 *   cd ../backend && php artisan services:import --fresh
 */

import * as cheerio from 'cheerio'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------- Args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v === undefined ? true : v]
  }),
)
const SOURCE = String(args.source ?? 'all').toLowerCase()
const MAX_PAGES = Number(args.pages ?? 2)
const MERGE = Boolean(args.merge)
const OUTPUT = path.resolve(__dirname, 'data', 'services.json')

// ---------- Utils ----------
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function httpGet(url, { accept = 'text/html', referer } = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: accept,
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      Referer: referer ?? 'https://www.google.com/',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res
}

const cleanText = (s) =>
  String(s ?? '').replace(/\s+/g, ' ').replace(/[\u00A0\u202F]/g, ' ').trim()

const parsePrice = (s) => {
  if (s === undefined || s === null) return 0
  if (typeof s === 'number') return s
  let str = String(s).trim()
  // Retire la partie decimale ".00" ou ",00" en fin de chaine (avant unite eventuelle)
  str = str.replace(/[.,]\d{1,2}(?=\D*$)/, '')
  const digits = str.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

const stripHtml = (s) => cleanText(String(s ?? '').replace(/<[^>]+>/g, ' '))

const toAbs = (href, base) => {
  try { return new URL(href, base).toString() } catch { return href }
}

const CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fes', 'Fès', 'Meknes', 'Meknès',
  'Agadir', 'Oujda', 'Kenitra', 'Kénitra', 'Tetouan', 'Tétouan', 'Sale', 'Salé',
  'Mohammedia', 'El Jadida', 'Beni Mellal', 'Nador', 'Safi', 'Temara', 'Témara',
  'Khouribga', 'Settat', 'Berrechid', 'Larache', 'Ifrane', 'Essaouira', 'Dakhla',
  'Laayoune', 'Laâyoune', 'Bouskoura',
]
const guessCity = (txt) => {
  const t = String(txt ?? '').toLowerCase()
  for (const c of CITIES) if (t.includes(c.toLowerCase())) return c
  return null
}

// ====================================================================
// STRATEGIE 1 : SHOPIFY (products.json)
// ====================================================================
async function scrapeShopify({ name, baseUrl, category, service_type = 'furniture_rental', billing_unit = 'per_day' }) {
  const out = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${baseUrl}/products.json?limit=250&page=${page}`
    try {
      const res = await httpGet(url, { accept: 'application/json' })
      const data = await res.json()
      const products = data.products ?? []
      if (products.length === 0) break
      for (const p of products) {
        const variant = (p.variants && p.variants[0]) || {}
        const price = parsePrice(variant.price)
        const img = (p.images && p.images[0] && p.images[0].src) || null
        const title = cleanText(p.title)
        if (!title || price <= 0) continue
        const sourceUrl = p.handle ? `${baseUrl}/products/${p.handle}` : baseUrl
        out.push({
          service_type,
          category,
          title,
          description: stripHtml(p.body_html) || title,
          location_city: 'Casablanca',
          price,
          billing_unit,
          image_url: img,
          source_url: sourceUrl,
          features: [name, p.product_type || 'Mobilier'].filter(Boolean),
        })
      }
      await sleep(400)
    } catch (e) {
      console.warn(`[${name}] page=${page} -> ${e.message}`)
      break
    }
  }
  return out
}

// ====================================================================
// STRATEGIE 2 : WOOCOMMERCE (Store REST API)
// ====================================================================
async function scrapeWoo({ name, baseUrl, category, service_type = 'furniture_rental', billing_unit = 'per_day' }) {
  const out = []
  const endpoints = [
    `${baseUrl}/wp-json/wc/store/v1/products?per_page=100`,
    `${baseUrl}/wp-json/wc/store/products?per_page=100`,
  ]
  for (const ep of endpoints) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${ep}&page=${page}`
      try {
        const res = await httpGet(url, { accept: 'application/json' })
        const products = await res.json()
        if (!Array.isArray(products) || products.length === 0) break
        for (const p of products) {
          const price = parsePrice(p.prices?.price ?? p.price ?? 0) / 100 || parsePrice(p.prices?.price ?? p.price ?? 0)
          const img = p.images?.[0]?.src || null
          const title = cleanText(p.name)
          if (!title) continue
          out.push({
            service_type,
            category,
            title,
            description: stripHtml(p.description || p.short_description) || title,
            location_city: guessCity(title) || 'Casablanca',
            price: price || parsePrice(p.prices?.price_range?.min_amount) || 100,
            billing_unit,
            image_url: img,
            source_url: p.permalink || (p.slug ? `${baseUrl}/produit/${p.slug}` : baseUrl),
            features: [name],
          })
        }
        await sleep(400)
      } catch (e) {
        // 404 sur cet endpoint -> on tente le suivant
        if (page === 1) console.warn(`[${name}] ${ep} -> ${e.message}`)
        break
      }
    }
    if (out.length > 0) break
  }
  return out
}

// ====================================================================
// STRATEGIE 3 : HTML custom
// ====================================================================
async function scrapeMubawab() {
  const out = []
  const bases = [
    { url: 'https://www.mubawab.ma/fr/ct/casablanca/immobilier-a-louer', city: 'Casablanca' },
    { url: 'https://www.mubawab.ma/fr/ct/rabat/immobilier-a-louer', city: 'Rabat' },
    { url: 'https://www.mubawab.ma/fr/ct/marrakech/immobilier-a-louer', city: 'Marrakech' },
    { url: 'https://www.mubawab.ma/fr/ct/tanger/immobilier-a-louer', city: 'Tanger' },
  ]
  for (const { url: base, city } of bases) {
    for (let p = 1; p <= MAX_PAGES; p++) {
      const url = p === 1 ? base : `${base}:p:${p}`
      try {
        const res = await httpGet(url)
        const html = await res.text()
        const $ = cheerio.load(html)
        $('li.listingBox, .listingBox').each((_, el) => {
          const $el = $(el)
          const title = cleanText($el.find('h2').first().text())
          const price = parsePrice($el.find('.priceTag, .price').first().text())
          const description = cleanText($el.find('.descListing, .listingDesc').first().text() || title)
          let img = $el.find('img').attr('data-src') || $el.find('img').attr('src') || null
          if (img) img = toAbs(img, base)
          // Lien vers la fiche : <a href="..."> autour ou dans la card
          let detailHref = $el.find('a[href]').first().attr('href') || $el.attr('data-href') || null
          const sourceUrl = detailHref ? toAbs(detailHref, base) : url
          if (title && price > 0) {
            out.push({
              service_type: 'house_rental',
              category: 'Location appartement',
              title,
              description,
              location_city: guessCity(description) || city,
              price,
              billing_unit: 'per_night',
              image_url: img,
              source_url: sourceUrl,
              features: ['Mubawab'],
            })
          }
        })
        await sleep(500)
      } catch (e) {
        console.warn(`[mubawab] ${url} -> ${e.message}`)
      }
    }
  }
  return out
}

async function scrapeAgenz() {
  const out = []
  const cities = [
    { slug: 'casablanca', name: 'Casablanca' },
    { slug: 'rabat', name: 'Rabat' },
    { slug: 'marrakech', name: 'Marrakech' },
    { slug: 'tanger', name: 'Tanger' },
  ]
  for (const c of cities) {
    for (let p = 1; p <= MAX_PAGES; p++) {
      const url = `https://agenz.ma/fr/louer/immo-${c.slug}/location-appartements${p > 1 ? `?page=${p}` : ''}`
      try {
        const res = await httpGet(url)
        const html = await res.text()
        const $ = cheerio.load(html)
        $('a[href*="/bien/"], a[href*="/annonce/"], article, .property-card, [class*="PropertyCard"], [class*="listing"]').each((_, el) => {
          const $el = $(el)
          const title = cleanText($el.find('h1, h2, h3, .title, [class*="title"]').first().text() || $el.attr('title') || '')
          const priceText = $el.find('[class*="price"], [class*="Price"], .price').first().text()
          const price = parsePrice(priceText)
          let img = $el.find('img').attr('data-src') || $el.find('img').attr('src') || null
          if (img) img = toAbs(img, url)
          let detailHref = $el.is('a[href]') ? $el.attr('href') : $el.find('a[href]').first().attr('href')
          const sourceUrl = detailHref ? toAbs(detailHref, url) : url
          if (title && price > 0) {
            out.push({
              service_type: 'house_rental',
              category: 'Location appartement',
              title,
              description: title,
              location_city: guessCity(title) || c.name,
              price,
              billing_unit: 'per_night',
              image_url: img,
              source_url: sourceUrl,
              features: ['Agenz'],
            })
          }
        })
        await sleep(500)
      } catch (e) {
        console.warn(`[agenz] ${url} -> ${e.message}`)
      }
    }
  }
  return out
}

async function scrapeSaroutyLike(name, baseUrl) {
  const out = []
  const paths = [
    { url: '/louer/appartements-a-louer/', cat: 'Location appartement', unit: 'per_night' },
    { url: '/louer/maisons-a-louer/', cat: 'Location maison', unit: 'per_night' },
    { url: '/acheter/appartements-a-vendre/', cat: 'Vente appartement', unit: 'per_night' },
    { url: '/acheter/villas-a-vendre/', cat: 'Vente villa', unit: 'per_night' },
  ]
  for (const p of paths) {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${baseUrl}${p.url}${page > 1 ? `?page=${page}` : ''}`
      try {
        const res = await httpGet(url)
        const html = await res.text()
        const $ = cheerio.load(html)
        $('article, .property, .property-card, [class*="property-listing"], [class*="listing-item"], [data-property]').each((_, el) => {
          const $el = $(el)
          const title = cleanText($el.find('h2, h3, h4, .property-title, [class*="title"]').first().text())
          const priceText = $el.find('[class*="price"], .price').first().text()
          const price = parsePrice(priceText)
          const cityText = cleanText($el.find('[class*="location"], [class*="city"], address').first().text())
          let img = $el.find('img').attr('data-src') || $el.find('img').attr('data-lazy') || $el.find('img').attr('src') || null
          if (img) img = toAbs(img, url)
          let detailHref = $el.find('a[href]').first().attr('href')
          const sourceUrl = detailHref ? toAbs(detailHref, url) : url
          if (title && price > 0) {
            out.push({
              service_type: 'house_rental',
              category: p.cat,
              title,
              description: title,
              location_city: guessCity(cityText + ' ' + title) || 'Maroc',
              price,
              billing_unit: p.unit,
              image_url: img,
              source_url: sourceUrl,
              features: [name],
            })
          }
        })
        await sleep(500)
      } catch (e) {
        console.warn(`[${name}] ${url} -> ${e.message}`)
      }
    }
  }
  return out
}

async function scrapeRichbond() {
  const out = []
  const cats = [
    { url: 'https://richbond.ma/matelas.html', label: 'Matelas' },
    { url: 'https://richbond.ma/salon.html', label: 'Salon' },
    { url: 'https://richbond.ma/linge-de-lit.html', label: 'Linge de lit' },
  ]
  for (const c of cats) {
    try {
      const res = await httpGet(c.url)
      const html = await res.text()
      const $ = cheerio.load(html)
      // Magento : div.product-item-info
      $('.product-item-info, li.product-item, .product, [class*="product-item"]').each((_, el) => {
        const $el = $(el)
        const title = cleanText(
          $el.find('.product-item-link, .product-name, h2, h3, [class*="product-item-name"]').first().text(),
        )
        const price = parsePrice($el.find('.price, [class*="price"]').first().text())
        let img =
          $el.find('img').attr('data-src') ||
          $el.find('img').attr('data-lazy') ||
          $el.find('img').attr('src') ||
          null
        if (img) img = toAbs(img, c.url)
        let detailHref = $el.find('a.product-item-link, a[href]').first().attr('href')
        const sourceUrl = detailHref ? toAbs(detailHref, c.url) : c.url
        if (title && price > 0) {
          out.push({
            service_type: 'furniture_rental',
            category: `Literie - ${c.label}`,
            title,
            description: title,
            location_city: 'Casablanca',
            price,
            billing_unit: 'per_day',
            image_url: img,
            source_url: sourceUrl,
            features: ['Richbond', c.label],
          })
        }
      })
      await sleep(500)
    } catch (e) {
      console.warn(`[richbond] ${c.url} -> ${e.message}`)
    }
  }
  return out
}

async function scrapeDarmarket() {
  const out = []
  const cats = [
    'Salon%20marocain', 'Salon%20moderne', 'Salons',
    'Chambre', 'Decoration', 'Cuisine', 'Tables',
  ]
  for (const cat of cats) {
    const url = `https://darmarket.ma/catalogue?cat=${cat}`
    try {
      const res = await httpGet(url)
      const html = await res.text()
      const $ = cheerio.load(html)
      // 1) cartes generiques
      $('a[href*="/produit/"]').each((_, a) => {
        const $a = $(a)
        const $card = $a.closest('article, .card, .product, [class*="product"], li, div').length
          ? $a.closest('article, .card, .product, [class*="product"], li, div').first()
          : $a
        const href = $a.attr('href')
        const title =
          cleanText($card.find('h2, h3, h4, .title, [class*="title"], [class*="name"]').first().text()) ||
          cleanText($a.attr('title') || '') ||
          cleanText(decodeURIComponent((href ?? '').split('/').pop() ?? '').replace(/-casablanca-\d+$/, '').replace(/-/g, ' '))
        const priceText = $card.find('[class*="price"], .price, .amount').first().text()
        const price = parsePrice(priceText)
        let img =
          $card.find('img').attr('data-src') ||
          $card.find('img').attr('data-lazy') ||
          $card.find('img').attr('src') ||
          null
        if (img) img = toAbs(img, url)
        const sourceUrl = href ? toAbs(href, url) : url
        if (title && price > 0) {
          out.push({
            service_type: 'furniture_rental',
            category: decodeURIComponent(cat),
            title,
            description: title,
            location_city: 'Casablanca',
            price,
            billing_unit: 'per_day',
            image_url: img,
            source_url: sourceUrl,
            features: ['DarMarket'],
          })
        }
      })
      await sleep(500)
    } catch (e) {
      console.warn(`[darmarket] ${url} -> ${e.message}`)
    }
  }
  return out
}

// ====================================================================
// REGISTRY
// ====================================================================
const SITES = {
  // Immobilier
  mubawab: () => scrapeMubawab(),
  agenz: () => scrapeAgenz(),
  sarouty: () => scrapeSaroutyLike('Sarouty', 'https://www.sarouty.ma'),
  selektimmo: () => scrapeSaroutyLike('SelektImmo', 'https://www.selektimmo.com'),
  // Meubles
  mobilia: () => scrapeShopify({
    name: 'Mobilia',
    baseUrl: 'https://mobilia.ma',
    category: 'Mobilier',
  }),
  decormeuble: () => scrapeWoo({
    name: 'DecorMeuble',
    baseUrl: 'https://decormeuble.ma',
    category: 'Mobilier',
  }),
  furniva: () => scrapeWoo({
    name: 'Furniva',
    baseUrl: 'https://furniva.ma',
    category: 'Mobilier',
  }),
  richbond: () => scrapeRichbond(),
  darmarket: () => scrapeDarmarket(),
}

const GROUPS = {
  immobilier: ['mubawab', 'agenz', 'sarouty', 'selektimmo'],
  meubles: ['mobilia', 'decormeuble', 'furniva', 'richbond', 'darmarket'],
  all: ['mubawab', 'agenz', 'sarouty', 'selektimmo',
        'mobilia', 'decormeuble', 'furniva', 'richbond', 'darmarket'],
}

// ====================================================================
// MAIN
// ====================================================================
;(async () => {
  const toRun = GROUPS[SOURCE] ?? (SITES[SOURCE] ? [SOURCE] : null)
  if (!toRun) {
    console.error(`Source inconnue: ${SOURCE}`)
    console.error(`Disponibles: ${Object.keys(SITES).join(', ')}`)
    console.error(`Groupes: ${Object.keys(GROUPS).join(', ')}`)
    process.exit(1)
  }

  console.log(`Sources: ${toRun.join(', ')} (pages=${MAX_PAGES})\n`)
  const all = []
  for (const key of toRun) {
    process.stdout.write(`>> ${key.padEnd(12)} `)
    try {
      const items = await SITES[key]()
      console.log(`-> ${items.length} annonces`)
      all.push(...items)
    } catch (e) {
      console.log(`!! ${e.message}`)
    }
  }

  // Dedup par titre normalise
  const seen = new Set()
  const unique = []
  for (const it of all) {
    const k = `${it.service_type}::${it.title.toLowerCase().slice(0, 80)}`
    if (seen.has(k)) continue
    seen.add(k)
    unique.push(it)
  }

  // Merge optionnel
  let finalItems = unique
  if (MERGE && fs.existsSync(OUTPUT)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'))
      const merged = [...prev]
      for (const it of unique) {
        const k = `${it.service_type}::${it.title.toLowerCase().slice(0, 80)}`
        if (!merged.some((p) => `${p.service_type}::${p.title.toLowerCase().slice(0, 80)}` === k)) {
          merged.push(it)
        }
      }
      finalItems = merged
    } catch (e) {
      console.warn(`Merge KO: ${e.message}`)
    }
  }

  if (finalItems.length === 0) {
    console.warn('\nAucune annonce extraite, services.json non modifie.')
    process.exit(0)
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(finalItems, null, 2), 'utf8')

  const byType = finalItems.reduce((acc, it) => {
    acc[it.service_type] = (acc[it.service_type] ?? 0) + 1
    return acc
  }, {})
  console.log(`\n[OK] ${finalItems.length} annonces -> ${OUTPUT}`)
  console.log('Par type:', byType)
  console.log('\nProchaine etape: cd ../backend && php artisan services:import --fresh')
})()
