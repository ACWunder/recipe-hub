import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import type { User } from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      displayName: string | null;
      isAdmin?: boolean;
    }
  }
}

const configuredAdminUsernames = (process.env.ADMIN_USERNAMES ?? "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

const adminUsernames = new Set(["arthur", ...configuredAdminUsernames]);

export function isAdminUser(user: Pick<Express.User, "username"> | null | undefined): boolean {
  if (!user?.username) return false;
  return adminUsernames.has(user.username.toLowerCase());
}

function sessionUserFromDbUser(user: User): Express.User {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: isAdminUser({ username: user.username }),
  };
}


export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "recipease-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return done(null, false, { message: "Invalid username or password" });
        return done(null, sessionUserFromDbUser(user));
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) return done(null, false);
      done(null, sessionUserFromDbUser(user));
    } catch (err) {
      done(err);
    }
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};
