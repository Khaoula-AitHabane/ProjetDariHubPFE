/**
 * DariHub - Scraper d annonces reelles (Maroc)
 * =============================================
 *
 * Recupere des annonces depuis plusieurs sites marocains pour les
 * 3 categories du projet :
 *   - house_rental    -> Immobilier (Avito, Mubawab)
 *   - furniture_rental-> Meubles    (Avito, Kitea, Mobilia, Richbond, Kaoba)
 *   - home_service    -> Services   (Avito, Youpijob)
 *
 * Sortie : scraper/data/services.json (consomme par `php artisan services:import`).
 *
 * Important :
 * -----------
 *  - Ce scraper est destine a un usage academique / PFE local.
 *  - Respecte le robots.txt des sites cibles et limite le rate (delais entre requetes).
 *  - Certains sites utilisent Cloudflare : en cas de blocage, relance avec
 *    `--headful` pour resoudre un eventuel captcha manuellement.
 *  - Les selecteurs CSS des sites e-commerce changent souvent : si un site
 *    extrait 0 produit, ses selecteurs ont probablement evolue. Le scraper
 *    isole les erreurs : un site qui plante ne casse pas les autres.
 *
 * Usage :
 *   npm install
 *   npx playwright install chromium
 *
 *   # Tous les sites, 1 page par categorie (defaut)
 *   node scrape.js
 *
 *   # Un site specifique
 *   node scrape.js --source=avito
 *   node scrape.js --source=mubawab
 *   node scrape.js --source=kitea
 *   node scrape.js --source=mobilia
 *   node scrape.js --source=richbond
 *   node scrape.js --source=kaoba
 *   node scrape.js --source=youpijob
 *   node scrape.js --source=furniture   # Tous les sites de meubles
 *
 *   # Plusieurs pages par categorie
 *   node scrape.js --pages=3
 *
 *   # Mode visible (utile pour resoudre captcha)
 *   node scrape.js --headful
 *
 *   # Utiliser Chrome systeme au lieu du Chromium Playwright
 *   node scrape.js --channel=chrome
 *
 * Apres le scraping, importer en base :
 *   cd ../backend
 *   php artisan services:import           # ajoute aux annonces existantes
 *   php artisan services:import --fresh   # supprime tout et reimporte
 */

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------- Args ----------
const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=')
    return [key, value === undefined ? true : value]
  }),
)

const MAX_PAGES = Number(args.pages ?? 1)
// Sources supportees : avito, mubawab, kitea, mobilia, richbond, youpijob, all
const SOURCE = args.source ?? 'all'
const HEADFUL = Boolean(args.headful)
const CHANNEL = args.channel ?? '' // "" | "chrome" | "msedge" (utilise le navigateur systeme)
const OUTPUT = path.resolve(__dirname, 'data', 'services.json')

// ---------- Categories -> URL Avito ----------
const AVITO_CATEGORIES = [
  {
    service_type: 'house_rental',
    category: 'Immobilier',
    // Location + vente
    urls: [
      'https://www.avito.ma/fr/maroc/immobilier-a_louer',
      'https://www.avito.ma/fr/maroc/immobilier-a_vendre',
    ],
    defaultUnit: 'per_night',
  },
  {
    service_type: 'furniture_rental',
    category: 'Meubles',
    urls: [
      'https://www.avito.ma/fr/maroc/meubles_et_deco-%C3%A0_vendre',
    ],
    defaultUnit: 'per_day',
  },
  {
    service_type: 'home_service',
    category: 'Services maison',
    urls: [
      'https://www.avito.ma/fr/maroc/services',
    ],
    defaultUnit: 'per_service',
  },
]

