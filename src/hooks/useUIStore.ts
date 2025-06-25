import { create } from 'zustand';

interface UIState {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;

  selectedTravelers: string[];
  setSelectedTravelers: (ids: string[]) => void;

  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  formDraft: Record<string, any>;
  setFormDraft: (draft: Record<string, any>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),

  selectedTravelers: [],
  setSelectedTravelers: (ids) => set({ selectedTravelers: ids }),

  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  formDraft: {},
  setFormDraft: (draft) => set({ formDraft: draft }),
})); 