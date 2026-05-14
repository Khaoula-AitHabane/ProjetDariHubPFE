import { HashRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import SiteLayout from './components/SiteLayout'
import { MarketplaceProvider } from './context/MarketplaceContext'
import AdminDashboard from './pages/AdminDashboard'
import CategoryPage from './pages/CategoryPage'
import FavoritesPage from './pages/FavoritesPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyListingsPage from './pages/MyListingsPage'
import NotFoundPage from './pages/NotFoundPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
    <MarketplaceProvider>
      <HashRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/categories/:type" element={<CategoryPage />} />
            <Route path="/favoris" element={<FavoritesPage />} />
            <Route path="/mes-annonces" element={<MyListingsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </MarketplaceProvider>
  )
}

export default App
