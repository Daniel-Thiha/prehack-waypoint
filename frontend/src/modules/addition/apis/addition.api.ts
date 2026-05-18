import api from "../../../api";
import type { AdditionInput, AdditionRecord } from "../types/addition.types";

export async function calculate(input: AdditionInput): Promise<AdditionRecord> {
  const res = await api.post<AdditionRecord>("/addition", input);
  return res.data;
}

export async function getHistory(): Promise<AdditionRecord[]> {
  const res = await api.get<AdditionRecord[]>("/addition/history");
  return res.data;
}
