import { Router } from "express";
import authRouter from "./modules/auth/routers/auth.router";
import roomsRouter from "./modules/rooms/routers/rooms.router";

const mainRouter = Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/rooms", roomsRouter);

export default mainRouter;
