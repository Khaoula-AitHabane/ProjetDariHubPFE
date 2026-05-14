import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="card not-found-card">
      <p className="small-label">404</p>
      <h1>Page introuvable</h1>
      <p className="subtitle">Had route ma kaynach. Rje3 l page principale.</p>
      <Link to="/" className="primary-button">
        Retour Home
      </Link>
    </section>
  )
}
