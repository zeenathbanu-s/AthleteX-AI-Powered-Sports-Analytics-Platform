interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin';
}

interface AdminCredentials {
  username: string;
  password: string;
}

class AdminAuthService {
  private readonly ADMIN_STORAGE_KEY = 'athletex_admin_user';

  // Login admin with no restrictions (accepts any credentials)
  async login(credentials: AdminCredentials): Promise<AdminUser> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Accept any username/password for simplicity
        const adminUser: AdminUser = {
          id: 'admin-001',
          username: credentials.username || 'admin',
          email: `${credentials.username || 'admin'}@athletex.com`,
          role: 'admin'
        };
        
        // Store admin user in localStorage
        localStorage.setItem(this.ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
        resolve(adminUser);
      }, 300); // Simulate network delay
    });
  }

  // Logout admin
  logout(): void {
    localStorage.removeItem(this.ADMIN_STORAGE_KEY);
  }

  // Get current admin user from localStorage
  getCurrentAdmin(): AdminUser | null {
    const adminData = localStorage.getItem(this.ADMIN_STORAGE_KEY);
    if (adminData) {
      try {
        return JSON.parse(adminData) as AdminUser;
      } catch (error) {
        console.error('Error parsing admin data:', error);
        localStorage.removeItem(this.ADMIN_STORAGE_KEY);
      }
    }
    return null;
  }

  // Check if admin is logged in
  isAdminLoggedIn(): boolean {
    return this.getCurrentAdmin() !== null;
  }

  // Initialize admin session check
  initialize(): AdminUser | null {
    return this.getCurrentAdmin();
  }
}

const adminAuthService = new AdminAuthService();
export default adminAuthService;
