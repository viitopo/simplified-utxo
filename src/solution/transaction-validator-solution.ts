import { Transaction, TransactionInput } from '../types';
import { UTXOPoolManager } from '../utxo-pool';
import { CryptoUtils } from '../utils/crypto';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class TransactionValidatorSolution {
  constructor(private utxoPool: UTXOPoolManager) {}

  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: string[] = [];

    // 1. Check that all input UTXOs exist and are unspent
    const inputUTXOs = [];
    for (const input of transaction.inputs) {
      const utxo = this.utxoPool.getUTXO(input.utxoRef.txId, input.utxoRef.outputIndex);
      if (!utxo) {
        errors.push(`UTXO ${input.utxoRef.txId}:${input.utxoRef.outputIndex} not found or already spent`);
      } else {
        inputUTXOs.push(utxo);
      }
    }

    // 2. Check that the total input amount equals total output amount
    if (inputUTXOs.length > 0) {
      const totalInputAmount = inputUTXOs.reduce((sum, utxo) => sum + utxo.amount, 0);
      const totalOutputAmount = transaction.outputs.reduce((sum, output) => sum + output.amount, 0);
      
      if (totalInputAmount !== totalOutputAmount) {
        errors.push(`Input amount (${totalInputAmount}) does not equal output amount (${totalOutputAmount})`);
      }
    }

    // 3. Check that each input is properly signed by the UTXO owner
    const transactionData = this.createTransactionDataForSigning(transaction);
    for (let i = 0; i < transaction.inputs.length; i++) {
      const input = transaction.inputs[i];
      const utxo = inputUTXOs[i];
      
      if (utxo) {
        const isValidSignature = CryptoUtils.verify(
          transactionData,
          input.signature,
          utxo.owner
        );
        
        if (!isValidSignature) {
          errors.push(`Invalid signature for input ${i} (UTXO ${input.utxoRef.txId}:${input.utxoRef.outputIndex})`);
        }
      }
    }

    // 4. Check that no UTXO is used twice in the same transaction
    const usedUTXOs = new Set<string>();
    for (const input of transaction.inputs) {
      const utxoKey = `${input.utxoRef.txId}:${input.utxoRef.outputIndex}`;
      if (usedUTXOs.has(utxoKey)) {
        errors.push(`Double spending detected: UTXO ${utxoKey} is used multiple times`);
      }
      usedUTXOs.add(utxoKey);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private createTransactionDataForSigning(transaction: Transaction): string {
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