import { SignJWT } from 'jose';

export async function generateSessionToken(userId: string, email: string, name: string | null) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

  const token = await new SignJWT({
    sub: userId,
    email: email,
    name: name,
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  return token;
}
