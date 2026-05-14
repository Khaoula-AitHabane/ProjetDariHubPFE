/**
 * Probe : identifie la techno de chaque site cible.
 * - Tente /products.json (Shopify) -> si OK, c'est un Shopify
 * - Sinon tente la home et detecte WooCommerce / autres signatures
 */
import https from 'node:https'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const agent = new https.Agent({ rejectUnauthorized: false })

const sites = [
  // Immobilier
  'https://www.mubawab.ma',
  'https://www.avito.ma',
  'https://agenz.ma',
  'https://housing.place',
  'https://www.sarouty.ma',
  'https://www.selektimmo.com',
  'https://www.logic-immo.ma',
  // Meubles
  'https://darmarket.ma',
  'https://decoexpress.ma',
  'https://decormeuble.ma',
  'https://furniva.ma',
  'https://kitea.ma',
  'https://mobilia.ma',
  'https://kaoba.ma',
  'https://richbond.ma',
  // Services
  'https://youpijob.ma',
]

async function fetchSafe(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
      // @ts-ignore custom agent for self-signed
      dispatcher: undefined,
    })
    return { status: res.status, type: res.headers.get('content-type') ?? '', body: await res.text() }
  } catch (e) {
    return { status: 0, error: e.message }
  }
}

async function probe(site) {
  // 1. Tente Shopify /products.json
  const sj = await fetchSafe(`${site}/products.json?limit=1`)
  if (sj.status === 200 && sj.body?.startsWith('{')) {
    try {
      const j = JSON.parse(sj.body)
      if (Array.isArray(j.products)) return { site, tech: 'SHOPIFY', sample: j.products[0]?.title ?? null }
    } catch {}
  }
  // 2. Home
  const h = await fetchSafe(site)
  if (h.error) return { site, tech: 'ERROR', error: h.error }
  if (h.status >= 400) return { site, tech: `HTTP_${h.status}` }
  const body = h.body ?? ''
  const tech = []
  if (/wp-content|woocommerce/i.test(body)) tech.push('WordPress/Woo')
  if (/cdn\.shopify|shopify\.com/i.test(body)) tech.push('Shopify-CDN')
  if (/prestashop/i.test(body)) tech.push('PrestaShop')
  if (/cloudflare/i.test(body) && /challenge/i.test(body)) tech.push('CLOUDFLARE')
  if (/__NEXT_DATA__/.test(body)) tech.push('Next.js')
  if (/react/i.test(body) && /id="root"/.test(body)) tech.push('React-SPA')
  return { site, tech: tech.join(', ') || 'HTML', size: body.length }
}

;(async () => {
  for (const s of sites) {
    const r = await probe(s)
    console.log(JSON.stringify(r))
  }
})()
