# Taller de Tecnologías II: Implementación UTXO Simplificada

## Descripción de la Tarea

En esta tarea, deberás a implementar la lógica de validación central para un sistema de criptomonedas simplificado basado en UTXO (Unspent Transaction Outputs). Esta tarea se enfoca en los conceptos fundamentales del procesamiento de transacciones blockchain sin perderse en detalles de implementación criptográfica.

## Objetivos de Aprendizaje

Al completar esta asignación, vas a:

1. **Comprender el Modelo UTXO**: Aprender cómo funcionan las transacciones estilo Bitcoin usando el modelo UTXO
2. **Implementar Validación de Transacciones**: Construir la lógica central que asegura la integridad de las transacciones
3. **Trabajar con Firmas Digitales**: Usar firmas criptográficas para probar autorización de transacciones
4. **Gestionar Transiciones de Estado**: Rastrear cómo el procesamiento de transacciones cambia el estado del sistema
5. **Optimizar Representación de Datos**: Explorar codificación binaria para transacciones eficientes en espacio (bonus)

## Tareas de la Asignación

### Tarea 1: Implementar Validación de Transacciones (Requerido)

Tu tarea principal es completar el método `validateTransaction` en `src/transaction-validator.ts`.

#### Reglas de Validación a Implementar:

1. **Verificación de Existencia de UTXO**
   - Verificar que todas las entradas de transacción referencien UTXOs existentes y no gastados
   - Usar `this.utxoPool.getUTXO(txId, outputIndex)` para verificar existencia

2. **Verificación de Balance**
   - Asegurar que la suma de montos de entrada igualen la suma de montos de salida
   - No se debe crear o destruir dinero (excepto a través de minería, que no estamos implementando)

3. **Verificación de Firma**
   - Verificar que cada entrada esté firmada por el propietario del UTXO correspondiente
   - Usar `CryptoUtils.verify(data, signature, publicKey)` para verificación
   - Firmar los datos de transacción SIN las firmas (para evitar dependencias circulares)

4. **Prevención de Doble Gasto**
   - Asegurar que ningún UTXO sea referenciado múltiples veces dentro de la misma transacción
   - Rastrear referencias UTXO usadas y detectar duplicados

#### Pistas de Implementación:

```typescript
// Ejemplo de verificación de existencia de UTXO
const utxo = this.utxoPool.getUTXO(input.utxoRef.txId, input.utxoRef.outputIndex);
if (!utxo) {
  errors.push(`UTXO not found: ${input.utxoRef.txId}:${input.utxoRef.outputIndex}`);
}

// Ejemplo de verificación de firma
const transactionData = this.createTransactionDataForSigning(transaction);
const isValid = CryptoUtils.verify(transactionData, input.signature, utxo.owner);
```

### Tarea 2: Desafío de Codificación Binaria (Bonus)

Si completás la asignación principal, implementá codificación binaria en `src/utils/binary-encoding.ts`:

1. **Método Encode**: Convertir objetos Transaction a representación binaria compacta
2. **Método Decode**: Reconstruir objetos Transaction desde datos binarios
3. **Análisis de Eficiencia**: Comparar tamaños de representación binaria vs JSON

#### Estrategia de Codificación:
- Usar campos de tamaño fijo para números (8 bytes para montos, timestamps)
- Usar strings con longitud prefijada para datos de longitud variable
- Minimizar relleno y espacio no usado

## Criterios de Calificación

### Requerido (80% de la calificación):
- [ ] Todos los UTXOs de entrada existen y no están gastados
- [ ] El monto total de entrada iguala al monto total de salida
- [ ] Todas las firmas son válidas
- [ ] No hay doble gasto dentro de las transacciones
- [ ] Todas las pruebas requeridas pasan
- [ ] El código está limpio y bien comentado

### Bonus (20% adicional):
- [ ] Codificación/decodificación binaria implementada correctamente
- [ ] Ahorros significativos de espacio demostrados
- [ ] Casos extremos adicionales manejados
- [ ] Optimizaciones de rendimiento

## Probando Tu Implementación

### Ejecutar Todas las Pruebas
```bash
npm test
```

### Modo Observación (Recomendado)
```bash
npm run test:watch
```

### Ver Detalles Completos de las Pruebas
```bash
npm run test:verbose
```

## Entregables de la Tarea

1. **`transaction-validator.ts` completado** con toda la lógica de validación implementada
2. **Opcional: `binary-encoding.ts` completado** para puntos extra
3. **Todas las pruebas requeridas pasando**
4. **Breve explicación escrita** (2-3 párrafos) de tu enfoque y cualquier desafío enfrentado

## Recursos Proporcionados

- **Utilidades criptográficas**: Funciones de generación de claves, firmado y verificación
- **Gestión de pool UTXO**: Almacenamiento y recuperación en memoria de UTXOs
- **Constructor de transacciones**: Ayudante para crear transacciones correctamente firmadas
- **Suite de pruebas comprensiva**: Pruebas que especifican requisitos exactos
- **Implementación de referencia**: Solución completa para orientación (¡tratá de implementar vos mismo primero!)

## Pautas de Entrega

1. **Calidad de Código**: Escribir código limpio y legible con nombres de variables significativos
2. **Comentarios**: Explicar lógica compleja y pasos de validación
3. **Pruebas**: Asegurar que todas las pruebas requeridas pasen antes de la entrega
4. **Documentación**: Incluir breve explicación de tu enfoque

## Integridad Académica

- Implementar la lógica central vos mismo (intentar no usar AI, o lo mínimo posible)
- Podés discutir conceptos con compañeros de clase, pero escribí tu propio código
- Usar las utilidades proporcionadas y casos de prueba libremente
- Citar cualquier recurso externo usado

## Ideas de Extensión

Si terminás temprano y querés desafíos adicionales:

1. **Comisiones de Transacción**: Agregar soporte para comisiones de transacción
2. **Multi-firma**: Soportar UTXOs que requieren múltiples firmas
3. **Bloqueos de Tiempo**: Agregar restricciones de gasto basadas en tiempo
4. **Árboles de Merkle**: Implementar verificación de transacciones usando pruebas de Merkle

## Soporte

- Revisar mensajes de error de pruebas cuidadosamente - proporcionan orientación específica
- Usar el debugger para revisar paso a paso tu lógica de validación
- Verificar la implementación de referencia si estás trabado
- Hacer preguntas sobre conceptos, no detalles específicos de implementación

¡Buena suerte con tu implementación!
