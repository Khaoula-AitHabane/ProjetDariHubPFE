import { LoaderCircle, Sparkles } from 'lucide-react'

export default function AiDescriptionAssistant({
  onGenerate,
  loadingAction = null,
  disabled = false,
}) {
  const isBusy = loadingAction !== null

  return (
    <div
      style={{
        display: 'grid',
        gap: '16px',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #dbeafe',
        background: 'linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '9999px', backgroundColor: '#ffffffb8', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
            <Sparkles size={15} />
            Assistant IA
          </div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#0f172a' }}>
            Genere une description automatiquement
          </h3>
          <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6 }}>
            L IA recupere directement les champs deja remplis dans le formulaire, comme le titre, la ville, le prix, la categorie, les chambres, la superficie et les informations supplementaires.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '10px', minWidth: '240px' }}>
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled || isBusy}
            className="btn-search-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px 18px',
              borderRadius: '9999px',
              border: 'none',
              cursor: disabled || isBusy ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '700',
              opacity: disabled || isBusy ? 0.78 : 1,
              boxShadow: '0 12px 30px rgba(37, 99, 235, 0.18)',
            }}
          >
            {loadingAction === 'generate' ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Generation...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generer avec IA
              </>
            )}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '14px 16px',
          borderRadius: '14px',
          backgroundColor: '#ffffffb0',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: '700', color: '#0f172a' }}>
            {isBusy ? 'AI is thinking...' : 'Assistant pret'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
            {isBusy
              ? 'Le modele prepare la description a partir des donnees deja presentes dans le formulaire.'
              : 'Aucune ressaisie n est necessaire. La cle API reste securisee cote backend.'}
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontSize: '0.85rem', fontWeight: '700' }}>
          {isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {isBusy ? 'Traitement en cours' : 'Mode securise'}
        </div>
      </div>
    </div>
  )
}
