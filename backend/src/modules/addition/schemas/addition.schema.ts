import type { AdditionInput } from "../types/addition.types";

export function validateAdditionInput(body: unknown): AdditionInput {
  const { a, b } = body as Record<string, unknown>;
  if (typeof a !== "number" || typeof b !== "number") {
    throw Object.assign(new Error("a and b must be numbers"), { status: 400 });
  }
  return { a, b };
}
