export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'operator';
  createdAt: string;
}

export interface Product {
  id: number;
  wid: string;
  ean: string;
  manufacturingDate: string;
  expiryDate: string;
  createdAt: string;
}

export interface VerificationLog {
  id: number;
  wid: string;
  verifiedAt: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  user: User;
  product?: { ean: string };
}

export interface UploadResult {
  inserted: number;
  duplicates: number;
  errors: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
