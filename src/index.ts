import { UTXOPoolManager } from './utxo-pool';
import { CryptoUtils } from './utils/crypto';
import { TransactionBuilder } from './transaction-builder';
import { TransactionValidatorSolution } from './solution/transaction-validator-solution';

// Demo script showing the UTXO system in action
function main() {
  console.log('🚀 Simplified UTXO System Demo\n');

  // Generate key pairs for our users
  const alice = CryptoUtils.generateKeyPair();
  const bob = CryptoUtils.generateKeyPair();
  const charlie = CryptoUtils.generateKeyPair();

  console.log('👥 Generated key pairs for Alice, Bob, and Charlie');
  
  // Create UTXO pool and initialize with genesis UTXOs
  const utxoPool = new UTXOPoolManager();
  utxoPool.createGenesisUTXOs({
    [alice.publicKey]: 1000,
    [bob.publicKey]: 500,
    [charlie.publicKey]: 250
  });

  console.log('\n💰 Initial balances:');
  console.log(`Alice: ${utxoPool.getBalance(alice.publicKey)}`);
  console.log(`Bob: ${utxoPool.getBalance(bob.publicKey)}`);
  console.log(`Charlie: ${utxoPool.getBalance(charlie.publicKey)}`);

  // Create validator (using solution for demo)
  const validator = new TransactionValidatorSolution(utxoPool);

  // Transaction 1: Alice sends 300 to Bob
  console.log('\n📝 Transaction 1: Alice sends 300 to Bob');
  const aliceUTXOs = utxoPool.getUTXOsForOwner(alice.publicKey);
  const tx1 = TransactionBuilder.createTransaction(
    [{ utxo: aliceUTXOs[0], privateKey: alice.privateKey }],
    [
      { amount: 300, recipient: bob.publicKey },
      { amount: 700, recipient: alice.publicKey } // change
    ]
  );

  const result1 = validator.validateTransaction(tx1);
  console.log(`Validation result: ${result1.valid ? '✅ Valid' : '❌ Invalid'}`);
  if (result1.errors.length > 0) {
    console.log('Errors:', result1.errors);
  }

  if (result1.valid) {
    utxoPool.processTransaction(tx1);
    console.log('Transaction processed successfully');
  }

  // Transaction 2: Bob sends 150 to Charlie
  console.log('\n📝 Transaction 2: Bob sends 150 to Charlie');
  const bobUTXOs = utxoPool.getUTXOsForOwner(bob.publicKey);
  const bobNewUTXO = bobUTXOs.find(u => u.txId === tx1.id);
  
  if (bobNewUTXO) {
    const tx2 = TransactionBuilder.createTransaction(
      [{ utxo: bobNewUTXO, privateKey: bob.privateKey }],
      [
        { amount: 150, recipient: charlie.publicKey },
        { amount: 150, recipient: bob.publicKey } // change
      ]
    );

    const result2 = validator.validateTransaction(tx2);
    console.log(`Validation result: ${result2.valid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (result2.valid) {
      utxoPool.processTransaction(tx2);
      console.log('Transaction processed successfully');
    }
  }

  // Final balances
  console.log('\n💰 Final balances:');
  console.log(`Alice: ${utxoPool.getBalance(alice.publicKey)}`);
  console.log(`Bob: ${utxoPool.getBalance(bob.publicKey)}`);
  console.log(`Charlie: ${utxoPool.getBalance(charlie.publicKey)}`);

  console.log('\n🎯 Demo completed! Run tests with: npm test');
}

if (require.main === module) {
  main();
}