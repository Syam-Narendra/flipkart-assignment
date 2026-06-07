import { createContext, useContext } from 'react';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
