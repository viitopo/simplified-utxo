import { Transaction, TransactionInput, TransactionOutput, UTXO } from './types';
import { CryptoUtils } from './utils/crypto';
import { v4 as uuidv4 } from 'uuid';

export class TransactionBuilder {
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
        utxoRef: {
          txId: input.utxo.txId,
          outputIndex: input.utxo.outputIndex
        }
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    const transactionData = JSON.stringify(unsignedTx);

    // Sign each input
    transaction.inputs = inputs.map(input => {
      const signature = CryptoUtils.sign(transactionData, input.privateKey);
      return {
        utxoRef: {
          txId: input.utxo.txId,
          outputIndex: input.utxo.outputIndex
        },
        signature
      };
    });

    return transaction;
  }
}