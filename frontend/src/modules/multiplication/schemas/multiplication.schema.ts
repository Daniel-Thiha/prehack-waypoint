import type { MultiplicationInput } from "../types/multiplication.types";

export function validateMultiplicationInput(
  a: string,
  b: string
): MultiplicationInput {
  const numA = Number(a);
  const numB = Number(b);
  if (isNaN(numA) || isNaN(numB) || a.trim() === "" || b.trim() === "") {
    throw new Error("Both values must be valid numbers");
  }
  return { a: numA, b: numB };
}
