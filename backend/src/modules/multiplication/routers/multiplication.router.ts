import { Router } from "express";
import { calculate, getHistory } from "../controllers/multiplication.controller";

const multiplicationRouter = Router();

multiplicationRouter.post("/", calculate);
multiplicationRouter.get("/history", getHistory);

export default multiplicationRouter;
