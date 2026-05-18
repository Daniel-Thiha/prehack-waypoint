import { prisma } from "../../../db";
import type {
  MultiplicationInput,
  MultiplicationRecord,
} from "../types/multiplication.types";

export async function createMultiplicationRecord(
  input: MultiplicationInput
): Promise<MultiplicationRecord> {
  const result = input.a * input.b;
  return prisma.multiplicationRecord.create({
    data: { a: input.a, b: input.b, result },
  });
}

export async function getMultiplicationHistory(): Promise<MultiplicationRecord[]> {
  return prisma.multiplicationRecord.findMany({
    orderBy: { createdAt: "desc" },
  });
}
