export interface Room {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  isPrivate: boolean;
  owner: { id: string; username: string };
  members: { userId: string }[];
  createdAt: string;
}
