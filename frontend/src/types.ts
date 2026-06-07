export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'operator';
  created_at: string;
}

export interface Product {
  id: number;
  wid: string;
  ean: string;
  manufacturing_date: string;
  expiry_date: string;
  created_at: string;
}

export interface VerificationLog {
  id: number;
  wid: string;
  verified_at: string;
  has_photo: boolean;
  photo_url: string | null;
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
