import { useState, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for backdoor user in localStorage
    const backdoorUser = localStorage.getItem('backdoorUser');
    if (backdoorUser) {
      try {
        const user = JSON.parse(backdoorUser);
        setUser(user);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('backdoorUser');
      }
    }

    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const user = await AuthService.signIn(email, password);
      setUser(user);
      // Persist backdoor user
      if (email === 'admin@admin.admin') {
        localStorage.setItem('backdoorUser', JSON.stringify(user));
      }
      return user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
      setUser(null);
      // Clear backdoor user
      localStorage.removeItem('backdoorUser');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    staffData: {
      name: string;
      code: string;
      role: string;
      department: string;
      position: string;
      phone: string;
    }
  ) => {
    try {
      setError(null);
      const uid = await AuthService.registerStaff(email, password, staffData);
      return uid;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    staffData: user?.staffData || null,
    loading,
    error,
    signIn,
    signOut,
    register,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Quản trị viên' || user?.role === 'Quản lý'
  };
};
