import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../../db";

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email returned from Google"));

        const avatar = profile.photos?.[0]?.value ?? null;

        const existing = await prisma.user.findUnique({
          where: { googleId: profile.id },
        });

        if (existing) {
          // Refresh avatar in case Google updated the profile picture
          const updated = await prisma.user.update({
            where: { googleId: profile.id },
            data: { avatar },
          });
          return done(null, { userId: updated.id, username: updated.username });
        }

        const base = (
          profile.displayName?.replace(/\s+/g, "") || email.split("@")[0]
        ).slice(0, 30);
        let username = base;
        let n = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${base}${n++}`;
        }

        const user = await prisma.user.create({
          data: { googleId: profile.id, username, email, avatar },
        });
        done(null, { userId: user.id, username: user.username });
      } catch (err) {
        done(err as Error);
      }
    }
  )
);
