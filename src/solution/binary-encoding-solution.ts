import { Transaction, TransactionInput, TransactionOutput } from '../types';

export class BinaryEncoderSolution {
  static encodeTransaction(transaction: Transaction): Buffer {
    const buffers: Buffer[] = [];

    // Transaction ID (length-prefixed string)
    const idBuffer = Buffer.from(transaction.id, 'utf8');
    buffers.push(Buffer.from([idBuffer.length]));
    buffers.push(idBuffer);

    // Timestamp (8 bytes)
    const timestampBuffer = Buffer.allocUnsafe(8);
    timestampBuffer.writeBigUInt64BE(BigInt(transaction.timestamp));
    buffers.push(timestampBuffer);

    // Number of inputs (1 byte)
    buffers.push(Buffer.from([transaction.inputs.length]));

    // Encode inputs
    for (const input of transaction.inputs) {
      // UTXO reference txId (length-prefixed string)
      const txIdBuffer = Buffer.from(input.utxoRef.txId, 'utf8');
      buffers.push(Buffer.from([txIdBuffer.length]));
      buffers.push(txIdBuffer);

      // Output index (4 bytes)
      const indexBuffer = Buffer.allocUnsafe(4);
      indexBuffer.writeUInt32BE(input.utxoRef.outputIndex);
      buffers.push(indexBuffer);

      // Signature (length-prefixed string)
      const sigBuffer = Buffer.from(input.signature, 'hex');
      const sigLengthBuffer = Buffer.allocUnsafe(2);
      sigLengthBuffer.writeUInt16BE(sigBuffer.length);
      buffers.push(sigLengthBuffer);
      buffers.push(sigBuffer);
    }

    // Number of outputs (1 byte)
    buffers.push(Buffer.from([transaction.outputs.length]));

    // Encode outputs
    for (const output of transaction.outputs) {
      // Amount (8 bytes)
      const amountBuffer = Buffer.allocUnsafe(8);
      amountBuffer.writeBigUInt64BE(BigInt(output.amount));
      buffers.push(amountBuffer);

      // Recipient public key (length-prefixed string)
      const recipientBuffer = Buffer.from(output.recipient, 'utf8');
      const recipientLengthBuffer = Buffer.allocUnsafe(2);
      recipientLengthBuffer.writeUInt16BE(recipientBuffer.length);
      buffers.push(recipientLengthBuffer);
      buffers.push(recipientBuffer);
    }

    return Buffer.concat(buffers);
  }

  static decodeTransaction(buffer: Buffer): Transaction {
    let offset = 0;

    // Transaction ID
    const idLength = buffer.readUInt8(offset);
    offset += 1;
    const id = buffer.subarray(offset, offset + idLength).toString('utf8');
    offset += idLength;

    // Timestamp
    const timestamp = Number(buffer.readBigUInt64BE(offset));
    offset += 8;

    // Number of inputs
    const inputCount = buffer.readUInt8(offset);
    offset += 1;

    // Decode inputs
    const inputs: TransactionInput[] = [];
    for (let i = 0; i < inputCount; i++) {
      // UTXO reference txId
      const txIdLength = buffer.readUInt8(offset);
      offset += 1;
      const txId = buffer.subarray(offset, offset + txIdLength).toString('utf8');
      offset += txIdLength;

      // Output index
      const outputIndex = buffer.readUInt32BE(offset);
      offset += 4;

      // Signature
      const sigLength = buffer.readUInt16BE(offset);
      offset += 2;
      const signature = buffer.subarray(offset, offset + sigLength).toString('hex');
      offset += sigLength;

      inputs.push({
        utxoRef: { txId, outputIndex },
        signature
      });
    }

    // Number of outputs
    const outputCount = buffer.readUInt8(offset);
    offset += 1;

    // Decode outputs
    const outputs: TransactionOutput[] = [];
    for (let i = 0; i < outputCount; i++) {
      // Amount
      const amount = Number(buffer.readBigUInt64BE(offset));
      offset += 8;

      // Recipient public key
      const recipientLength = buffer.readUInt16BE(offset);
      offset += 2;
      const recipient = buffer.subarray(offset, offset + recipientLength).toString('utf8');
      offset += recipientLength;

      outputs.push({ amount, recipient });
    }

    return { id, inputs, outputs, timestamp };
  }

  static getEncodingEfficiency(transaction: Transaction): { jsonSize: number; binarySize: number; savings: string } {
    const jsonSize = Buffer.from(JSON.stringify(transaction)).length;
    const binarySize = this.encodeTransaction(transaction).length;
    const savingsPercent = ((jsonSize - binarySize) / jsonSize * 100).toFixed(1);
    
    return {
      jsonSize,
      binarySize,
      savings: `${savingsPercent}%`
    };
  }
}