import type { AdditionInput } from "../types/addition.types";

export function validateAdditionInput(a: string, b: string): AdditionInput {
  const numA = Number(a);
  const numB = Number(b);
  if (isNaN(numA) || isNaN(numB) || a.trim() === "" || b.trim() === "") {
    throw new Error("Both values must be valid numbers");
  }
  return { a: numA, b: numB };
}
