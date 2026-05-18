import { useState } from "react";

interface AdditionFormProps {
  onSubmit: (a: string, b: string) => void;
}

const AdditionForm = ({ onSubmit }: AdditionFormProps) => {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(a, b);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="number"
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="Number A"
        className="border rounded px-3 py-2 w-full"
      />
      <input
        type="number"
        value={b}
        onChange={(e) => setB(e.target.value)}
        placeholder="Number B"
        className="border rounded px-3 py-2 w-full"
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded"
      >
        Calculate
      </button>
    </form>
  );
};

export default AdditionForm;
