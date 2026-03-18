import type { TradeareaView } from '@/components/base/ModalTradeArea';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface TradeareaState {
  openModal: boolean;
  setOpenModal: (isOpen: boolean) => void;
  view: TradeareaView;
  setView: (view: TradeareaView) => void;
  tradeareaId: number | null;
  setTradeareaId: (id: number) => void;
  clearTradeareaId: () => void;
  setIsFetch: (boolean: boolean) => void;
  isFetch: boolean;
  currentWfStep: number | null;
  setCurrentWfStep: (status: number | null) => void;
  tradeareaType: string | null;
  setTradeareaType: (type: string | null) => void;
}

export const useTradeAreaStore = create<TradeareaState>()(
  devtools(set => ({
    openModal: false,
    view: 'view',
    tradeareaId: null,
    isFetch: false,
    currentWfStep: null,
    tradeareaType: 'delivery_area',
    setOpenModal: (isOpen: boolean) => {
      set({
        openModal: isOpen,
      });
      if (!isOpen) {
        set({ tradeareaType: null });
      }
    },
    setView: (view: TradeareaView) => set({ view }),
    setTradeareaId: (id: number) => set({ tradeareaId: id }),
    clearTradeareaId: () => set({ tradeareaId: null }),
    setIsFetch: (boolean: boolean) => set({ isFetch: boolean }),
    setCurrentWfStep: (status: number | null) => set({ currentWfStep: status }),
    setTradeareaType: (type: string | null) => set({ tradeareaType: type }),
  }))
);
