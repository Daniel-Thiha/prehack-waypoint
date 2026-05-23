import "dotenv/config";
import "./modules/auth/strategies/google.strategy";
import http from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import mainRouter from "./routers";
import { errorHandler } from "./middlewares/error_handler";
import { createSocketServer } from "./socket";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.ALLOW_ORIGIN!],
    credentials: true,
  })
);

// Express session — only used for the OAuth state during the redirect dance
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 },
  })
);
app.use(passport.initialize());

app.use("", mainRouter);
app.use(errorHandler);

const httpServer = http.createServer(app);
createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
