import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, Home, History, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Header = () => {
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0" onClick={closeMobileMenu}>
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">
              AI Health Analyzer
            </span>
            <span className="text-lg font-bold text-gray-900 xs:hidden">
              AI Health
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8" role="navigation" aria-label="Main navigation">
            {isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive('/') ? 'page' : undefined}
                >
                  <Home className="h-4 w-4" aria-hidden="true" />
                  <span>Home</span>
                </Link>
                
                <Link
                  to="/history"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/history')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive('/history') ? 'page' : undefined}
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  <span>History</span>
                </Link>

                {/* User menu */}
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                  <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span>{user?.firstName} {user?.lastName}</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav 
            className="md:hidden border-t border-gray-200 py-4 space-y-2 animate-slide-down"
            role="navigation"
            aria-label="Mobile navigation"
          >
            {isAuthenticated ? (
              <>
                {/* User info */}
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border-b border-gray-100 pb-3 mb-3">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>

                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive('/') ? 'page' : undefined}
                >
                  <Home className="h-5 w-5" aria-hidden="true" />
                  <span>Home</span>
                </Link>
                
                <Link
                  to="/history"
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/history')
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive('/history') ? 'page' : undefined}
                >
                  <History className="h-5 w-5" aria-hidden="true" />
                  <span>History</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full text-left"
                  aria-label="Sign out of your account"
                >
                  <LogOut className="h-5 w-5" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header