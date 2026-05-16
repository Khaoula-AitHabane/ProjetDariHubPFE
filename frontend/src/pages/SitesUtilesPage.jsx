import { Building, Armchair, Wrench, ExternalLink, Globe } from 'lucide-react'

const SITES_DATA = [
  {
    category: 'Immobilier',
    icon: <Building size={32} />,
    color: '#2563eb',
    sites: [
      { name: 'Avito Immobilier', url: 'https://www.avito.ma/fr/maroc/immobilier', desc: 'Le plus grand site d\'annonces au Maroc.' },
      { name: 'Mubawab', url: 'https://www.mubawab.ma', desc: 'Portail immobilier leader au Maroc.' },
      { name: 'Sarouty', url: 'https://www.sarouty.ma', desc: 'Trouvez votre futur chez-vous en quelques clics.' },
      { name: 'L\'Economiste Immo', url: 'https://www.leconomiste.com', desc: 'Actualités et annonces immobilières premium.' },
    ]
  },
  {
    category: 'Meubles & Déco',
    icon: <Armchair size={32} />,
    color: '#f97316',
    sites: [
      { name: 'IKEA Maroc', url: 'https://www.ikea.com/ma/fr/', desc: 'Design suédois et solutions d\'aménagement.' },
      { name: 'Kitea', url: 'https://www.kitea.com', desc: 'Leader de l\'ameublement et de la décoration au Maroc.' },
      { name: 'Mobilia', url: 'https://www.mobilia.ma', desc: 'Mobilier contemporain pour toute la maison.' },
      { name: 'Marjane Meubles', url: 'https://www.marjane.ma', desc: 'Large choix de meubles et électroménager.' },
    ]
  },
  {
    category: 'Services Maison',
    icon: <Wrench size={32} />,
    color: '#16a34a',
    sites: [
      { name: 'Bricoma', url: 'https://www.bricoma.ma', desc: 'La plus grande enseigne de bricolage au Maroc.' },
      { name: 'Mr. Bricolage', url: 'https://www.mrbricolage.ma', desc: 'Tout pour le jardin, la déco et le bricolage.' },
      { name: 'PrestaHome', url: 'https://www.prestahome.ma', desc: 'Services de nettoyage et maintenance professionnelle.' },
      { name: 'SOS Dépannage', url: 'https://www.sosdepannage.ma', desc: 'Urgence plomberie et électricité 24/7.' },
    ]
  }
]

export default function SitesUtilesPage() {
  return (
    <div className="svc-page" style={{ paddingBottom: '80px' }}>
      {/* Hero */}
      <section className="svc-hero" style={{ background: 'linear-gradient(135deg, #0b162c 0%, #1e293b 100%)', padding: '60px 24px' }}>
        <div className="svc-hero-content">
          <Globe size={48} style={{ color: '#38bdf8', marginBottom: '20px' }} />
          <h1 className="svc-hero-title">Sites Utiles & Partenaires</h1>
          <p className="svc-hero-sub">Une sélection des meilleures plateformes pour vous accompagner dans vos projets.</p>
        </div>
      </section>

      <div className="svc-main" style={{ maxWidth: '1100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          {SITES_DATA.map((group, idx) => (
            <section key={idx} className="sites-section">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: `3px solid ${group.color}`, paddingBottom: '10px', width: 'fit-content' }}>
                <div style={{ color: group.color }}>{group.icon}</div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0b162c', margin: 0 }}>{group.category}</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {group.sites.map((site, sIdx) => (
                  <a 
                    key={sIdx} 
                    href={site.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="site-link-card"
                    style={{
                      display: 'block',
                      background: '#fff',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{site.name}</h3>
                      <ExternalLink size={16} color="#94a3b8" />
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>{site.desc}</p>
                    <div style={{ marginTop: '15px', fontSize: '12px', fontWeight: '600', color: group.color }}>
                      Visiter le site →
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .site-link-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 20px rgba(0,0,0,0.08) !important;
          border-color: #cbd5e1 !important;
        }
      `}} />
    </div>
  )
}
