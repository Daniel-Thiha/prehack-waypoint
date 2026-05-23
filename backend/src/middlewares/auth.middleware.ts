import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Make passport's req.user compatible with our token payload
declare global {
  namespace Express {
    interface User {
      userId: string;
      username: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
