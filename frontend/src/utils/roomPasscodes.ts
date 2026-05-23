function storageKey(userId: string) {
  return `syncboard_passcodes_${userId}`;
}

function load(userId: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveRoomPasscode(userId: string | null | undefined, code: string, passcode: string): void {
  if (!userId) return;
  const map = load(userId);
  map[code] = passcode;
  localStorage.setItem(storageKey(userId), JSON.stringify(map));
}

export function getRoomPasscode(userId: string | null | undefined, code: string): string | null {
  if (!userId) return null;
  return load(userId)[code] ?? null;
}
