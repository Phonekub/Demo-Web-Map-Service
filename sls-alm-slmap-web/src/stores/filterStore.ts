import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FilterState {
  filters: Record<string, any>;
  lastFilterIndex: number;
  setLastFilter: (index: number) => void;
  setField: (filterKey: string, key: string, value: any) => void;
  setError: (filterKey: string, text: string) => void;
  resetFilter: (filterKey: string) => void;
  isFindSevenEleven: boolean;
  setIsSevenElevenFilter: (value: boolean) => void;
  resetAll: () => void;
}

export const useFilterStore = create<FilterState>()(
  devtools(set => ({
    filters: {},

    lastFilterIndex: 0,
    setLastFilter: index =>
      set({
        lastFilterIndex: index,
      }),

    // SET VALUE IN ANY FILTER
    setField: (filterKey, key, value) =>
      set(state => ({
        filters: {
          ...state.filters,
          [filterKey]: {
            ...(state.filters[filterKey] || {}),
            [key]: value,
          },
        },
      })),

    // SET ERROR FOR ANY FILTER
    setError: (filterKey, text) =>
      set(state => ({
        filters: {
          ...state.filters,
          [filterKey]: {
            ...(state.filters[filterKey] || {}),
            inputErrors: text,
          },
        },
      })),

    // RESET WHEN CHANGE FILTER
    resetFilter: filterKey =>
      set(state => ({
        filters: {
          ...state.filters,
          [filterKey]: {},
        },
      })),

    // RESET EVERYTHING
    resetAll: () => set({ filters: {} }),

    isFindSevenEleven: true,
    setIsSevenElevenFilter: (value: boolean) =>
      set({
        isFindSevenEleven: value,
      }),
  }))
);
