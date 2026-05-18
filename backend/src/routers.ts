import { Router } from "express";
import additionRouter from "./modules/addition/routers/addition.router";
import multiplicationRouter from "./modules/multiplication/routers/multiplication.router";

const mainRouter = Router();

mainRouter.use("/addition", additionRouter);
mainRouter.use("/multiplication", multiplicationRouter);

export default mainRouter;
