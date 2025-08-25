import { Transaction, TransactionInput } from './types';
import { UTXOPoolManager } from './utxo-pool';
import { CryptoUtils } from './utils/crypto';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class TransactionValidator {
  constructor(private utxoPool: UTXOPoolManager) {}

  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: string[] = [];

    // TODO: Implement validation
    
    // 1. Check that all input UTXOs exist and are unspent
    // Hint: Use this.utxoPool.getUTXO(txId, outputIndex)
    
    // 2. Check that the total input amount equals total output amount (no inflation/deflation)
    // Hint: Calculate sum of input amounts and sum of output amounts
    
    // 3. Check that each input is properly signed by the UTXO owner
    // Hint: Use CryptoUtils.verify() to check signatures
    //       The signature should be over the transaction data (without signatures)
    
    // 4. Check that no UTXO is used twice in the same transaction
    // Hint: Check for duplicate input references
    
    // STUDENT ASSIGNMENT: Implement the validation logic above
    // Remove this line and implement the actual validation
    throw new Error('Transaction validation not implemented - this is your assignment!');

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a deterministic string representation of the transaction for signing
   * This excludes the signatures to prevent circular dependencies
   * @param {Transaction} transaction - The transaction to create a data for signing
   * @returns {string} The string representation of the transaction for signing
   */
  private createTransactionDataForSigning_(transaction: Transaction): string {
    const unsignedTx = {
      id: transaction.id,
      inputs: transaction.inputs.map(input => ({
        utxoRef: input.utxoRef
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };
    
    return JSON.stringify(unsignedTx);
  }
}