export type UserRole = 'user' | 'volunteer' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  gender: Gender;
  password: string;
  role?: UserRole;
  bloodGroup?: BloodGroup;
  interests?: string[];
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface RegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string | null;
  role: UserRole;
}