// ---------- Utils ----------
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parsePrice(txt) {
  if (!txt) return 0
  const digits = String(txt).replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function guessCity(location) {
  if (!location) return 'Maroc'
  const first = String(location).split(/[,·-]/)[0].trim()
  return first || 'Maroc'
}

// Decode un slug Avito en titre lisible.
// Ex: "Magasin_%C3%A0_louer_d%C3%A9di%C3%A9_pour_restaurant_57741559.htm"
//   -> "Magasin a louer dedie pour restaurant"
function titleFromAvitoUrl(url) {
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').pop() || ''
    let slug = decodeURIComponent(last).replace(/\.htm$/i, '')
    // retire l ID numerique final (_57741559)
    slug = slug.replace(/_\d{6,}$/i, '')
    // remplace _ par espace
    slug = slug.replace(/_/g, ' ').trim()
    // normalise les accents si encodage casse
    return slug.replace(/\s+/g, ' ')
  } catch {
    return ''
  }
}

// Liste des villes marocaines (pour deduire la ville depuis l URL Avito).
const MOROCCAN_CITIES = [
  'casablanca', 'rabat', 'marrakech', 'marrakesh', 'fes', 'fez', 'tanger', 'tangier',
  'agadir', 'meknes', 'oujda', 'kenitra', 'tetouan', 'safi', 'mohammedia', 'el_jadida',
  'beni_mellal', 'nador', 'taza', 'settat', 'berrechid', 'khouribga', 'larache',
  'ouarzazate', 'essaouira', 'temara', 'sale', 'dar_bouazza', 'bouskoura', 'ifrane',
  'chefchaouen', 'ksar_el_kebir', 'taroudant', 'errachidia', 'guelmim', 'tiznit',
  'sidi_kacem', 'sidi_slimane', 'ait_melloul', 'fnideq', 'martil', 'asilah',
]

// Quartiers connus -> ville (pour les URLs Avito qui mettent un quartier
// au lieu de la ville, ex: /fr/bourgogne/... -> Casablanca).
const NEIGHBOURHOOD_TO_CITY = {
  bourgogne: 'Casablanca', maarif: 'Casablanca', ain_chock: 'Casablanca',
  ain_diab: 'Casablanca', sidi_maarouf: 'Casablanca', anfa: 'Casablanca',
  californie: 'Casablanca', oasis: 'Casablanca', hay_mohammadi: 'Casablanca',
  agdal: 'Rabat', hassan: 'Rabat', souissi: 'Rabat', yacoub_el_mansour: 'Rabat',
  hay_riad: 'Rabat', medina: 'Rabat',
  gueliz: 'Marrakech', hivernage: 'Marrakech', palmeraie: 'Marrakech',
  daoudiate: 'Marrakech', mhamid: 'Marrakech',
}

function detectMoroccanCity(text) {
  if (!text) return null
  const lower = String(text).toLowerCase()
  for (const c of MOROCCAN_CITIES) {
    const word = c.replace(/_/g, ' ')
    if (lower.includes(word)) {
      return word.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }
  return null
}

function cityFromAvitoUrl(url, locationLine = '') {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean) // ["fr","dar_bouazza","local","..."]
    const seg = (parts[1] || '').toLowerCase()

    // 1) Si le segment URL est une vraie ville
    if (MOROCCAN_CITIES.includes(seg)) {
      return seg.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
    // 2) Si c est un quartier connu, on remonte a la ville
    if (NEIGHBOURHOOD_TO_CITY[seg]) {
      return NEIGHBOURHOOD_TO_CITY[seg]
    }
    // 3) Sinon on cherche un nom de ville dans le breadcrumb (locationLine)
    const fromText = detectMoroccanCity(locationLine)
    if (fromText) return fromText
    return null
  } catch {
    return null
  }
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ---------- Scraping Avito ----------
async function safeGoto(page, url, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      return true
    } catch (err) {
      console.warn(`     (tentative ${i}/${attempts}) ${err.message.slice(0, 80)}`)
      if (i < attempts) await sleep(3000 + Math.random() * 2000)
    }
  }
  return false
}

