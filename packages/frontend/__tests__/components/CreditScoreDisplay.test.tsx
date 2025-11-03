import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreditScoreDisplay } from '@/components/credit/CreditScoreDisplay';
import { mockAccount, mockWagmiHooks, setupWeb3Mocks } from '../mocks/mockWeb3';

setupWeb3Mocks();

describe('CreditScoreDisplay', () => {
  it('renders credit score', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 720n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText('720')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/error.*credit score/i)).toBeInTheDocument();
  });

  it('displays correct score tier (Excellent)', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 820n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/excellent/i)).toBeInTheDocument();
  });

  it('displays correct score tier (Good)', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 720n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/good/i)).toBeInTheDocument();
  });

  it('displays correct score tier (Fair)', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 620n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/fair/i)).toBeInTheDocument();
  });

  it('displays correct score tier (Poor)', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 520n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/poor/i)).toBeInTheDocument();
  });

  it('shows score visualization', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 720n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '720');
  });

  it('shows no score for new users', () => {
    mockWagmiHooks.useReadContract.mockReturnValue({
      data: 0n,
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    });
    
    render(<CreditScoreDisplay address={mockAccount} />);
    
    expect(screen.getByText(/no credit score/i)).toBeInTheDocument();
  });
});
