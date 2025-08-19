export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'enterprise';
  permissions: string[];
}

class AuthManager {
  private static instance: AuthManager;
  private token: AuthToken | null = null;
  private user: User | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const storedToken = localStorage.getItem('zilliance_auth_token');
      const storedUser = localStorage.getItem('zilliance_user');
      
      if (storedToken) {
        this.token = JSON.parse(storedToken);
      }
      
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Failed to load auth data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      if (this.token) {
        localStorage.setItem('zilliance_auth_token', JSON.stringify(this.token));
      }
      if (this.user) {
        localStorage.setItem('zilliance_user', JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Failed to save auth data to storage:', error);
    }
  }

  setToken(token: AuthToken): void {
    this.token = token;
    this.saveToStorage();
  }

  setUser(user: User): void {
    this.user = user;
    this.saveToStorage();
  }

  getToken(): AuthToken | null {
    if (!this.token) return null;
    
    // Check if token is expired
    if (Date.now() > this.token.expires_at) {
      this.logout();
      return null;
    }
    
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No valid authentication token');
    }
    
    return {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'X-User-ID': token.user_id,
    };
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('zilliance_auth_token');
    localStorage.removeItem('zilliance_user');
  }

  async refreshToken(): Promise<boolean> {
    if (!this.token?.refresh_token) return false;
    
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.token.refresh_token,
        }),
      });
      
      if (response.ok) {
        const newToken: AuthToken = await response.json();
        this.setToken(newToken);
        return true;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }
    
    return false;
  }
}

export const authManager = AuthManager.getInstance();