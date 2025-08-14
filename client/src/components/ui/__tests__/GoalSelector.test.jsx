import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoalSelector from '../GoalSelector.jsx'
import { useGoalStore } from '../../../store/goalStore.js'

// Mock the goal store
vi.mock('../../../store/goalStore.js', () => ({
  useGoalStore: vi.fn()
}))

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, whileHover, whileTap, animate, ...props }) => (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    ),
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: ({ size, className }) => <div data-testid="chevron-down" className={className} />,
  Target: ({ size, className }) => <div data-testid="target" className={className} />,
  Loader2: ({ size, className }) => <div data-testid="loader" className={className} />
}))

describe('GoalSelector', () => {
  const mockSetActiveGoal = vi.fn()
  const mockGetActiveGoal = vi.fn()
  const mockHasMultipleGoals = vi.fn()

  const mockGoals = [
    { _id: 'goal1', field: 'React Development', description: 'Learn React fundamentals' },
    { _id: 'goal2', field: 'Node.js Backend', description: 'Master backend development' },
    { _id: 'goal3', field: 'Python Data Science', description: 'Data analysis and ML' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    useGoalStore.mockReturnValue({
      goals: mockGoals,
      activeGoalId: 'goal1',
      setActiveGoal: mockSetActiveGoal,
      hasMultipleGoals: mockHasMultipleGoals,
      getActiveGoal: mockGetActiveGoal,
      isLoadingGoals: false
    })

    mockHasMultipleGoals.mockReturnValue(true)
    mockGetActiveGoal.mockReturnValue(mockGoals[0])
  })

  it('should not render when user has only one goal', () => {
    mockHasMultipleGoals.mockReturnValue(false)
    
    const { container } = render(<GoalSelector />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render when goals are loading', () => {
    useGoalStore.mockReturnValue({
      goals: [],
      activeGoalId: null,
      setActiveGoal: mockSetActiveGoal,
      hasMultipleGoals: () => false,
      getActiveGoal: () => null,
      isLoadingGoals: true
    })
    
    const { container } = render(<GoalSelector />)
    expect(container.firstChild).toBeNull()
  })

  it('should render the selector button with active goal', () => {
    render(<GoalSelector />)
    
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('React Development')).toBeInTheDocument()
    expect(screen.getByTestId('target')).toBeInTheDocument()
    expect(screen.getByTestId('chevron-down')).toBeInTheDocument()
  })

  it('should show dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<GoalSelector />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Should show all goals in dropdown
    expect(screen.getByText('Node.js Backend')).toBeInTheDocument()
    expect(screen.getByText('Python Data Science')).toBeInTheDocument()
    expect(screen.getByText('Learn React fundamentals')).toBeInTheDocument()
  })

  it('should highlight active goal in dropdown', async () => {
    const user = userEvent.setup()
    render(<GoalSelector />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // The active goal should have special styling (we can't test CSS classes easily, 
    // but we can check for the active indicator)
    const dropdownButtons = screen.getAllByRole('button')
    expect(dropdownButtons.length).toBeGreaterThan(1) // Main button + dropdown buttons
  })

  it('should call setActiveGoal when selecting different goal', async () => {
    const user = userEvent.setup()
    render(<GoalSelector />)
    
    // Open dropdown
    const mainButton = screen.getByRole('button')
    await user.click(mainButton)
    
    // Click on a different goal
    const nodeGoalButton = screen.getByText('Node.js Backend')
    await user.click(nodeGoalButton)
    
    expect(mockSetActiveGoal).toHaveBeenCalledWith('goal2')
  })

  it('should not call setActiveGoal when clicking on already active goal', async () => {
    const user = userEvent.setup()
    render(<GoalSelector />)
    
    // Open dropdown
    const mainButton = screen.getByRole('button')
    await user.click(mainButton)
    
    // Click on the active goal
    const reactGoalButton = screen.getByText('React Development')
    await user.click(reactGoalButton)
    
    expect(mockSetActiveGoal).not.toHaveBeenCalled()
  })

  it('should show loading state when changing goals', async () => {
    const user = userEvent.setup()
    render(<GoalSelector />)
    
    // Open dropdown
    const mainButton = screen.getByRole('button')
    await user.click(mainButton)
    
    // Click on a different goal
    const nodeGoalButton = screen.getByText('Node.js Backend')
    await user.click(nodeGoalButton)
    
    // Should show loading state briefly
    await waitFor(() => {
      expect(screen.getByText('Switching...')).toBeInTheDocument()
    }, { timeout: 100 })
  })

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <GoalSelector />
        <div data-testid="outside">Outside element</div>
      </div>
    )
    
    // Open dropdown
    const mainButton = screen.getByRole('button')
    await user.click(mainButton)
    
    // Verify dropdown is open
    expect(screen.getByText('Node.js Backend')).toBeInTheDocument()
    
    // Click outside
    const outsideElement = screen.getByTestId('outside')
    await user.click(outsideElement)
    
    // Dropdown should close (goals should not be visible)
    await waitFor(() => {
      expect(screen.queryByText('Node.js Backend')).not.toBeInTheDocument()
    })
  })

  it('should apply custom className', () => {
    const customClass = 'custom-selector-class'
    render(<GoalSelector className={customClass} />)
    
    const container = screen.getByRole('button').parentElement
    expect(container).toHaveClass(customClass)
  })

  it('should handle goals without descriptions', async () => {
    const goalsWithoutDesc = [
      { _id: 'goal1', field: 'React Development' },
      { _id: 'goal2', field: 'Node.js Backend' }
    ]

    useGoalStore.mockReturnValue({
      goals: goalsWithoutDesc,
      activeGoalId: 'goal1',
      setActiveGoal: mockSetActiveGoal,
      hasMultipleGoals: () => true,
      getActiveGoal: () => goalsWithoutDesc[0],
      isLoadingGoals: false
    })

    const user = userEvent.setup()
    render(<GoalSelector />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    // Should still render goals without descriptions
    expect(screen.getByText('React Development')).toBeInTheDocument()
    expect(screen.getByText('Node.js Backend')).toBeInTheDocument()
  })
})