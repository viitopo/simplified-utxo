import { Transaction, TransactionInput, TransactionOutput, UTXO } from './types';
import { sign } from './utils/crypto';
import { v4 as uuidv4 } from 'uuid';

export class TransactionBuilder {
  /**
   * Create a new transaction
   * @param {UTXO[]} inputs - The UTXOs to use as inputs
   * @param {TransactionOutput[]} outputs - The outputs of the transaction
   * @returns {Transaction} The new transaction
   */
  static createTransaction(
    inputs: { utxo: UTXO; privateKey: string }[],
    outputs: TransactionOutput[]
  ): Transaction {
    const transaction: Transaction = {
      id: uuidv4(),
      inputs: [],
      outputs,
      timestamp: Date.now()
    };

    // Create unsigned transaction data for signing
    const unsignedTx = {
      id: transaction.id,
      inputs: inputs.map(input => ({
        utxoId: input.utxo.id,
        owner: input.utxo.recipient
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    const transactionData = JSON.stringify(unsignedTx);

    // Sign each input
    transaction.inputs = inputs.map(input => {
      const signature = sign(transactionData, input.privateKey);
      return {
        utxoId: input.utxo.id,
        owner: input.utxo.recipient,
        signature
      };
    });

    return transaction;
  }
}
