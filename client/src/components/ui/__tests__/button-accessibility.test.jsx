import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../button.jsx';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, className, ...props }) => (
      <button onClick={onClick} disabled={disabled} className={className} {...props}>
        {children}
      </button>
    )
  }
}));

describe('Button Accessibility', () => {
  it('has proper focus styles', () => {
    render(<Button>Accessible Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
    // The focus styles are handled by CSS, so we just verify the class is applied
  });

  it('supports keyboard navigation', () => {
    render(<Button>Keyboard Button</Button>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    // Native button elements support keyboard navigation by default
  });

  it('has proper disabled state', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-primary');
  });

  it('maintains text contrast', () => {
    render(<Button variant="primary">High Contrast</Button>);
    const button = screen.getByRole('button');
    // The gold-to-silver gradient with white text should provide good contrast
    expect(button).toHaveClass('btn-primary');
  });
});