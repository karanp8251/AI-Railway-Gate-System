import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database, isConfigured } from '../config/firebase';
import { api } from '../services/api';
import { ROLES, ROLE_ROUTES } from '../config/constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (isConfigured && auth) signOut(auth);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
    if (isConfigured && auth) {
      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && database) {
          const snap = await get(ref(database, `users/${fbUser.uid}`));
          const profile = snap.val();
          if (profile) setUser({ uid: fbUser.uid, email: fbUser.email, ...profile });
        }
        setLoading(false);
      });
      return unsub;
    }
    setLoading(false);
  }, []);

  const login = async (email, password, role) => {
    if (isConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await get(ref(database, `users/${cred.user.uid}`));
      const profile = snap.val();
      if (!profile || profile.role !== role) {
        await signOut(auth);
        throw new Error('Role mismatch for this login panel');
      }
      const idToken = await cred.user.getIdToken();
      const res = await api.post('/auth/firebase-token', { idToken, role });
      persistSession(res.user, res.token);
      return res.user;
    }
    const res = await api.post('/auth/login', { email, password, role });
    persistSession(res.user, res.token);
    return res.user;
  };

  const register = async (email, password, displayName, role = ROLES.USER) => {
    if (isConfigured && auth && database) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await set(ref(database, `users/${cred.user.uid}`), {
        email,
        displayName,
        role,
        createdAt: Date.now(),
      });
      const idToken = await cred.user.getIdToken();
      const res = await api.post('/auth/firebase-token', { idToken, role });
      persistSession(res.user, res.token);
      return res.user;
    }
    const res = await api.post('/auth/register', { email, password, displayName, role });
    persistSession(res.user, res.token);
    return res.user;
  };

  const logout = () => clearSession();

  const getDashboardPath = () => (user?.role ? ROLE_ROUTES[user.role] : '/');

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, getDashboardPath, isAuthenticated: !!user && !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
