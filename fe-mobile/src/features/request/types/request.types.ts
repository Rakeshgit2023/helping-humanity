export type RequestPriority = 'Normal' | 'High' | 'Urgent';
export type RequestStatus = 'broadcasted' | 'accepted' | 'completed';
/** Which full-screen step of the raise flow is showing. null = flow closed. */
export type FlowStage = 'raising' | 'raised' | 'searching';

/** A picked image, in the shape React Native's FormData needs. */
export interface RequestPhoto {
  uri: string;
  name: string;
  type: string; // image/jpeg | image/png | image/webp
}

/** What the user fills in on the form (already shaped for the API). */
export interface RequestDraft {
  /** Local UI category id (animal, food, blood…) — drives icon/colour. */
  categoryId: string;
  /** The real category from GET /category — this is what the server wants. */
  category: { id: string; name: string };
  title: string;
  description: string;
  priority: RequestPriority;
  bloodGroup: string | null;
  hospitalName: string | null;
  photos: RequestPhoto[];
  coords: { lat: number; lng: number };
}

/** A request after the server accepted it. */
export interface HelpRequest extends RequestDraft {
  id: string; // server uuid
  shortId: string; // first 8 chars, for display
  status: RequestStatus;
  raisedAt: string; // display time
  searchStartedAt: number | null; // epoch ms, drives the radar
}
