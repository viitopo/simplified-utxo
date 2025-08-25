import { UTXOPoolManager } from '../utxo-pool';
import { CryptoUtils, KeyPair } from '../utils/crypto';
import { TransactionBuilder } from '../transaction-builder';
import { TransactionValidatorSolution } from '../solution/transaction-validator-solution';
import { BinaryEncoderSolution } from '../solution/binary-encoding-solution';
import { Transaction, UTXO } from '../types';

describe('UTXO System Tests', () => {
  let utxoPool: UTXOPoolManager;
  let alice: KeyPair;
  let bob: KeyPair;
  let charlie: KeyPair;
  let validator: TransactionValidatorSolution;

  beforeEach(() => {
    utxoPool = new UTXOPoolManager();
    alice = CryptoUtils.generateKeyPair();
    bob = CryptoUtils.generateKeyPair();
    charlie = CryptoUtils.generateKeyPair();
    validator = new TransactionValidatorSolution(utxoPool);

    // Create initial UTXOs (genesis)
    utxoPool.createGenesisUTXOs({
      [alice.publicKey]: 1000,
      [bob.publicKey]: 500,
      [charlie.publicKey]: 250
    });
  });

  describe('Basic UTXO Operations', () => {
    test('should create genesis UTXOs correctly', () => {
      expect(utxoPool.getBalance(alice.publicKey)).toBe(1000);
      expect(utxoPool.getBalance(bob.publicKey)).toBe(500);
      expect(utxoPool.getBalance(charlie.publicKey)).toBe(250);
    });

    test('should find UTXOs for owner', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      expect(aliceUTXOs).toHaveLength(1);
      expect(aliceUTXOs[0].amount).toBe(1000);
      expect(aliceUTXOs[0].owner).toBe(alice.publicKey);
    });
  });

  describe('Transaction Validation', () => {
    test('should validate a simple valid transaction', () => {
      // Alice sends 300 to Bob
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey } // change
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject transaction with invalid signature', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: bob.privateKey }], // Wrong private key!
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid signature'))).toBe(true);
    });

    test('should reject transaction with mismatched amounts', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 800, recipient: alice.publicKey } // Too much change!
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('does not equal output amount'))).toBe(true);
    });

    test('should reject transaction using non-existent UTXO', () => {
      const fakeUTXO: UTXO = {
        txId: 'fake-tx',
        outputIndex: 0,
        amount: 1000,
        owner: alice.publicKey
      };
      
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: fakeUTXO, privateKey: alice.privateKey }],
        [{ amount: 1000, recipient: bob.publicKey }]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not found') || e.includes('spent'))).toBe(true);
    });

    test('should reject transaction with double spending', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const utxo = aliceUTXOs[0];
      
      const transaction = TransactionBuilder.createTransaction(
        [
          { utxo, privateKey: alice.privateKey },
          { utxo, privateKey: alice.privateKey } // Same UTXO twice!
        ],
        [{ amount: 2000, recipient: bob.publicKey }]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Double spending') || e.includes('multiple'))).toBe(true);
    });
  });

  describe('Multi-input Transactions', () => {
    test('should validate transaction with multiple inputs', () => {
      // Alice and Bob both send to Charlie
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const bobUTXOs = utxoPool.getUTXOsForOwner(bob.publicKey);
      
      const transaction = TransactionBuilder.createTransaction(
        [
          { utxo: aliceUTXOs[0], privateKey: alice.privateKey },
          { utxo: bobUTXOs[0], privateKey: bob.privateKey }
        ],
        [
          { amount: 1200, recipient: charlie.publicKey },
          { amount: 300, recipient: alice.publicKey } // Alice's change
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Transaction Processing', () => {
    test('should update UTXO pool after valid transaction', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      // Validate and process transaction
      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);

      utxoPool.processTransaction(transaction);

      // Check balances after transaction
      expect(utxoPool.getBalance(alice.publicKey)).toBe(700);
      expect(utxoPool.getBalance(bob.publicKey)).toBe(800); // 500 + 300
      expect(utxoPool.getBalance(charlie.publicKey)).toBe(250);
    });
  });

  describe('Sequential Transactions', () => {
    test('should handle chain of transactions', () => {
      // Transaction 1: Alice -> Bob (300)
      let aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const tx1 = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      expect(validator.validateTransaction(tx1).valid).toBe(true);
      utxoPool.processTransaction(tx1);

      // Transaction 2: Bob -> Charlie (150)
      let bobUTXOs = utxoPool.getUTXOsForOwner(bob.publicKey);
      const bobNewUTXO = bobUTXOs.find(u => u.txId === tx1.id);
      expect(bobNewUTXO).toBeDefined();

      const tx2 = TransactionBuilder.createTransaction(
        [{ utxo: bobNewUTXO!, privateKey: bob.privateKey }],
        [
          { amount: 150, recipient: charlie.publicKey },
          { amount: 150, recipient: bob.publicKey }
        ]
      );

      expect(validator.validateTransaction(tx2).valid).toBe(true);
      utxoPool.processTransaction(tx2);

      // Final balances
      expect(utxoPool.getBalance(alice.publicKey)).toBe(700);
      expect(utxoPool.getBalance(bob.publicKey)).toBe(650); // 500 - 300 + 300 - 150 + 150
      expect(utxoPool.getBalance(charlie.publicKey)).toBe(400); // 250 + 150
    });
  });

  describe('Binary Encoding (Bonus Challenge)', () => {
    test('should encode and decode transactions correctly', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const encoded = BinaryEncoderSolution.encodeTransaction(transaction);
      const decoded = BinaryEncoderSolution.decodeTransaction(encoded);

      expect(decoded).toEqual(transaction);
    });

    test('should show encoding efficiency', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 300, recipient: bob.publicKey },
          { amount: 700, recipient: alice.publicKey }
        ]
      );

      const efficiency = BinaryEncoderSolution.getEncodingEfficiency(transaction);
      
      expect(efficiency.jsonSize).toBeGreaterThan(0);
      expect(efficiency.binarySize).toBeGreaterThan(0);
      expect(efficiency.binarySize).toBeLessThan(efficiency.jsonSize);
      expect(efficiency.savings).toMatch(/^\d+\.\d+%$/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero-amount outputs gracefully', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [
          { amount: 0, recipient: bob.publicKey },
          { amount: 1000, recipient: alice.publicKey }
        ]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
    });

    test('should handle transaction with no change', () => {
      const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
      const transaction = TransactionBuilder.createTransaction(
        [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
        [{ amount: 1000, recipient: bob.publicKey }]
      );

      const result = validator.validateTransaction(transaction);
      expect(result.valid).toBe(true);
    });
  });
});