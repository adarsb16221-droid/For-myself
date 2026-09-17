import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-only-change-it';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10h')
    .sign(key);
}

export async function decrypt(token) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  let session = cookieStore.get('session')?.value;
  
  if (!session) {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      session = authHeader.substring(7);
    }
  }

  if (!session) return null;
  
  const payload = await decrypt(session);
  if (!payload) return null;

  // Defensive check to automatically invalidate old/corrupted sessions
  if (typeof payload.userId !== 'string') {
    return null;
  }

  return payload;
}

export async function login(user) {
  const payload = { userId: user._id.toString(), name: user.name, email: user.email };
  const session = await encrypt(payload);
  
  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 10, // 10 hours
  });
  
  return session;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
