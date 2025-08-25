import crypto from 'crypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

/**
 * Generate a key pair using elliptic curve cryptography (secp256k1 - Bitcoin style)
 * @returns {KeyPair} The generated key pair
 */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    publicKey: publicKey.toString(),
    privateKey: privateKey.toString()
  };
}

/**
 * Sign data with a private key
 * @param {string} data - The data to sign
 * @param {string} privateKey - The private key to use for signing (PEM format)
 * @returns {string} The signature (hex format)
 */
export function sign(data: string, privateKey: string): string {
  try {
    const sign = crypto.createSign('SHA256');
    sign.update(data, 'utf8');
    sign.end();
    return sign.sign(privateKey, 'hex');
  } catch (error) {
    throw new Error(
      `Failed to sign data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Verify a signature
 * @param {string} data - The data to verify
 * @param {string} signature - The signature to verify (hex format)
 * @param {string} publicKey - The public key to use for verification (PEM format)
 * @returns {boolean} Whether the signature is valid
 */
export function verify(data: string, signature: string, publicKey: string): boolean {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data, 'utf8');
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  } catch (error) {
    return false;
  }
}

/**
 * Hash data using SHA-256
 * @param {string} data - The data to hash
 * @returns {string} The hash (hex format)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
