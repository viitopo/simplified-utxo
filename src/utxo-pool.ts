import { UTXO, UTXOPool, Transaction, getUTXOKey } from './types';

export class UTXOPoolManager {
  private pool: UTXOPool = {};

  addUTXO(utxo: UTXO): void {
    const key = getUTXOKey(utxo.txId, utxo.outputIndex);
    this.pool[key] = utxo;
  }

  removeUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    const utxo = this.pool[key];
    if (utxo) {
      delete this.pool[key];
      return utxo;
    }
    return null;
  }

  getUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    return this.pool[key] || null;
  }

  getAllUTXOs(): UTXO[] {
    return Object.values(this.pool);
  }

  getUTXOsForOwner(publicKey: string): UTXO[] {
    return this.getAllUTXOs().filter(utxo => utxo.owner === publicKey);
  }

  getBalance(publicKey: string): number {
    return this.getUTXOsForOwner(publicKey)
      .reduce((total, utxo) => total + utxo.amount, 0);
  }

  processTransaction(transaction: Transaction): void {
    for (const input of transaction.inputs) {
      this.removeUTXO(input.utxoRef.txId, input.utxoRef.outputIndex);
    }

    for (let i = 0; i < transaction.outputs.length; i++) {
      const output = transaction.outputs[i];
      const newUTXO: UTXO = {
        txId: transaction.id,
        outputIndex: i,
        amount: output.amount,
        owner: output.recipient
      };
      this.addUTXO(newUTXO);
    }
  }

  createGenesisUTXOs(initialBalances: { [publicKey: string]: number }): void {
    const genesisId = 'genesis';
    let outputIndex = 0;

    for (const [publicKey, amount] of Object.entries(initialBalances)) {
      const utxo: UTXO = {
        txId: genesisId,
        outputIndex,
        amount,
        owner: publicKey
      };
      this.addUTXO(utxo);
      outputIndex++;
    }
  }

  clone(): UTXOPoolManager {
    const newManager = new UTXOPoolManager();
    newManager.pool = { ...this.pool };
    return newManager;
  }
}