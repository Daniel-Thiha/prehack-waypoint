import type { Request, Response, NextFunction } from "express";
import { validateAdditionInput } from "../schemas/addition.schema";
import {
  createAdditionRecord,
  getAdditionHistory,
} from "../models/addition.model";

export async function calculate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validateAdditionInput(req.body);
    const record = await createAdditionRecord(input);
    res.json(record);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const records = await getAdditionHistory();
    res.json(records);
  } catch (err) {
    next(err);
  }
}
