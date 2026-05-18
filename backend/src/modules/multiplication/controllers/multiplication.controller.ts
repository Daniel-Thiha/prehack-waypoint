import type { Request, Response, NextFunction } from "express";
import { validateMultiplicationInput } from "../schemas/multiplication.schema";
import {
  createMultiplicationRecord,
  getMultiplicationHistory,
} from "../models/multiplication.model";

export async function calculate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = validateMultiplicationInput(req.body);
    const record = await createMultiplicationRecord(input);
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
    const records = await getMultiplicationHistory();
    res.json(records);
  } catch (err) {
    next(err);
  }
}
