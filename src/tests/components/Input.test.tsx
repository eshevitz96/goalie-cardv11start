import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
    it('renders with label', () => {
        render(<Input label="Username" name="username" />);
        expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('renders error message', () => {
        render(<Input label="Email" error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });

    it('handles text changes', () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} placeholder="Type here" />);

        const input = screen.getByPlaceholderText('Type here');
        fireEvent.change(input, { target: { value: 'Hello' } });

        expect(handleChange).toHaveBeenCalled();
        expect(input).toHaveValue('Hello');
    });
});
