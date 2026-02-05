import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { FullPageSpinner } from './components/common/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ExamCreatePage } from './pages/ExamCreatePage'
import { ExamEditPage } from './pages/ExamEditPage'
import { ExamTakePage } from './pages/ExamTakePage'
import { ExamResultsPage } from './pages/ExamResultsPage'
import { HistoryPage } from './pages/HistoryPage'
import { QuestionBankPage } from './pages/QuestionBankPage'
import { NotFoundPage } from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppRoutes() {
  const { initialized, user } = useAuthStore()

  if (!initialized) {
    return <FullPageSpinner />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={user ? '/dashboard' : '/login'} replace />
        }
      />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/new"
        element={
          <ProtectedRoute requireRole="teacher">
            <ExamCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/:id/edit"
        element={
          <ProtectedRoute requireRole="teacher">
            <ExamEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/:id"
        element={
          <ProtectedRoute>
            <ExamTakePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/:id/results/:attemptId"
        element={
          <ProtectedRoute>
            <ExamResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute requireRole="student">
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/question-bank"
        element={
          <ProtectedRoute requireRole="teacher">
            <QuestionBankPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
