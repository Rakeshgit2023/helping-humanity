export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
}
