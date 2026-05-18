import { useEffect, useState } from "react";
import MultiplicationForm from "../components/MultiplicationForm";
import { calculate, getHistory } from "../apis/multiplication.api";
import { validateMultiplicationInput } from "../schemas/multiplication.schema";
import type { MultiplicationRecord } from "../types/multiplication.types";

const MultiplicationPage = () => {
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<MultiplicationRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getHistory().then(setHistory).catch(() => {});
  }, []);

  const handleSubmit = async (a: string, b: string) => {
    try {
      setError("");
      const input = validateMultiplicationInput(a, b);
      const record = await calculate(input);
      setResult(record.result);
      setHistory((prev) => [record, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Multiplication Calculator</h1>

      <MultiplicationForm onSubmit={handleSubmit} />

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
                {r.a} × {r.b} = {r.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiplicationPage;
