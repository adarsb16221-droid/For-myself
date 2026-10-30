import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const LEGACY_SECRET = 'default_orbit_secure_key_for_dev_12345';
const LEGACY_KEY = crypto.createHash('sha256').update(LEGACY_SECRET).digest();

// The legacy secret is public (it is in the source), so it is only used to read old records.
// New data must be encrypted with a private ENCRYPTION_KEY in production.
let primaryKey = null;
function getPrimaryKey() {
  if (primaryKey) return primaryKey;
  const secretKeyString = process.env.ENCRYPTION_KEY;
  if (!secretKeyString && process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY FATAL: ENCRYPTION_KEY environment variable is missing in production!');
  }
  primaryKey = crypto.createHash('sha256').update(secretKeyString || LEGACY_SECRET).digest();
  return primaryKey;
}

export function encrypt(text) {
  if (!text) return text;
  
  // If already encrypted, don't double encrypt
  if (typeof text === 'string' && text.startsWith('enc:')) {
    return text;
  }

  const key = getPrimaryKey();

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `enc:${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return text;
  }
}

function decryptWithKey(text, key) {
  const parts = text.split(':');
  if (parts.length !== 3) return null;
  const iv = Buffer.from(parts[1], 'hex');
  const encryptedText = Buffer.from(parts[2], 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function decrypt(text) {
  if (!text) return text;
  
  // Only try to decrypt if it has our signature prefix
  if (typeof text === 'string' && text.startsWith('enc:')) {
    // 1. Try decrypting with primary key
    try {
      const decrypted = decryptWithKey(text, getPrimaryKey());
      if (decrypted !== null) return decrypted;
    } catch (err) {
      // Bad decrypt with primary key, try legacy key below
    }

    // 2. Fallback to legacy key (supports seamless key rotation for pre-existing records)
    try {
      const legacyDecrypted = decryptWithKey(text, LEGACY_KEY);
      if (legacyDecrypted !== null) return legacyDecrypted;
    } catch (err) {
      console.error('Decryption failed with all keys:', err);
    }

    return '[Encrypted Data]';
  }
  
  // Return plaintext as-is for legacy data
  return text;
}
