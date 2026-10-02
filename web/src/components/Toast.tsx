import { useEffect } from 'react';
import { create } from 'zustand';
import { IconCheck } from './Icons';

const useToastStore = create<{ text: string | null; key: number; show(text: string): void; hide(): void }>((set) => ({
  text: null,
  key: 0,
  show: (text) => set((s) => ({ text, key: s.key + 1 })),
  hide: () => set({ text: null }),
}));

export const toast = (text: string) => useToastStore.getState().show(text);

export function Toaster() {
  const { text, key, hide } = useToastStore();
  useEffect(() => {
    if (!text) return;
    const id = setTimeout(hide, 1800);
    return () => clearTimeout(id);
  }, [text, key, hide]);

  if (!text) return null;
  return (
    <div className="toast" key={key} role="status">
      <IconCheck width={18} height={18} />
      {text}
    </div>
  );
}
