import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export interface JwtPayload {
  sub: string   // userId
  email: string
}

export function signAccess(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  })
}

export function signRefresh(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  })
}

export function verifyAccess(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

export function verifyRefresh(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}
