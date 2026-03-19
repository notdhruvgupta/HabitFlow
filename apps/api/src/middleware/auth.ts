import type { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../lib/jwt'

export interface AuthRequest extends Request {
  userId: string
  userEmail: string
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccess(token)
    ;(req as AuthRequest).userId    = payload.sub
    ;(req as AuthRequest).userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
