export type UserRole =
  | 'CUSTOMER'
  | 'FACILITY_STAFF'
  | 'FACILITY_MANAGER'
  | 'BUSINESS_MANAGER'
  | 'ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
