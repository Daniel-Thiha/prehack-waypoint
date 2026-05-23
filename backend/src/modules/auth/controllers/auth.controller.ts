import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { prisma } from "../../../db";
import type { AuthRequest } from "../../../middlewares/auth.middleware";

declare module "express-session" {
  interface SessionData {
    returnTo?: string;
  }
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId: string, username: string) {
  return jwt.sign({ userId, username }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function googleStart(req: Request, res: Response, next: NextFunction) {
  if (req.query.returnTo) {
    req.session.returnTo = String(req.query.returnTo);
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
}

export function googleCallback(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    "google",
    { session: false, failureRedirect: `${process.env.ALLOW_ORIGIN}/?error=auth_failed` },
    (err: Error | null, user: Express.User | false) => {
      if (err || !user) return next(err ?? new Error("OAuth failed"));

      const token = signToken(user.userId, user.username);
      res.cookie("token", token, COOKIE_OPTIONS);

      const returnTo = req.session.returnTo ?? "/";
      req.session.destroy(() => {});
      res.redirect(`${process.env.ALLOW_ORIGIN}${returnTo}`);
    }
  )(req, res, next);
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, email: true, avatar: true },
    });
    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