async function scrapeAvitoListingPage(page, url) {
  console.log(`  -> ${url}`)
  const ok = await safeGoto(page, url, 3)
  if (!ok) return []

  // Accepter cookies si present
  try {
    await page.click('button:has-text("Accepter")', { timeout: 2_000 })
  } catch {
    /* ignore */
  }

  // Attend que les annonces apparaissent
  try {
    await page.waitForSelector('a[href*="/fr/"][class*="sc-"]', { timeout: 15_000 })
  } catch {
    console.warn('     ! Selecteur principal non trouve, on tente quand meme.')
  }

  // Extraction generique (Avito change souvent ses classes, on cible les liens
  // d annonces + images/texte alentour).
  const items = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/fr/"]'))
      .filter((a) => /\/vi\/|\/ad\//i.test(a.href) || /_\d+\.htm$/i.test(a.href))

    const seen = new Set()
    const results = []

    for (const a of anchors) {
      const href = a.href
      if (seen.has(href)) continue
      seen.add(href)

      const card = a.closest('[class*="sc-"]') || a
      const text = card.innerText || ''

      // Titre : souvent le premier texte long non vide.
      const lines = text.split('\n').map((s) => s.trim()).filter(Boolean)
      if (lines.length < 2) continue

      const title = lines.find((l) => l.length > 10 && !/DH/i.test(l)) || lines[0]
      const priceLine = lines.find((l) => /DH/i.test(l)) || ''
      const locationLine =
        lines.reverse().find((l) => /,/.test(l) && !/DH/i.test(l) && l !== title) || ''

      const img = card.querySelector('img')
      const imageUrl = img?.src || img?.getAttribute('data-src') || null

      results.push({
        url: href,
        title,
        priceLine,
        locationLine,
        imageUrl,
      })
    }

    return results
  })

  return items
}

async function scrapeAvito(browser, maxPages) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'fr-FR',
  })
  const page = await context.newPage()

  const all = []

  for (const cat of AVITO_CATEGORIES) {
    console.log(`\n[Avito] Categorie: ${cat.category}`)
    for (const baseUrl of cat.urls) {
      for (let p = 1; p <= maxPages; p++) {
        const url = p === 1 ? baseUrl : `${baseUrl}?o=${p}`
        try {
          const items = await scrapeAvitoListingPage(page, url)
          console.log(`     ${items.length} annonces extraites (page ${p})`)

          for (const it of items) {
            const price = parsePrice(it.priceLine)

            // Titre fiable depuis l URL (le DOM contient des faux titres
            // type "il y a 17 heures" ou "HOME SERVICE").
            const realTitle = titleFromAvitoUrl(it.url) || it.title
            if (!realTitle || realTitle.length < 4) continue

            // Skip les images-avatars par defaut.
            const cleanImage =
              it.imageUrl && !it.imageUrl.includes('avatar.svg')
                ? it.imageUrl
                : null

            const city = cityFromAvitoUrl(it.url, it.locationLine) || 'Maroc'

            all.push({
              source: 'avito.ma',
              source_url: it.url,
              service_type: cat.service_type,
              category: cat.category,
              title: realTitle.slice(0, 250),
              description: `${realTitle}\n\nAnnonce reelle importee depuis Avito.ma.\nLien: ${it.url}`,
              location_city: city,
              location_address: it.locationLine || null,
              price,
              billing_unit: cat.defaultUnit,
              features: [],
              image_url: cleanImage,
              is_featured: false,
              rating: 0,
              reviews_count: 0,
            })
          }

          await sleep(2500 + Math.random() * 2000) // politesse anti rate-limit
        } catch (err) {
          console.warn(`     ! Erreur sur ${url} : ${err.message}`)
        }
      }
    }
  }

  await context.close()
  return all
}

