import { Router } from "express";
import { googleStart, googleCallback, logout, me } from "../controllers/auth.controller";
import { requireAuth } from "../../../middlewares/auth.middleware";

const authRouter = Router();

authRouter.get("/google", googleStart);
authRouter.get("/google/callback", googleCallback);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

export default authRouter;
