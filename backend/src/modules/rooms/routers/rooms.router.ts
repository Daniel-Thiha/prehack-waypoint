import { Router } from "express";
import { create, join, list, leave, getRoom, verifyRoom, logHistory, getHistory } from "../controllers/rooms.controller";
import { requireAuth } from "../../../middlewares/auth.middleware";

const roomsRouter = Router();

// Public — anyone can verify a room exists
roomsRouter.get("/verify/:code", verifyRoom);

// Protected — requires login
roomsRouter.get("/history", requireAuth, getHistory);
roomsRouter.post("/history", requireAuth, logHistory);
roomsRouter.get("/", requireAuth, list);
roomsRouter.post("/", requireAuth, create);
roomsRouter.post("/join", requireAuth, join);
roomsRouter.get("/:code", requireAuth, getRoom);
roomsRouter.delete("/:roomId/leave", requireAuth, leave);

export default roomsRouter;
