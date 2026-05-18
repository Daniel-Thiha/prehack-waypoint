import api from "../../../api";
import type {
  MultiplicationInput,
  MultiplicationRecord,
} from "../types/multiplication.types";

export async function calculate(
  input: MultiplicationInput
): Promise<MultiplicationRecord> {
  const res = await api.post<MultiplicationRecord>("/multiplication", input);
  return res.data;
}

export async function getHistory(): Promise<MultiplicationRecord[]> {
  const res = await api.get<MultiplicationRecord[]>("/multiplication/history");
  return res.data;
}
