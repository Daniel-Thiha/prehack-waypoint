import { useEffect, useState } from "react";
import AdditionForm from "../components/AdditionForm";
import { calculate, getHistory } from "../apis/addition.api";
import { validateAdditionInput } from "../schemas/addition.schema";
import type { AdditionRecord } from "../types/addition.types";

const AdditionPage = () => {
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<AdditionRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory().then(setHistory).catch(() => {});
  }, []);

  const handleSubmit = async (a: string, b: string) => {
    try {
      setError("");
      const input = validateAdditionInput(a, b);
      const record = await calculate(input);
      setResult(record.result);
      setHistory((prev) => [record, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Addition Calculator</h1>

      <AdditionForm onSubmit={handleSubmit} />

      {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}

      {result !== null && (
        <p className="text-xl font-semibold mt-4">Result: {result}</p>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">History</h2>
          <ul className="space-y-1">
            {history.map((r) => (
              <li key={r.id} className="text-sm text-gray-600">
                {r.a} + {r.b} = {r.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdditionPage;
