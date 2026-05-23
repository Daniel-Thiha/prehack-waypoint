const MAX = 20;

export interface HistoryEntry {
  code: string;
  name: string;
  visitedAt: number;
}

function storageKey(userId: string) {
  return `syncboard_history_${userId}`;
}

export function getRoomHistory(userId: string | null | undefined): HistoryEntry[] {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addRoomToHistory(userId: string | null | undefined, code: string, name: string): void {
  if (!userId) return;
  const history = getRoomHistory(userId).filter((e) => e.code !== code);
  history.unshift({ code, name, visitedAt: Date.now() });
  localStorage.setItem(storageKey(userId), JSON.stringify(history.slice(0, MAX)));
}
