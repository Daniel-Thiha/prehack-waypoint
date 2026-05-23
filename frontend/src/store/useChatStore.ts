import { create } from "zustand";

interface Message {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorColor: string;
  content: string;
  createdAt: string;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;

  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  prependMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isLoading: false,

  addMessage: (message: Message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages: Message[]) =>
    set({
      messages,
    }),

  prependMessages: (messages: Message[]) =>
    set((state) => ({
      messages: [...messages, ...state.messages],
    })),

  setLoading: (loading: boolean) =>
    set({
      isLoading: loading,
    }),

  clear: () =>
    set({
      messages: [],
    }),
}));
