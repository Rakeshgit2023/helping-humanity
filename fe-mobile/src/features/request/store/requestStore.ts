import { create } from 'zustand';

import { toAppError } from '@/utils/errorHandler';

import { requestService } from '../services/request.service';
import type { FlowStage, HelpRequest, RequestDraft } from '../types/request.types';

interface RequestState {
  request: HelpRequest | null;
  /** What the user submitted. Kept after a failure so they can retry or edit. */
  draft: RequestDraft | null;
  error: string | null;
  stage: FlowStage | null;
  raise: (draft: RequestDraft) => Promise<void>;
  retry: () => Promise<void>;
  setStage: (stage: FlowStage | null) => void;
  startSearch: () => void;
  cancel: () => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  request: null,
  draft: null,
  error: null,
  stage: null,

  raise: async (draft) => {
    set({ draft, error: null, request: null, stage: 'raising' });
    try {
      const request = await requestService.createRequest(draft);
      set({ request, draft: null });
    } catch (error) {
      // Keep the draft so "Try again" / "Edit request" don't lose what was typed.
      set({ error: toAppError(error).message, stage: null });
    }
  },

  retry: async () => {
    const { draft } = get();
    if (draft) await get().raise(draft);
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

  // TODO: call the cancel endpoint once the backend has one.
  cancel: () => set({ request: null, draft: null, error: null, stage: null }),
}));