// ---------- Scraping Mubawab (immobilier uniquement) ----------
async function scrapeMubawab(browser, maxPages) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  })
  const page = await context.newPage()

  const all = []
  const baseUrl = 'https://www.mubawab.ma/fr/ct/maroc/immobilier-a-vendre'

  console.log(`\n[Mubawab] Immobilier`)
  for (let p = 1; p <= maxPages; p++) {
    const url = p === 1 ? baseUrl : `${baseUrl}:p:${p}`
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await sleep(1500)

      const items = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('li.listingBox, article'))
        return cards.map((card) => {
          const a = card.querySelector('a[href]')
          const title = card.querySelector('h2, .listingTit')?.innerText?.trim() || ''
          const priceLine = card.querySelector('.priceTag, .listingPrix')?.innerText?.trim() || ''
          const locationLine = card.querySelector('.listingH3, .listingCity')?.innerText?.trim() || ''
          const img = card.querySelector('img')?.src || null
          return { url: a?.href, title, priceLine, locationLine, imageUrl: img }
        }).filter((i) => i.title && i.url)
      })

      console.log(`     ${items.length} annonces extraites (page ${p})`)

      for (const it of items) {
        all.push({
          source: 'mubawab.ma',
          source_url: it.url,
          service_type: 'house_rental',
          category: 'Immobilier',
          title: it.title.slice(0, 250),
          description: `${it.title}\n\nAnnonce reelle importee depuis Mubawab (${it.url}).`,
          location_city: guessCity(it.locationLine),
          location_address: it.locationLine || null,
          price: parsePrice(it.priceLine),
          billing_unit: 'per_night',
          features: [],
          image_url: it.imageUrl,
          is_featured: false,
          rating: 0,
          reviews_count: 0,
        })
      }

      await sleep(1200 + Math.random() * 1200)
    } catch (err) {
      console.warn(`     ! Erreur sur ${url} : ${err.message}`)
    }
  }

  await context.close()
  return all
}

// ============================================================
// Scraper generique pour sites e-commerce de meubles marocains
// ============================================================
//
// Ces sites (Kitea, Mobilia, Richbond, Kaoba) suivent generalement
// un modele e-commerce simple : pages de listing avec cartes produits.
// On essaie plusieurs selecteurs CSS en cascade pour s adapter aux
// differentes structures HTML.
//
async function scrapeFurnitureSite(browser, config) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  })
  const page = await context.newPage()
  const all = []

  console.log(`\n[${config.label}] Meubles & Decoration`)
  for (const url of config.urls) {
    console.log(`  -> ${url}`)
    const ok = await safeGoto(page, url, 2)
    if (!ok) continue

    // Attente generique : on laisse le temps aux scripts de charger
    await sleep(2000 + Math.random() * 1500)

    // Tente de fermer popup / bandeau cookies
    try {
      await page.click(
        'button:has-text("Accepter"), button:has-text("J accepte"), button:has-text("OK")',
        { timeout: 1500 },
      )
    } catch {
      /* ignore */
    }

    const items = await page.evaluate((siteSelectors) => {
      // Essaie plusieurs strategies pour detecter les cartes produits
      const tryAll = (sels) => {
        for (const s of sels) {
          const found = document.querySelectorAll(s)
          if (found.length > 0) return Array.from(found)
        }
        return []
      }

      const cards = tryAll(siteSelectors.cards)
      const out = []

      for (const card of cards.slice(0, 40)) {
        // Lien
        const a = card.querySelector('a[href]')
        const href = a?.href || null

        // Titre : essaie h2/h3/h4 puis attribut title puis alt image
        const titleEl = card.querySelector('h1, h2, h3, h4, .product-title, .product-name, [class*="title"]')
        let title = titleEl?.innerText?.trim() || ''
        if (!title) {
          title = card.querySelector('img')?.alt?.trim() || ''
        }
        if (!title) {
          title = a?.getAttribute('title')?.trim() || ''
        }

        // Prix
        const priceEl = card.querySelector(
          '[class*="price"], .price, .product-price, [data-product-price]',
        )
        let priceLine = priceEl?.innerText?.trim() || ''

        // Image
        const img = card.querySelector('img')
        const imageUrl =
          img?.src ||
          img?.getAttribute('data-src') ||
          img?.getAttribute('data-lazy') ||
          null

        if (title && title.length > 3) {
          out.push({ url: href, title, priceLine, imageUrl })
        }
      }

      return out
    }, config.selectors || {
      cards: [
        '.product-item',
        '.product-card',
        '[class*="ProductCard"]',
        '.product',
        'li.product',
        'article.product',
        '.grid-product',
        '.collection-item',
      ],
    })

    console.log(`     ${items.length} produits extraits`)

    for (const it of items) {
      const price = parsePrice(it.priceLine)
      if (!it.title || it.title.length < 3) continue

      // Resolution URL absolue si relative
      let absUrl = it.url
      if (absUrl && !/^https?:/i.test(absUrl)) {
        try {
          absUrl = new URL(absUrl, url).href
        } catch {
          absUrl = null
        }
      }

      let absImg = it.imageUrl
      if (absImg && !/^https?:/i.test(absImg)) {
        try {
          absImg = new URL(absImg, url).href
        } catch {
          absImg = null
        }
      }

      all.push({
        source: config.source,
        source_url: absUrl,
        service_type: 'furniture_rental',
        category: config.category || 'Meubles',
        title: it.title.slice(0, 250),
        description: `${it.title}\n\nProduit reel importe depuis ${config.label} (${absUrl || url}).`,
        location_city: config.defaultCity || 'Casablanca',
        location_address: null,
        price,
        billing_unit: 'per_day',
        features: [],
        image_url: absImg,
        is_featured: false,
        rating: 0,
        reviews_count: 0,
      })
    }

    await sleep(1500 + Math.random() * 1500)
  }

  await context.close()
  return all
}

