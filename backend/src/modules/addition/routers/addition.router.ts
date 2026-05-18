import { Router } from "express";
import { calculate, getHistory } from "../controllers/addition.controller";

const additionRouter = Router();

additionRouter.post("/", calculate);
additionRouter.get("/history", getHistory);

export default additionRouter;
