export interface AdditionInput {
  a: number;
  b: number;
}

export interface AdditionRecord {
  id: number;
  a: number;
  b: number;
  result: number;
  createdAt: Date;
}