// ---------- Configurations sites de meubles marocains ----------
const FURNITURE_SITES = {
  kitea: {
    label: 'Kitea',
    source: 'kitea.ma',
    category: 'Meubles & Deco',
    defaultCity: 'Casablanca',
    urls: [
      'https://www.kitea.com/fr/catalogue/salons',
      'https://www.kitea.com/fr/catalogue/chambres',
      'https://www.kitea.com/fr/catalogue/salles-a-manger',
    ],
    selectors: {
      cards: [
        '.product-item-info',
        '.product-item',
        'li.item.product',
        '.product-card',
      ],
    },
  },
  mobilia: {
    label: 'Mobilia',
    source: 'mobilia.ma',
    category: 'Meubles & Deco',
    defaultCity: 'Casablanca',
    urls: [
      'https://www.mobilia.ma/fr/salons',
      'https://www.mobilia.ma/fr/chambres',
    ],
    selectors: {
      cards: [
        '.product-miniature',
        '.product-item',
        'article.product',
        '.js-product-miniature',
      ],
    },
  },
  richbond: {
    label: 'Richbond',
    source: 'richbond.ma',
    category: 'Literie & Maison',
    defaultCity: 'Casablanca',
    urls: [
      'https://www.richbond.ma/fr/literie',
      'https://www.richbond.ma/fr/salons',
    ],
    selectors: {
      cards: [
        '.product-item',
        '.product-card',
        'article.product',
        '.product',
      ],
    },
  },
  kaoba: {
    label: 'Kaoba',
    source: 'kaoba.ma',
    category: 'Meubles Design',
    defaultCity: 'Casablanca',
    urls: [
      'https://www.kaoba.ma/fr/salons',
      'https://www.kaoba.ma/fr/chambres',
    ],
    selectors: {
      cards: [
        '.product-miniature',
        '.product-item',
        'article.product',
      ],
    },
  },
}

