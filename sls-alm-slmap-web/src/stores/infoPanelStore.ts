import type { InfoComponent } from '@/pages/maps/panel/InfoPanel';
import { create } from 'zustand';

interface InfoPanelState {
  currentTap: InfoComponent;
  setCurrentTap: (tap: InfoComponent) => void;
}

export const useInfoPanelStore = create<InfoPanelState>(set => ({
  currentTap: 'INFORMATION',
  setCurrentTap: (tap: InfoComponent) => {
    set({
      currentTap: tap,
    });
  },
}));
