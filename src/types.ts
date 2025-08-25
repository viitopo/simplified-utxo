export interface UTXO {
  txId: string;
  outputIndex: number;
  amount: number;
  owner: string; // public key of the owner
}

export interface TransactionInput {
  utxoRef: {
    txId: string;
    outputIndex: number;
  };
  signature: string;
}

export interface TransactionOutput {
  amount: number;
  recipient: string; // public key of the recipient
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

export function getUTXOKey(txId: string, outputIndex: number): string {
  return `${txId}:${outputIndex}`;
}