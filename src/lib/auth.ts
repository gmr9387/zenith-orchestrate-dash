import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'enterprise';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

type AuthStore = AuthState & AuthActions;

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error?.message || 'Login failed');
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token in localStorage for persistence
          localStorage.setItem('auth_token', data.token);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error?.message || 'Registration failed');
          }

          set({
            isLoading: false,
            error: null,
          });

          // Auto-login after successful registration
          await get().login(email, password);
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        const { token } = get();
        
        // Call logout endpoint if we have a token
        if (token) {
          fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).catch(console.error); // Ignore errors on logout
        }

        // Clear local storage
        localStorage.removeItem('auth_token');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Token is invalid, clear auth state
            get().logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          get().logout();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        localStorage.setItem('auth_token', token);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth state from localStorage on app start
export const initializeAuth = () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    useAuthStore.getState().setToken(token);
    useAuthStore.getState().checkAuth();
  }
};

// API client with automatic auth headers
export const apiClient = {
  get: async (url: string) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}${url}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    
    return response;
  },

  post: async (url: string, data: any) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    
    return response;
  },

  put: async (url: string, data: any) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    
    return response;
  },

  delete: async (url: string) => {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    
    return response;
  },

  upload: async (url: string, file: File) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    
    if (response.status === 401) {
      useAuthStore.getState().logout();
      throw new Error('Unauthorized');
    }
    
    return response;
  },
};

// Auth guard hook for protected routes
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    requireAuth: () => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/login';
        return false;
      }
      return true;
    },
  };
};

// Role-based access control hook
export const useRoleGuard = (requiredRoles: string[]) => {
  const { user, isAuthenticated } = useAuthStore();
  
  const hasRole = isAuthenticated && user && requiredRoles.includes(user.role);
  
  return {
    hasRole,
    requireRole: () => {
      if (!hasRole) {
        window.location.href = '/unauthorized';
        return false;
      }
      return true;
    },
  };
};