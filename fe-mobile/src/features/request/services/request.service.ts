import type { HelpRequest, RequestDraft } from '../types/request.types';

// MOCK: the backend has no request endpoints yet. When it does, replace the
// body with `apiClient.post<HelpRequest>(ENDPOINTS.request.create, draft)`.
async function createRequest(draft: RequestDraft): Promise<HelpRequest> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const now = new Date();
  return {
    ...draft,
    id: `HIH-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'broadcasted',
    raisedAt: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    searchStartedAt: null,
  };
}

export const requestService = { createRequest };
