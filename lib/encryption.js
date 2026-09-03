import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the key is exactly 32 bytes long by hashing it
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'default_orbit_secure_key_for_dev_12345')
  .digest();

export function encrypt(text) {
  if (!text) return text;
  
  // If already encrypted, don't double encrypt
  if (typeof text === 'string' && text.startsWith('enc:')) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `enc:${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
}

export function decrypt(text) {
  if (!text) return text;
  
  // Only try to decrypt if it has our signature prefix
  if (typeof text === 'string' && text.startsWith('enc:')) {
    try {
      const parts = text.split(':');
      if (parts.length !== 3) return text; // Invalid format
      
      const iv = Buffer.from(parts[1], 'hex');
      const encryptedText = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
      let decrypted = decipher.update(encryptedText, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('Decryption failed:', err);
      return '[Encrypted Data]';
    }
  }
  
  // Return plaintext as-is for legacy data
  return text;
}
