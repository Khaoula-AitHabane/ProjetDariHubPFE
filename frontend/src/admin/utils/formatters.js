export const chartPalette = ['#1d4ed8', '#0f172a', '#38bdf8', '#f97316', '#14b8a6', '#ef4444']

export const annonceStatusConfig = {
  en_attente: {
    label: 'En attente',
    classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  validee: {
    label: 'Validee',
    classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  refusee: {
    label: 'Refusee',
    classes: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
}

export const userStatusConfig = {
  actif: {
    label: 'Actif',
    classes: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
  },
  bloque: {
    label: 'Bloque',
    classes: 'bg-slate-200 text-slate-700 ring-1 ring-inset ring-slate-300',
  },
}

export const reportStatusConfig = {
  open: {
    label: 'Ouvert',
    classes: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
  ignored: {
    label: 'Ignore',
    classes: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300',
  },
  resolved: {
    label: 'Resolue',
    classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function formatAdminCurrency(value) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('fr-MA', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0))
}

export function formatAdminDate(value) {
  if (!value) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatAdminDateTime(value) {
  if (!value) {
    return 'Date inconnue'
  }

  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatRoleLabel(role) {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'provider':
      return 'Annonceur'
    default:
      return 'Client'
  }
}

export function getInitials(name) {
  if (!name) {
    return 'DH'
  }

  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getStatusConfig(kind, status) {
  if (kind === 'annonce') {
    return annonceStatusConfig[status] ?? annonceStatusConfig.en_attente
  }

  if (kind === 'user') {
    return userStatusConfig[status] ?? userStatusConfig.actif
  }

  return reportStatusConfig[status] ?? reportStatusConfig.open
}

export function truncateText(text, length = 140) {
  if (!text) {
    return ''
  }

  return text.length > length ? `${text.slice(0, length)}…` : text
}
