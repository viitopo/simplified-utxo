import {Transaction, TransactionInput, UTXO} from './types';
import { UTXOPoolManager } from './utxo-pool';
import { verify } from './utils/crypto';
import {
  ValidationResult,
  ValidationError,
  VALIDATION_ERRORS,
  createValidationError
} from './errors';

export class TransactionValidator {
  constructor(private utxoPool: UTXOPoolManager) {}

  /**
   * Validate a transaction
   * @param {Transaction} transaction - The transaction to validate
   * @returns {ValidationResult} The validation result
   */
  validateTransaction(transaction: Transaction): ValidationResult {
    const errors: ValidationError[] = [];
    
      let datosTransaccion = this.createTransactionDataForSigning_(transaction);

      let inputs = transaction.inputs;
      let outputs = transaction.outputs;
      
      let sumaImputs = 0;
      let sumaOutputs = 0;
      
      let utxoInputs : UTXO[]  = [] ;
      
      inputs.forEach(input => {
          const utxo = this.utxoPool.getUTXO(input.utxoId.txId, input.utxoId.outputIndex);
          
          let utxoDuplicado = false;

          if (!utxo) {
              let error = createValidationError("UTXO_NOT_FOUND", `UTXO not found: ${input.utxoId.txId}:${input.utxoId.outputIndex}`)
              errors.push(error);
          }
          else {
              sumaImputs += utxo.amount;
              
              utxoDuplicado = utxoInputs.includes(utxo);

              if(utxoDuplicado){
                  let error = createValidationError("DOUBLE_SPENDING", `UTXO already used: ${utxo?.id}`)
                  errors.push(error);
              }
              else utxoInputs.push(utxo);

              const firmaPropietarioValida = verify(datosTransaccion, input.signature, utxo.recipient);

              if(!firmaPropietarioValida){
                  let error = createValidationError("INVALID_SIGNATURE", `UTXO signature does not match the owner: ${input.signature}:${input.owner}`)
                  errors.push(error);
              }
          }          
      })
      
      outputs.forEach(output => {
          sumaOutputs += output.amount;
          
          let valorCero = output.amount == 0;
          let valorNegativo = output.amount < 0;
          
          if(valorCero || valorNegativo){
              let error = createValidationError("NEGATIVE_AMOUNT", `Amount of output transaction is cero`)
              errors.push(error);
          }
      })

      if (sumaImputs != sumaOutputs) {
          let error = createValidationError("AMOUNT_MISMATCH", `Balance not equal: ${sumaImputs}:${sumaOutputs}`)
          errors.push(error);
      }
      
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a deterministic string representation of the transaction for signing
   * This excludes the signatures to prevent circular dependencies
   * @param {Transaction} transaction - The transaction to create a data for signing
   * @returns {string} The string representation of the transaction for signing
   */
  private createTransactionDataForSigning_(transaction: Transaction): string {
    const unsignedTx = {
      id: transaction.id,
      inputs: transaction.inputs.map(input => ({
        utxoId: input.utxoId,
        owner: input.owner
      })),
      outputs: transaction.outputs,
      timestamp: transaction.timestamp
    };

    return JSON.stringify(unsignedTx);
  }
}
