import { create } from 'zustand';

import { requestService } from '../services/request.service';
import type { FlowStage, HelpRequest, RequestDraft } from '../types/request.types';

interface RequestState {
  request: HelpRequest | null;
  /** What the user just submitted; lets the flow render before the server replies. */
  draft: RequestDraft | null;
  stage: FlowStage | null;
  raise: (draft: RequestDraft) => Promise<void>;
  setStage: (stage: FlowStage | null) => void;
  startSearch: () => void;
  cancel: () => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  request: null,
  draft: null,
  stage: null,

  raise: async (draft) => {
    set({ draft, stage: 'raising' });
    try {
      const request = await requestService.createRequest(draft);
      set({ request });
    } catch (error) {
      set({ draft: null, stage: null });
      throw error;
    }
  },

  setStage: (stage) => set({ stage }),

  startSearch: () => {
    const { request } = get();
    if (!request) return;
    set({
      request: { ...request, searchStartedAt: request.searchStartedAt ?? Date.now() },
      stage: 'searching',
    });
  },

  cancel: () => set({ request: null, draft: null, stage: null }),
}));
