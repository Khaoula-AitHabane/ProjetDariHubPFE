import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { createEmptyAuthForm } from '../lib/marketplace'

export default function AuthCard({ mode }) {
  const navigate = useNavigate()
  const {
    currentUser,
    authSubmitting,
    authFeedback,
    demoMode,
    login,
    register,
  } = useMarketplace()
  const [form, setForm] = useState(createEmptyAuthForm())

  if (currentUser) {
    const target = currentUser.role === 'admin' ? '/admin' : '/'
    return <Navigate to={target} replace />
  }

  const isRegister = mode === 'register'

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const res = isRegister
      ? await register(form)
      : await login({
          email: form.email,
          password: form.password,
        })

    if (res && res.data) {
      if (res.data.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    }
  }

  return (
    <section className="auth-page">
      <div className="card auth-page-card">
        <div className="auth-page-copy">
          <p className="small-label">{isRegister ? 'Register' : 'Login'}</p>
          <h1>{isRegister ? 'Creer ton compte' : 'Se connecter'}</h1>
          <p>
            {isRegister
              ? 'Cree ton compte client pour publier, commenter et reserver.'
              : 'Connecte-toi pour acceder a tes favoris et reservations.'}
          </p>

          <div className="auth-page-links">
            <Link to="/" className="secondary-button">
              Retour Home
            </Link>
            <Link
              to={isRegister ? '/login' : '/register'}
              className="secondary-button"
            >
              {isRegister ? 'Aller au Login' : 'Aller au Register'}
            </Link>
          </div>
        </div>

        <div className="card auth-form-card">
          {demoMode ? (
            <div className="notice">
              L API Laravel doit etre active pour utiliser login et register.
            </div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <>
                <label>
                  <span>Nom complet</span>
                  <input required name="name" value={form.name} onChange={handleChange} />
                </label>

                <div className="flex flex-col md:flex-row gap-4 w-full">
                  <label className="flex-1">
                    <span>Telephone</span>
                    <input name="phone" value={form.phone} onChange={handleChange} />
                  </label>

                  <label className="flex-1">
                    <span>Ville</span>
                    <input name="city" value={form.city} onChange={handleChange} />
                  </label>
                </div>

              </>
            ) : null}

            <label>
              <span>Email</span>
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>Mot de passe</span>
              <input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </label>

            {isRegister ? (
              <label>
                <span>Confirmation</span>
                <input
                  required
                  type="password"
                  name="passwordConfirmation"
                  value={form.passwordConfirmation}
                  onChange={handleChange}
                />
              </label>
            ) : null}

            <button className="primary-button" type="submit" disabled={authSubmitting}>
              {authSubmitting
                ? 'En cours...'
                : isRegister
                  ? 'Creer le compte'
                  : 'Entrer'}
            </button>
          </form>

          {authFeedback ? (
            <div className={authFeedback.type === 'success' ? 'feedback success' : 'feedback error'}>
              {authFeedback.message}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
