import { UTXO, UTXOPool, Transaction, getUTXOKey } from './types';

/**
 * A simple UTXO pool manager
 * This simulates a UTXO pool in a blockchain
 */
export class UTXOPoolManager {
  #pool: UTXOPool = {};

  /**
   * Add a UTXO to the pool
   * @param {UTXO} utxo - The UTXO to add
   */
  addUTXO(utxo: UTXO): void {
    const key = getUTXOKey(utxo.id);
    this.#pool[key] = utxo;
  }

  /**
   * Remove a UTXO from the pool
   * @param {string} txId - The transaction ID
   * @param {number} outputIndex - The output index
   * @returns {UTXO | null} The removed UTXO or null if it was not found
   */
  removeUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    const utxo = this.#pool[key];
    if (utxo) {
      delete this.#pool[key];
      return utxo;
    }
    return null;
  }

  /**
   * Get a UTXO from the pool
   * @param {string} txId - The transaction ID
   * @param {number} outputIndex - The output index
   * @returns {UTXO | null} The UTXO or null if it was not found
   */
  getUTXO(txId: string, outputIndex: number): UTXO | null {
    const key = getUTXOKey(txId, outputIndex);
    return this.#pool[key] || null;
  }

  /**
   * Get all UTXOs from the pool
   * @returns {UTXO[]} All UTXOs in the pool
   */
  getAllUTXOs(): UTXO[] {
    return Object.values(this.#pool);
  }

  /**
   * Get all UTXOs for an owner
   * @param {string} publicKey - The public key of the owner
   * @returns {UTXO[]} All UTXOs for the owner
   */
  getUTXOsForOwner(publicKey: string): UTXO[] {
    return this.getAllUTXOs().filter(utxo => utxo.recipient === publicKey);
  }

  /**
   * Get the balance of an owner
   * @param {string} publicKey - The public key of the owner
   * @returns {number} The balance of the owner
   */
  getBalance(publicKey: string): number {
    // 💡 If you're reading this, dear student, you might want to think whether this is
    // makes sense in the context of a real blockchain, where we have lots and lots of UTXOs.
    return this.getUTXOsForOwner(publicKey).reduce((total, utxo) => total + utxo.amount, 0);
  }

  /**
   * Process a transaction
   * @param {Transaction} transaction - The transaction to process
   */
  processTransaction(transaction: Transaction): void {
    for (const input of transaction.inputs) {
      this.removeUTXO(input.utxoId.txId, input.utxoId.outputIndex);
    }

    for (let i = 0; i < transaction.outputs.length; i++) {
      const output = transaction.outputs[i];
      const newUTXO: UTXO = {
        id: {
          txId: transaction.id,
          outputIndex: i
        },
        amount: output.amount,
        recipient: output.recipient
      };
      this.addUTXO(newUTXO);
    }
  }

  /**
   * Create genesis UTXOs
   * @param {Object} initialBalances - The initial balances of the owners
   */
  createGenesisUTXOs(initialBalances: { [publicKey: string]: number }): void {
    const genesisId = 'genesis';
    let outputIndex = 0;

    for (const [publicKey, amount] of Object.entries(initialBalances)) {
      const utxo: UTXO = {
        id: {
          txId: genesisId,
          outputIndex
        },
        amount,
        recipient: publicKey
      };
      this.addUTXO(utxo);
      outputIndex++;
    }
  }

  /**
   * Clone the UTXO pool manager
   * @returns {UTXOPoolManager} A new UTXO pool manager with the same UTXOs
   */
  clone(): UTXOPoolManager {
    const newManager = new UTXOPoolManager();
    newManager.#pool = { ...this.#pool };
    return newManager;
  }
}
