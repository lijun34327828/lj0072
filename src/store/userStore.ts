import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: 'customer' | 'technician' | 'admin';
}

interface UserStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      currentUser: null,
      isLoggedIn: false,

      login: (user: User) => {
        set({
          currentUser: user,
          isLoggedIn: true,
        });
      },

      logout: () => {
        set({
          currentUser: null,
          isLoggedIn: false,
        });
      },

      setUser: (user: User | null) => {
        set({
          currentUser: user,
          isLoggedIn: user !== null,
        });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);
