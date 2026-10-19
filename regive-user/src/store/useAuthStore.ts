import { create } from 'zustand';
import { Role, User } from '@/types';
import { authService, LoginPayload, RegisterPayload, UpdateProfilePayload } from '@/services/authService';
import { tokenStorage } from '@/services/apiClient';

const USER_APP_ROLES: ReadonlyArray<Role> = ['USER', 'BENEFICIARY'];

const ensureUserAppRole = (user: User) => {
  if (!USER_APP_ROLES.includes(user.role)) {
    tokenStorage.remove();
    throw new Error('Tài khoản quản trị hoặc nhân viên vui lòng đăng nhập tại trang admin.');
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  loadUser: async () => {
    const token = tokenStorage.get();
    if (!token) {
      set({ user: null, token: null, initialized: true });
      return;
    }
    set({ loading: true, token });
    try {
      const user = await authService.getMe();
      ensureUserAppRole(user);
      set({ user, token, loading: false, initialized: true });
    } catch {
      tokenStorage.remove();
      set({ user: null, token: null, loading: false, initialized: true });
    }
  },

  login: async (payload: LoginPayload) => {
    set({ loading: true });
    try {
      const { user, token } = await authService.login(payload);
      ensureUserAppRole(user);
      tokenStorage.set(token);
      set({ user, token, loading: false, initialized: true });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (payload: RegisterPayload) => {
    set({ loading: true });
    try {
      const { user, token } = await authService.register(payload);
      ensureUserAppRole(user);
      tokenStorage.set(token);
      set({ user, token, loading: false, initialized: true });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    tokenStorage.remove();
    set({ user: null, token: null, initialized: true });
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    set({ loading: true });
    try {
      const updatedUser = await authService.updateProfile(payload);
      set({ user: updatedUser, loading: false });
      return updatedUser;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
}));
