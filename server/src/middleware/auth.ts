import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number,
    username: string,
  };
}

export const authenticateToken = async(req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']; //Bearer TOKEN
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({error:"Sign in first."});
  jwt.verify(token, (process.env.JWT_SECRET || ""), (error: any, user: any) => {
    if (error) return res.status(403).json({error : `${error.message}, sign in first.`});
    req.user = user;
    next();
  });
}

export default authenticateToken;
