/**
 * Transaction Guard
 * 
 * Provides utilities to simulate and validate transactions before sending them to the network.
 * Helps prevent user errors and potential attacks.
 */

import { parseEther, formatEther } from 'viem';
import type { Address, PublicClient } from 'viem';

export interface TransactionPreview {
  to: Address;
  value: bigint;
  data?: `0x${string}`;
  estimatedGas: bigint;
  estimatedCost: bigint;
  humanReadable: {
    action: string;
    amount?: string;
    recipient?: Address;
    warnings: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class TransactionGuard {
  constructor(private publicClient: PublicClient) {}

  /**
   * Simulate a transaction before sending
   */
  async simulateTransaction(params: {
    from: Address;
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }): Promise<TransactionPreview> {
    const { from, to, value = 0n, data } = params;

    // Estimate gas
    const estimatedGas = await this.publicClient.estimateGas({
      account: from,
      to,
      value,
      data,
    });

    // Get gas price
    const gasPrice = await this.publicClient.getGasPrice();
    const estimatedCost = estimatedGas * gasPrice;

    // Parse transaction data to human-readable
    const humanReadable = await this.parseTransactionData(to, value, data);

    // Check for warnings
    const warnings = this.checkWarnings({ from, to, value, data });

    return {
      to,
      value,
      data,
      estimatedGas,
      estimatedCost,
      humanReadable: {
        ...humanReadable,
        warnings,
      },
    };
  }

  /**
   * Validate transaction parameters
   */
  async validateTransaction(params: {
    from: Address;
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }): Promise<ValidationResult> {
    const { from, to, value = 0n, data } = params;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check: To address is not zero
    if (to === '0x0000000000000000000000000000000000000000') {
      errors.push('Cannot send to zero address');
    }

    // Check: From address has sufficient balance
    const balance = await this.publicClient.getBalance({ address: from });
    if (balance < value) {
      errors.push(`Insufficient balance. Have: ${formatEther(balance)}, Need: ${formatEther(value)}`);
    }

    // Check: Contract exists at to address (if not sending value)
    if (data && value === 0n) {
      const code = await this.publicClient.getBytecode({ address: to });
      if (!code || code === '0x') {
        errors.push('No contract found at address');
      }
    }

    // Warning: Large value transfer
    if (value > parseEther('1000')) {
      warnings.push('Large transfer amount (>1000 tokens)');
    }

    // Warning: Unusual data length
    if (data && data.length > 10000) {
      warnings.push('Transaction data is unusually large');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse transaction data to human-readable format
   */
  private async parseTransactionData(
    to: Address,
    value: bigint,
    data?: `0x${string}`
  ): Promise<{ action: string; amount?: string; recipient?: Address }> {
    if (!data || data === '0x') {
      return {
        action: 'Transfer',
        amount: formatEther(value),
        recipient: to,
      };
    }

    // Try to decode common function signatures
    const signature = data.slice(0, 10);
    
    const knownSignatures: Record<string, string> = {
      '0xa9059cbb': 'Transfer ERC20',
      '0x095ea7b3': 'Approve ERC20',
      '0x23b872dd': 'Transfer From ERC20',
      '0xb6b55f25': 'Deposit',
      '0x2e1a7d4d': 'Withdraw',
      '0x1249c58b': 'Mint',
      '0x42842e0e': 'Safe Transfer From',
    };

    const action = knownSignatures[signature] || 'Contract Interaction';

    // Try to decode amount from common patterns
    let amount: string | undefined;
    if (data.length >= 74) {
      try {
        // ERC20 transfer/approve typically has amount at bytes 4-36
        const amountHex = '0x' + data.slice(74);
        const amountBigInt = BigInt(amountHex);
        amount = formatEther(amountBigInt);
      } catch {
        // Failed to parse amount
      }
    }

    return { action, amount };
  }

  /**
   * Check for common warning conditions
   */
  private checkWarnings(params: {
    from: Address;
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }): string[] {
    const warnings: string[] = [];
    const { to, value = 0n, data } = params;

    // Warning: Sending to contract with value
    if (value > 0n && data && data !== '0x') {
      warnings.push('Sending value to contract function call');
    }

    // Warning: Interacting with unverified contract
    // (In production, check against verified contract list)
    if (!this.isKnownContract(to)) {
      warnings.push('Interacting with unverified contract');
    }

    return warnings;
  }

  /**
   * Check if address is a known/verified contract
   */
  private isKnownContract(address: Address): boolean {
    // In production, maintain a list of verified contracts
    const knownContracts = new Set([
      process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS?.toLowerCase(),
      process.env.NEXT_PUBLIC_LOAN_MANAGER_ADDRESS?.toLowerCase(),
      process.env.NEXT_PUBLIC_LENDING_CIRCLE_ADDRESS?.toLowerCase(),
    ]);

    return knownContracts.has(address.toLowerCase());
  }

  /**
   * Format transaction preview for display
   */
  formatPreview(preview: TransactionPreview): string {
    const { humanReadable, estimatedGas, estimatedCost } = preview;
    
    let message = `Action: ${humanReadable.action}\n`;
    
    if (humanReadable.amount) {
      message += `Amount: ${humanReadable.amount} tokens\n`;
    }
    
    if (humanReadable.recipient) {
      message += `To: ${humanReadable.recipient}\n`;
    }
    
    message += `\nEstimated Gas: ${estimatedGas.toString()}\n`;
    message += `Estimated Cost: ${formatEther(estimatedCost)} CELO\n`;
    
    if (humanReadable.warnings.length > 0) {
      message += `\n⚠️ Warnings:\n`;
      humanReadable.warnings.forEach(w => {
        message += `  - ${w}\n`;
      });
    }
    
    return message;
  }
}

/**
 * Transaction confirmation dialog helper
 */
export class TransactionConfirmation {
  static async confirm(preview: TransactionPreview): Promise<boolean> {
    const guard = new TransactionGuard(undefined as any);
    const message = guard.formatPreview(preview);
    
    return window.confirm(
      `Please confirm this transaction:\n\n${message}\n\nContinue?`
    );
  }

  static showWarning(warnings: string[]): void {
    if (warnings.length > 0) {
      alert(
        `⚠️ Transaction Warnings:\n\n${warnings.map(w => `• ${w}`).join('\n')}\n\n` +
        `Please review carefully before proceeding.`
      );
    }
  }
}

/**
 * Hook for using transaction guard in React components
 */
export function useTransactionGuard() {
  // This would integrate with wagmi/viem hooks
  // For now, providing basic functionality
  
  const simulateAndConfirm = async (params: {
    from: Address;
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }): Promise<boolean> => {
    // In production, get publicClient from wagmi
    // const publicClient = usePublicClient();
    // const guard = new TransactionGuard(publicClient);
    
    // For now, just validate basics
    if (params.to === '0x0000000000000000000000000000000000000000') {
      alert('Error: Cannot send to zero address');
      return false;
    }
    
    // Show confirmation
    return window.confirm(
      `Confirm transaction to ${params.to}?\n\n` +
      `Amount: ${params.value ? formatEther(params.value) : '0'} tokens`
    );
  };

  return {
    simulateAndConfirm,
  };
}
