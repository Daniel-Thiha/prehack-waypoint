import { prisma } from "../../../db";
import type { AdditionInput, AdditionRecord } from "../types/addition.types";

export async function createAdditionRecord(
  input: AdditionInput
): Promise<AdditionRecord> {
  const result = input.a + input.b;
  return prisma.additionRecord.create({
    data: { a: input.a, b: input.b, result },
  });
}

export async function getAdditionHistory(): Promise<AdditionRecord[]> {
  return prisma.additionRecord.findMany({ orderBy: { createdAt: "desc" } });
}