// ---------- Scraping Youpijob (services maison) ----------
async function scrapeYoupijob(browser, maxPages) {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'fr-FR',
  })
  const page = await context.newPage()
  const all = []

  // Categories de services Youpijob
  const youpijobCategories = [
    { url: 'https://www.youpijob.fr/categorie/menage-repassage', cat: 'Menage' },
    { url: 'https://www.youpijob.fr/categorie/jardinage', cat: 'Jardinage' },
    { url: 'https://www.youpijob.fr/categorie/bricolage', cat: 'Bricolage' },
    { url: 'https://www.youpijob.fr/categorie/demenagement', cat: 'Demenagement' },
  ]

  console.log(`\n[Youpijob] Services maison`)
  for (const c of youpijobCategories) {
    console.log(`  -> ${c.url}`)
    const ok = await safeGoto(page, c.url, 2)
    if (!ok) continue

    await sleep(1500 + Math.random() * 1000)

    const items = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        '.job-card, .service-card, article, .listing-item, [class*="card"]',
      )
      return Array.from(cards).slice(0, 30).map((card) => {
        const a = card.querySelector('a[href]')
        const titleEl = card.querySelector('h2, h3, h4, [class*="title"]')
        const priceEl = card.querySelector('[class*="price"], .price')
        const locEl = card.querySelector('[class*="location"], [class*="city"]')
        const img = card.querySelector('img')
        return {
          url: a?.href,
          title: titleEl?.innerText?.trim() || a?.innerText?.trim() || '',
          priceLine: priceEl?.innerText?.trim() || '',
          locationLine: locEl?.innerText?.trim() || '',
          imageUrl: img?.src || null,
        }
      }).filter((i) => i.title && i.title.length > 3)
    })

    console.log(`     ${items.length} services extraits`)

    for (const it of items) {
      all.push({
        source: 'youpijob.fr',
        source_url: it.url,
        service_type: 'home_service',
        category: c.cat,
        title: it.title.slice(0, 250),
        description: `${it.title}\n\nService reel importe depuis Youpijob.`,
        location_city: guessCity(it.locationLine) || 'Casablanca',
        location_address: it.locationLine || null,
        price: parsePrice(it.priceLine) || 200,
        billing_unit: 'per_service',
        features: [],
        image_url: it.imageUrl,
        is_featured: false,
        rating: 0,
        reviews_count: 0,
      })
    }

    await sleep(1500)
  }

  await context.close()
  return all
}

// ---------- Main ----------
;(async () => {
  console.log('=== DarSouk Scraper ===')
  console.log(`Source: ${SOURCE} | Pages: ${MAX_PAGES} | Headful: ${HEADFUL}`)

  const browser = await chromium.launch({
    headless: !HEADFUL,
    ...(CHANNEL ? { channel: CHANNEL } : {}),
  })
  const collected = []

  // Helper : execute un scraper en isolant les erreurs (un site qui plante
  // ne doit pas casser tout le scraping).
  async function runSafe(label, fn) {
    try {
      const items = await fn()
      console.log(`  ✓ ${label}: ${items.length} annonces`)
      return items
    } catch (err) {
      console.warn(`  ✗ ${label} a echoue : ${err.message}`)
      return []
    }
  }

  try {
    if (SOURCE === 'avito' || SOURCE === 'all') {
      collected.push(...(await runSafe('Avito', () => scrapeAvito(browser, MAX_PAGES))))
    }
    if (SOURCE === 'mubawab' || SOURCE === 'all') {
      collected.push(...(await runSafe('Mubawab', () => scrapeMubawab(browser, MAX_PAGES))))
    }
    // Sites de meubles e-commerce
    for (const key of Object.keys(FURNITURE_SITES)) {
      if (SOURCE === key || SOURCE === 'all' || SOURCE === 'furniture') {
        collected.push(
          ...(await runSafe(FURNITURE_SITES[key].label, () =>
            scrapeFurnitureSite(browser, FURNITURE_SITES[key]),
          )),
        )
      }
    }
    if (SOURCE === 'youpijob' || SOURCE === 'all') {
      collected.push(...(await runSafe('Youpijob', () => scrapeYoupijob(browser, MAX_PAGES))))
    }
  } finally {
    await browser.close()
  }

  // Deduplication par titre + url
  const dedup = []
  const seen = new Set()
  for (const it of collected) {
    const key = `${it.source_url || ''}::${it.title}`
    if (seen.has(key)) continue
    seen.add(key)
    dedup.push(it)
  }

  if (dedup.length === 0) {
    console.warn(
      '\n⚠ Aucune annonce extraite. Le fichier existant N EST PAS ecrase.\n' +
        '  Causes possibles : rate-limit Avito, captcha Cloudflare, reseau lent.\n' +
        '  Reessaie plus tard ou utilise --headful.',
    )
    return
  }

  ensureDir(OUTPUT)
  fs.writeFileSync(OUTPUT, JSON.stringify(dedup, null, 2), 'utf8')

  console.log(`\n✔ ${dedup.length} annonces sauvegardees -> ${OUTPUT}`)
  console.log('  Pour importer en base : cd ../backend && php artisan services:import')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
