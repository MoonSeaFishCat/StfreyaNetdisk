import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar: string;
  coin: number;
  usedSize: number;
  totalSize: number;
  fileCount: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        set({ token, user });
      },
      clearAuth: () => {
        set({ token: null, user: null });
      },
      updateUser: (userUpdates) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...userUpdates } : null
        })),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface ConfigState {
  siteName: string;
  announcement: string;
  allowRegister: boolean;
  themeMode: 'light' | 'dark';
  setConfigs: (configs: any) => void;
  toggleTheme: () => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      siteName: 'Stfreya Netdisk',
      announcement: '',
      allowRegister: true,
      themeMode: 'light',
      setConfigs: (configs) => set({
        siteName: configs.site_name || 'Stfreya Netdisk',
        announcement: configs.site_announcement || '',
        allowRegister: configs.allow_register === 'true',
      }),
      toggleTheme: () => set((state) => {
        const newTheme = state.themeMode === 'light' ? 'dark' : 'light';
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { themeMode: newTheme };
      }),
    }),
    {
      name: 'config-storage',
      onRehydrateStorage: () => (state) => {
        // 在恢复状态后应用主题
        if (state?.themeMode === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
