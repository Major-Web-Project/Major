import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
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

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to, replace }) => {
      mockNavigate(to, replace)
      return <div data-testid="navigate" data-to={to} data-replace={replace} />
    },
    BrowserRouter: ({ children }) => <div>{children}</div>
  }
})

describe('ProtectedRoute + NoGoalsGuard Integration', () => {
  const mockFetchGoals = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Authentication Flow', () => {
    it('should show loading state during authentication check', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        isReady: false
      })

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByText('Verifying access...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should redirect unauthenticated users to signin', () => {
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: true
      })

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByTestId('navigate')).toBeInTheDocument()
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/auth/signin')
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Authenticated User Flow', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        isReady: true
      })
    })

    it('should show NoGoalsGuard loading when goals are being loaded', () => {
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

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByText('Loading your goals...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show no goals message for authenticated users without goals', () => {
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

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByText('No learning goal found')).toBeInTheDocument()
      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should render protected content for authenticated users with goals', () => {
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

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
      expect(screen.queryByText('Verifying access...')).not.toBeInTheDocument()
    })

    it('should navigate to assessment when create goal button is clicked', async () => {
      const user = userEvent.setup()

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

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      const createGoalButton = screen.getByText('Create New Goal')
      await user.click(createGoalButton)

      expect(mockNavigate).toHaveBeenCalledWith('/assessment')
    })
  })

  describe('Error Handling', () => {
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
    })

    it('should show error message and retry button for network errors', async () => {
      const user = userEvent.setup()

      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: 'Network error. Please check your connection',
        fetchGoals: mockFetchGoals
      })

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
      expect(screen.getByText('Network error. Please check your connection')).toBeInTheDocument()
      
      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      expect(mockFetchGoals).toHaveBeenCalledOnce()
    })

    it('should prevent infinite redirection loops', () => {
      // Test that ProtectedRoute doesn't redirect when not ready
      useAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        isReady: false
      })

      render(
        <BrowserRouter>
          <ProtectedRoute>
            <NoGoalsGuard>
              <div>Protected Content</div>
            </NoGoalsGuard>
          </ProtectedRoute>
        </BrowserRouter>
      )

      // Should not show navigation component when not ready
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })
})