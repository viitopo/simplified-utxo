/**
 * A UTXO ID is a unique identifier for a UTXO.
 * It is a combination of a transaction ID and an output index.
 */
export interface UtxoId {
  txId: string;
  outputIndex: number;
}

export interface TransactionInput {
  utxoId: UtxoId;
  owner: string; // public key of the UTXO owner
  signature: string;
}

export interface TransactionOutput {
  amount: number;
  recipient: string; // public key of the recipient
}

/**
 * Importantly, the ID is stored AFTER the transaction is processed.
 * This is because the ID is not known until the transaction is processed, and we would be creating
 * a circular dependency.
 */
export interface UTXO extends TransactionOutput {
  id: UtxoId;
}

export interface Transaction {
  id: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  timestamp: number;
}

export interface UTXOPool {
  [key: string]: UTXO;
}

export function getUTXOKey(utxoId: UtxoId): string;
export function getUTXOKey(txId: string, outputIndex: number): string;
export function getUTXOKey(utxoIdOrTxId: UtxoId | string, outputIndex?: number): string {
  if (typeof utxoIdOrTxId === 'string') {
    return `${utxoIdOrTxId}:${outputIndex}`;
  }
  return `${utxoIdOrTxId.txId}:${utxoIdOrTxId.outputIndex}`;
}
