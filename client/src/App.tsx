import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ErrorProvider } from './context/ErrorContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              {/* Skip to main content link for keyboard navigation */}
              <a 
                href="#main-content" 
                className="skip-link"
                onFocus={(e) => e.target.classList.add('top-4')}
                onBlur={(e) => e.target.classList.remove('top-4')}
              >
                Skip to main content
              </a>
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LoginPage />
                    </Suspense>
                  </ErrorBoundary>
                } />
                <Route path="/register" element={
                  <ErrorBoundary>
                    <Suspense fallback={<LoadingSpinner />}>
                      <RegisterPage />
                    </Suspense>
                  </ErrorBoundary>
                } />
                
                {/* Protected routes */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <ErrorBoundary>
                        <Suspense fallback={<LoadingSpinner />}>
                          <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/report/:id" element={<ReportPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                          </Routes>
                        </Suspense>
                      </ErrorBoundary>
                    </Layout>
                  </ProtectedRoute>
                } />
              </Routes>
              
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
                aria-live="polite"
              />
            </div>
          </Router>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  )
}

export default App