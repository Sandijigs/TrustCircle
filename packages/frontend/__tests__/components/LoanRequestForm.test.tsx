import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoanRequestForm } from '@/components/loans/LoanRequestForm';
import { mockWagmiHooks, setupWeb3Mocks } from '../mocks/mockWeb3';

setupWeb3Mocks();

describe('LoanRequestForm', () => {
  const mockOnSuccess = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loan request form', () => {
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    expect(screen.getByText(/request loan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
  });

  it('validates minimum loan amount', async () => {
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '25' } }); // Below $50 minimum
    
    const submitButton = screen.getByRole('button', { name: /request/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/minimum.*50/i)).toBeInTheDocument();
    });
  });

  it('validates maximum loan amount', async () => {
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '6000' } }); // Above $5000 maximum
    
    const submitButton = screen.getByRole('button', { name: /request/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/maximum.*5000/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const mockWrite = vi.fn();
    mockWagmiHooks.useWriteContract.mockReturnValue({
      writeContract: mockWrite,
      isPending: true,
      data: undefined,
      error: null,
    });
    
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const submitButton = screen.getByRole('button', { name: /request/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/requesting/i)).toBeInTheDocument();
  });

  it('displays error message on failure', async () => {
    const mockError = new Error('Insufficient credit score');
    mockWagmiHooks.useWriteContract.mockReturnValue({
      writeContract: vi.fn(),
      isPending: false,
      data: undefined,
      error: mockError,
    });
    
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText(/insufficient credit score/i)).toBeInTheDocument();
    });
  });

  it('calls onSuccess after successful submission', async () => {
    const mockWrite = vi.fn();
    mockWagmiHooks.useWriteContract.mockReturnValue({
      writeContract: mockWrite,
      isPending: false,
      data: '0xTransactionHash',
      error: null,
    });
    
    mockWagmiHooks.useWaitForTransactionReceipt.mockReturnValue({
      isLoading: false,
      isSuccess: true,
    });
    
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    
    const durationSelect = screen.getByLabelText(/duration/i);
    fireEvent.change(durationSelect, { target: { value: '90' } });
    
    const submitButton = screen.getByRole('button', { name: /request/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows payment frequency options', () => {
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const frequencySelect = screen.getByLabelText(/payment frequency/i);
    expect(frequencySelect).toBeInTheDocument();
    
    expect(screen.getByRole('option', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /bi-weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /monthly/i })).toBeInTheDocument();
  });

  it('calculates and displays estimated monthly payment', async () => {
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const amountInput = screen.getByLabelText(/amount/i);
    fireEvent.change(amountInput, { target: { value: '1000' } });
    
    const durationSelect = screen.getByLabelText(/duration/i);
    fireEvent.change(durationSelect, { target: { value: '90' } });
    
    await waitFor(() => {
      expect(screen.getByText(/estimated payment/i)).toBeInTheDocument();
    });
  });

  it('disables submit if wallet not connected', () => {
    mockWagmiHooks.useAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
      isConnecting: false,
      isDisconnected: true,
    });
    
    render(<LoanRequestForm onSuccess={mockOnSuccess} />);
    
    const submitButton = screen.getByRole('button', { name: /connect wallet/i });
    expect(submitButton).toBeInTheDocument();
  });
});
