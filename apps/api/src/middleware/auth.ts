import type { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../lib/jwt'

// Augment Express Request so userId/userEmail are available without casting
declare global {
  namespace Express {
    interface Request {
      userId:    string
      userEmail: string
    }
  }
}

// Keep as alias for backwards compatibility
export type AuthRequest = Request

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = header.slice(7)
  try {
    const payload = verifyAccess(token)
    req.userId    = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
