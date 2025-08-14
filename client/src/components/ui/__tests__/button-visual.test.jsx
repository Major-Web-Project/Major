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

describe('Button Visual Design System', () => {
  it('applies primary variant correctly', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });

  it('applies secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary');
  });

  it('applies danger variant correctly', () => {
    render(<Button variant="danger">Danger Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-danger');
  });

  it('applies small size correctly', () => {
    render(<Button size="sm">Small Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-sm');
  });

  it('applies medium size correctly', () => {
    render(<Button size="md">Medium Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-md');
  });

  it('applies large size correctly', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-lg');
  });

  it('applies extra large size correctly', () => {
    render(<Button size="xl">Extra Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-xl');
  });

  it('combines variant and size classes', () => {
    render(<Button variant="secondary" size="lg">Combined Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary', 'btn-lg');
  });

  it('preserves custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary', 'btn-md', 'custom-class');
  });
});