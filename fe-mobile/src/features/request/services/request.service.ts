import { apiClient } from '@/services/api/client';
import { ENDPOINTS } from '@/services/api/endpoints';

import type { HelpRequest, RequestDraft, RequestStatus } from '../types/request.types';

interface CreateRequestResponse {
  message: string;
  data: { id: string; status: string; createdAt: string };
}

const UPLOAD_TIMEOUT_MS = 60_000; // photos can be slow on mobile data

/** POST /request — multipart/form-data, images go in the `files` field. */
async function createRequest(draft: RequestDraft): Promise<HelpRequest> {
  const form = new FormData();
  // The server JSON.parse()s this field, so it must be a JSON string.
  form.append('category', JSON.stringify(draft.category));
  form.append('title', draft.title);
  if (draft.description) form.append('description', draft.description);
  form.append('lat', String(draft.coords.lat));
  form.append('lng', String(draft.coords.lng));
  form.append('priority', draft.priority.toLowerCase()); // server expects normal | high | urgent
  // Only sent for blood requests — the server rejects them for every other category.
  if (draft.bloodGroup) form.append('bloodGroupNeeded', draft.bloodGroup);
  if (draft.hospitalName) form.append('hospitalName', draft.hospitalName);
  draft.photos.forEach((p) => {
    // React Native's FormData accepts {uri, name, type} for files.
    form.append('files', { uri: p.uri, name: p.name, type: p.type } as unknown as Blob);
  });

  const { data } = await apiClient.post<CreateRequestResponse>(ENDPOINTS.request.create, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });

  const created = data.data;
  const raised = new Date(created.createdAt);
  return {
    ...draft,
    id: created.id,
    shortId: created.id.slice(0, 8).toUpperCase(),
    status: (created.status as RequestStatus) ?? 'broadcasted',
    raisedAt: raised.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    searchStartedAt: null,
  };
}

export const requestService = { createRequest };
