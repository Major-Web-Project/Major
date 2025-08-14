import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from '../../../pages/DashboardPage.jsx'
import TasksPage from '../../../pages/TasksPage.jsx'
import { useGoalStore } from '../../../store/goalStore.js'
import { useAppStore } from '../../../store/appStore.js'
import { useDashboardStore } from '../../../store/dashboardStore.js'
import { useTaskStore } from '../../../store/taskStore.js'

// Mock all the stores
vi.mock('../../../store/goalStore.js', () => ({
  useGoalStore: vi.fn()
}))

vi.mock('../../../store/appStore.js', () => ({
  useAppStore: vi.fn()
}))

vi.mock('../../../store/dashboardStore.js', () => ({
  useDashboardStore: vi.fn()
}))

vi.mock('../../../store/taskStore.js', () => ({
  useTaskStore: vi.fn()
}))

// Mock other dependencies
vi.mock('../../../contexts/TasksContext.jsx', () => ({
  useTasks: () => ({
    tasks: [],
    refreshTasks: vi.fn()
  })
}))

vi.mock('../../../services/api.js', () => ({
  getDashboardData: vi.fn().mockResolvedValue({ tasks: [], summary: {} }),
  default: {
    get: vi.fn().mockResolvedValue({ data: { tasks: [], summary: {} } })
  }
}))

vi.mock('../../../services/aiLearningService.js', () => ({
  aiAssistant: {
    getAllTasks: vi.fn().mockResolvedValue([])
  }
}))

// Mock hooks
vi.mock('../../../hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'user1' },
    isAuthenticated: true
  })
}))

// Mock framer-motion and other UI libraries
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }) => <div className={className} {...props}>{children}</div>,
    button: ({ children, onClick, className, ...props }) => <button onClick={onClick} className={className} {...props}>{children}</button>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    utils: { toArray: vi.fn(() => []) },
    set: vi.fn(),
    timeline: vi.fn(() => ({
      scrollTrigger: null,
      kill: vi.fn(),
      to: vi.fn()
    }))
  },
  ScrollTrigger: {}
}))

vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />,
  Target: () => <div data-testid="target" />,
  Loader2: () => <div data-testid="loader" />,
  Plus: () => <div data-testid="plus" />
}))

describe('Goal Selection Integration', () => {
  const mockGoals = [
    { _id: 'goal1', field: 'React Development', description: 'Learn React' },
    { _id: 'goal2', field: 'Node.js Backend', description: 'Learn Node.js' }
  ]

  const mockSetActiveGoal = vi.fn()
  const mockSetCurrentPage = vi.fn()
  const mockFetchDashboardData = vi.fn()
  const mockFetchTasks = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default store mocks
    useGoalStore.mockReturnValue({
      goals: mockGoals,
      activeGoalId: 'goal1',
      setActiveGoal: mockSetActiveGoal,
      hasGoals: () => true,
      hasMultipleGoals: () => true,
      getActiveGoal: () => mockGoals[0],
      isLoadingGoals: false
    })

    useAppStore.mockReturnValue({
      setCurrentPage: mockSetCurrentPage,
      refetchCurrentPageData: vi.fn()
    })

    useDashboardStore.mockReturnValue({
      data: { tasks: [], summary: {} },
      fetchDashboardData: mockFetchDashboardData,
      isLoading: false
    })

    useTaskStore.mockReturnValue({
      tasks: [],
      fetchTasks: mockFetchTasks,
      isLoading: false
    })
  })

  it('should render GoalSelector on Dashboard page when user has multiple goals', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('React Development')).toBeInTheDocument()
    expect(screen.getByTestId('target')).toBeInTheDocument()
  })

  it('should render GoalSelector on Tasks page when user has multiple goals', () => {
    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Your Learning Tasks')).toBeInTheDocument()
    expect(screen.getByText('React Development')).toBeInTheDocument()
    expect(screen.getByTestId('target')).toBeInTheDocument()
  })

  it('should set current page when Dashboard loads', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    expect(mockSetCurrentPage).toHaveBeenCalledWith('dashboard')
  })

  it('should set current page when Tasks page loads', () => {
    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    )

    expect(mockSetCurrentPage).toHaveBeenCalledWith('tasks')
  })

  it('should fetch dashboard data with active goal ID', () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    expect(mockFetchDashboardData).toHaveBeenCalledWith('goal1')
  })

  it('should fetch tasks with active goal ID', () => {
    render(
      <BrowserRouter>
        <TasksPage />
      </BrowserRouter>
    )

    expect(mockFetchTasks).toHaveBeenCalledWith('goal1')
  })

  it('should show NoGoalsGuard when user has no goals', () => {
    useGoalStore.mockReturnValue({
      goals: [],
      activeGoalId: null,
      setActiveGoal: mockSetActiveGoal,
      hasGoals: () => false,
      hasMultipleGoals: () => false,
      getActiveGoal: () => null,
      isLoadingGoals: false
    })

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    expect(screen.getByText('No learning goal found')).toBeInTheDocument()
    expect(screen.getByText('Create New Goal')).toBeInTheDocument()
  })

  it('should show loading state when goals are loading', () => {
    useGoalStore.mockReturnValue({
      goals: [],
      activeGoalId: null,
      setActiveGoal: mockSetActiveGoal,
      hasGoals: () => false,
      hasMultipleGoals: () => false,
      getActiveGoal: () => null,
      isLoadingGoals: true
    })

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    expect(screen.getByText('Loading your goals...')).toBeInTheDocument()
  })

  it('should handle goal change events', async () => {
    const user = userEvent.setup()
    
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    )

    // Simulate goal change event
    const goalChangedEvent = new CustomEvent('goalChanged', {
      detail: { activeGoalId: 'goal2' }
    })

    fireEvent(window, goalChangedEvent)

    // Should trigger data refetch
    await waitFor(() => {
      expect(mockFetchDashboardData).toHaveBeenCalledWith('goal2')
    })
  })
})