import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import NoGoalsGuard from '../NoGoalsGuard.jsx'
import { useGoalStore } from '../../../store/goalStore.js'
import { useAuthStore } from '../../../store/authStore.js'

// Mock the stores
vi.mock('../../../store/goalStore.js', () => ({
  useGoalStore: vi.fn()
}))

vi.mock('../../../store/authStore.js', () => ({
  useAuthStore: vi.fn()
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }) => (
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
  Plus: () => <div data-testid="plus-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />
}))

// Mock Button component
vi.mock('../button.jsx', () => ({
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
    BrowserRouter: ({ children }) => <div>{children}</div>
  }
})

describe('User Scenarios', () => {
  const mockFetchGoals = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Guest User (Not Authenticated)', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        isAuthChecked: true
      })

      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: null,
        fetchGoals: mockFetchGoals
      })
    })

    it('should show sign in prompt for guest users', () => {
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Sign in to access your goals')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should navigate to sign in when sign in button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      const signInButton = screen.getByText('Sign In')
      await user.click(signInButton)

      expect(mockNavigate).toHaveBeenCalledWith('/auth/signin')
    })

    it('should navigate to sign up when create account button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      const signUpButton = screen.getByText('Create Account')
      await user.click(signUpButton)

      expect(mockNavigate).toHaveBeenCalledWith('/auth/signup')
    })
  })

  describe('Authenticated User with No Goals', () => {
    beforeEach(() => {
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

    it('should show create goal prompt for authenticated users with no goals', () => {
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('No learning goal found')).toBeInTheDocument()
      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should navigate to assessment when create goal button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      const createGoalButton = screen.getByText('Create New Goal')
      await user.click(createGoalButton)

      expect(mockNavigate).toHaveBeenCalledWith('/assessment')
    })
  })

  describe('Authenticated User with Goals', () => {
    beforeEach(() => {
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

    it('should render protected content for authenticated users with goals', () => {
      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
      expect(screen.queryByText('No learning goal found')).not.toBeInTheDocument()
      expect(screen.queryByText('Sign in to access your goals')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading when authentication is being checked', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        isAuthChecked: false
      })

      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: null,
        fetchGoals: mockFetchGoals
      })

      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Checking authentication...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should show loading when goals are being loaded', () => {
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
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Loading your goals...')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isAuthChecked: true
      })
    })

    it('should show network error message and retry button', async () => {
      const user = userEvent.setup()
      
      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: 'Network error. Please check your connection',
        fetchGoals: mockFetchGoals
      })

      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Connection Problem')).toBeInTheDocument()
      expect(screen.getByText('Network error. Please check your connection')).toBeInTheDocument()
      
      const tryAgainButton = screen.getByText('Try Again')
      await user.click(tryAgainButton)

      expect(mockFetchGoals).toHaveBeenCalledOnce()
    })

    it('should show auth error message with sign in option', async () => {
      const user = userEvent.setup()
      
      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: 'Please log in to view your goals',
        fetchGoals: mockFetchGoals
      })

      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Unable to Load Goals')).toBeInTheDocument()
      expect(screen.getByText('Please log in to view your goals')).toBeInTheDocument()
      
      const signInButton = screen.getByText('Sign In')
      await user.click(signInButton)

      expect(mockNavigate).toHaveBeenCalledWith('/auth/signin')
    })

    it('should show generic error message for server errors', () => {
      useGoalStore.mockReturnValue({
        hasGoals: () => false,
        isLoadingGoals: false,
        error: 'Server error. Please try again later',
        fetchGoals: mockFetchGoals
      })

      render(
        <BrowserRouter>
          <NoGoalsGuard>
            <div>Protected Content</div>
          </NoGoalsGuard>
        </BrowserRouter>
      )

      expect(screen.getByText('Unable to Load Goals')).toBeInTheDocument()
      expect(screen.getByText('Server error. Please try again later')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})