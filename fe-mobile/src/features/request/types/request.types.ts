export type RequestPriority = 'Normal' | 'High' | 'Urgent';
export type RequestStatus = 'broadcasted' | 'accepted' | 'completed';
/** Which full-screen step of the raise flow is showing. null = flow closed. */
export type FlowStage = 'raising' | 'raised' | 'searching';

/** What the user fills in on the form. */
export interface RequestDraft {
  categoryId: string;
  description: string;
  priority: RequestPriority;
  bloodGroup: string | null;
  photos: string[]; // local image URIs
  coords: { lat: number; lng: number } | null;
}

/** A request after the server accepted it. */
export interface HelpRequest extends RequestDraft {
  id: string; // e.g. HIH-123456
  status: RequestStatus;
  raisedAt: string; // display time
  searchStartedAt: number | null; // epoch ms, drives the radar
}
