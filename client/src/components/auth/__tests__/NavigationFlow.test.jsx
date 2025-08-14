import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute.jsx'
import NoGoalsGuard from '../../ui/NoGoalsGuard.jsx'
import { useAuth } from '../../../hooks/useAuth.js'
import { useGoalStore } from '../../../store/goalStore.js'
import { useAuthStore } from '../../../store/authStore.js'

// Mock the hooks and stores
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: vi.fn()
}))

vi.mock('../../../store/goalStore.js', () => ({
  useGoalStore: vi.fn()
}))

vi.mock('../../../store/authStore.js', () => ({
  useAuthStore: vi.fn()
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => (
      <div className={className} {...props}>{children}</div>
    ),
    h2: ({ children, className, ...props }) => (
      <h2 className={className} {...props}>{children}</h2>
    ),
    p: ({ children, className, ...props }) => (
      <p className={className} {...props}>{children}</p>
    )
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Target: () => <div data-testid="target-icon" />,
  Plus: () => <div data-testid="plus-icon" />
}))

// Mock Button component
vi.mock('../../ui/button.jsx', () => ({
  default: ({ children, onClick, className, ...props }) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

// Mock pages
const MockDashboardPage = () => (
  <NoGoalsGuard>
    <div>Dashboard Content</div>
  </NoGoalsGuard>
)

const MockTasksPage = () => (
  <NoGoalsGuard>
    <div>Tasks Content</div>
  </NoGoalsGuard>
)

const MockAssessmentPage = () => (
  <div>Assessment Page</div>
)

const MockSignInPage = () => (
  <div>Sign In Page</div>
)

describe('Navigation Flow Tests', () => {
  const mockFetchGoals = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderWithRoutes = (initialPath = '/dashboard') => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/auth/signin" element={<MockSignInPage />} />
          <Route path="/assessment" element={<MockAssessmentPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MockDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <MockTasksPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )
  }

  describe('Unauthenticated User Flow', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: true
      })
    })

    it('should redirect unauthenticated users from protected routes to signin', () => {
      // Mock window.location for navigation testing
      delete window.location
      window.location = { href: '/dashboard' }

      renderWithRoutes('/dashboard')

      // Should show sign in page instead of dashboard
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated User with No Goals Flow', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isReady: true
      })

      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isAuthChecked: true
      })

      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: null,
        fetchGoals: mockFetchGoals
      })
    })

    it('should show no goals message on dashboard for users without goals', () => {
      renderWithRoutes('/dashboard')

      expect(screen.getByText('No learning goal found')).toBeInTheDocument()
      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
    })

    it('should show no goals message on tasks page for users without goals', () => {
      renderWithRoutes('/tasks')

      expect(screen.getByText('No learning goal found')).toBeInTheDocument()
      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.queryByText('Tasks Content')).not.toBeInTheDocument()
    })

    it('should navigate to assessment when create goal button is clicked', async () => {
      const user = userEvent.setup()

      renderWithRoutes('/dashboard')

      const createGoalButton = screen.getByText('Create New Goal')
      await user.click(createGoalButton)

      // Should navigate to assessment page
      expect(screen.getByText('Assessment Page')).toBeInTheDocument()
    })
  })

  describe('Authenticated User with Goals Flow', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isReady: true
      })

      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isAuthChecked: true
      })

      useGoalStore.mockReturnValue({
        hasGoals: () => true,
        isLoadingGoals: false,
        error: null,
        fetchGoals: mockFetchGoals
      })
    })

    it('should show dashboard content for users with goals', () => {
      renderWithRoutes('/dashboard')

      expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
    })

    it('should show tasks content for users with goals', () => {
      renderWithRoutes('/tasks')

      expect(screen.getByText('Tasks Content')).toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show authentication loading state', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        isReady: false
      })

      renderWithRoutes('/dashboard')

      expect(screen.getByText('Verifying access...')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
    })

    it('should show goals loading state', () => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isReady: true
      })

      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isAuthChecked: true
      })

      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: true,
        error: null,
        fetchGoals: mockFetchGoals
      })

      renderWithRoutes('/dashboard')

      expect(screen.getByText('Loading your goals...')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
    })
  })

  describe('Infinite Redirection Prevention', () => {
    it('should not redirect when authentication is not ready', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: false // Key: not ready yet
      })

      renderWithRoutes('/dashboard')

      // Should not show any content or navigation
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument()
      expect(screen.queryByText('Verifying access...')).not.toBeInTheDocument()
    })

    it('should only redirect when authentication check is complete', () => {
      // First render - not ready
      const { rerender } = render(
        <BrowserRouter>
          <Routes>
            <Route path="/auth/signin" element={<MockSignInPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MockDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )

      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: false
      })

      // Should not redirect yet
      expect(screen.queryByText('Sign In Page')).not.toBeInTheDocument()

      // Second render - ready
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: true
      })

      rerender(
        <BrowserRouter>
          <Routes>
            <Route path="/auth/signin" element={<MockSignInPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MockDashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )

      // Now should redirect (though we can't test the actual navigation in this setup)
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
    })
  })
})