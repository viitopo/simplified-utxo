import { UTXOPoolManager } from '../utxo-pool';
import { CryptoUtils, KeyPair } from '../utils/crypto';
import { TransactionBuilder } from '../transaction-builder';
import { TransactionValidator } from '../transaction-validator';
import { BinaryEncoder } from '../utils/binary-encoding';
import { Transaction, UTXO } from '../types';

// These tests will fail initially because students need to implement the validation logic
describe('Student Assignment Tests', () => {
  let utxoPool: UTXOPoolManager;
  let alice: KeyPair;
  let bob: KeyPair;
  let charlie: KeyPair;
  let validator: TransactionValidator;

  beforeEach(() => {
    utxoPool = new UTXOPoolManager();
    alice = CryptoUtils.generateKeyPair();
    bob = CryptoUtils.generateKeyPair();
    charlie = CryptoUtils.generateKeyPair();
    validator = new TransactionValidator(utxoPool);

    // Create initial UTXOs
    utxoPool.createGenesisUTXOs({
      [alice.publicKey]: 1000,
      [bob.publicKey]: 500,
      [charlie.publicKey]: 250
    });
  });

  describe('Core Assignment: Transaction Validation', () => {
    test('REQUIRED: should validate a simple transaction correctly', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('REQUIRED: should reject transaction with invalid signature', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: bob.privateKey }], // Wrong key!
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('signature'))).toBe(true);
    });

    test('REQUIRED: should reject transaction with unbalanced amounts', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 800, recipient: alice.publicKey } // Total: 1100 > 1000 input
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('amount'))).toBe(true);
    });

    test('REQUIRED: should reject transaction using non-existent UTXO', () => {
      const fakeUTXO: UTXO = {
        txId: 'non-existent',
        outputIndex: 0,
        amount: 500,
        owner: alice.publicKey
      };
      
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: fakeUTXO, privateKey: alice.privateKey }],
        [{ amount: 500, recipient: bob.publicKey }]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not found') || e.includes('spent'))).toBe(true);
    });

    test('REQUIRED: should reject double spending in same transaction', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const utxo = aliceUTXOs[0];
      
      const transaction = TransactionBuilder.createTransaction(
        [
          { utxo, privateKey: alice.privateKey },
          { utxo, privateKey: alice.privateKey } // Same UTXO used twice
        ],
        [{ amount: 2000, recipient: bob.publicKey }]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('double') || e.includes('multiple'))).toBe(true);
    });

    test('CHALLENGE: should validate multi-input transaction', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const bobUTXOs = utxoPool.getUTXOsForOwner(bob.publicKey);
      
      const transaction = TransactionBuilder.createTransaction(
        [
          { utxo: aliceUTXOs[0], privateKey: alice.privateKey },
          { utxo: bobUTXOs[0], privateKey: bob.privateKey }
        ],
        [
          { amount: 1000, recipient: charlie.publicKey },
          { amount: 500, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Bonus Challenge: Binary Encoding', () => {
    test('BONUS: should implement binary encoding', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      // This will throw an error until students implement it
      expect(() => BinaryEncoder.encodeTransaction(transaction)).toThrow('not implemented');
    });

    test('BONUS: should show encoding efficiency when implemented', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const efficiency = BinaryEncoder.getEncodingEfficiency(transaction);
      expect(efficiency.savings).toBe('Not implemented');
    });
  });

  describe('Integration Tests', () => {
    test('INTEGRATION: complete transaction flow', () => {
      // Step 1: Validate transaction
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 400, recipient: bob.publicKey },
          { amount: 600, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);

      // Step 2: Process transaction
      utxoPool.processTransaction(transaction);

      // Step 3: Verify final state
      expect(utxoPool.getBalance(alice.publicKey)).toBe(600);
      expect(utxoPool.getBalance(bob.publicKey)).toBe(900); // 500 + 400
    });

    test('INTEGRATION: sequential transactions', () => {
      // First transaction
      let aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const tx1 = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 200, recipient: bob.publicKey },
          { amount: 800, recipient: alice.publicKey }
        ]
      );

      expect(validator.validateTransaction(tx1).valid).toBe(true);
      utxoPool.processTransaction(tx1);

      // Second transaction using output from first
      aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const aliceNewUTXO = aliceUTXOs.find(u => u.txId === tx1.id);
      expect(aliceNewUTXO).toBeDefined();

      const tx2 = TransactionBuilder.createTransaction(
        [{ utxo: aliceNewUTXO!, privateKey: alice.privateKey }],
        [{ amount: 800, recipient: charlie.publicKey }]
      );

      expect(validator.validateTransaction(tx2).valid).toBe(true);
      utxoPool.processTransaction(tx2);

      // Final balances
      expect(utxoPool.getBalance(alice.publicKey)).toBe(0);
      expect(utxoPool.getBalance(bob.publicKey)).toBe(700); // 500 + 200
      expect(utxoPool.getBalance(charlie.publicKey)).toBe(1050); // 250 + 800
    });
  });
});