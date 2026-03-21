const API_BASE = import.meta.env.VITE_API_URL || '/api/v2';
const BACKEND_BASE = import.meta.env.VITE_API_URL?.replace('/api/v2', '').replace('/api', '') || '';

const getMusicUrl = (path: string) => {
  if (BACKEND_BASE) {
    return `${BACKEND_BASE}${path}`;
  }
  return path;
};

type JsonObject = Record<string, unknown>;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(username: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async refreshToken() {
    return this.request('/auth/refresh', { method: 'POST' });
  }

  // User endpoints
  async getProfile() {
    return this.request('/user/profile');
  }

  async getAchievements() {
    return this.request('/achievements');
  }

  async updateProfile(data: JsonObject) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/user/avatar`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  }

  async deleteAvatar() {
    return this.request('/user/avatar', { method: 'DELETE' });
  }

  async uploadBanner(file: File) {
    const formData = new FormData();
    formData.append('banner', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/user/banner`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      try {
        const errorData = JSON.parse(body) as { error?: string };
        throw new Error(errorData.error || 'Banner upload failed');
      } catch {
        throw new Error(body || 'Banner upload failed');
      }
    }
    return response.json();
  }

  async deleteBanner() {
    return this.request('/user/banner', { method: 'DELETE' });
  }

  async uploadAvatarDecoration(file: File) {
    const formData = new FormData();
    formData.append('avatar_decoration', file);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/user/avatar-decoration`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) throw new Error('Decoration upload failed');
    return response.json();
  }

  async deleteAvatarDecoration() {
    return this.request('/user/avatar-decoration', { method: 'DELETE' });
  }

  async getProfileAssets() {
    return this.request('/user/profile-assets');
  }

  async uploadProfileAsset(file: File, kind = 'decoration', target = 'avatar') {
    const formData = new FormData();
    formData.append('asset', file);
    formData.append('kind', kind);
    formData.append('target', target);
    formData.append('name', file.name);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/user/profile-assets`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) throw new Error('Profile asset upload failed');
    return response.json();
  }

  async deleteProfileAsset(assetId: string) {
    return this.request(`/user/profile-assets/${assetId}`, { method: 'DELETE' });
  }

  async saveProfileCustomization(data: JsonObject) {
    return this.request('/user/profile/customization', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Room endpoints
  async getRooms() {
    return this.request('/rooms');
  }

  async createRoom(data: JsonObject) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const api = new ApiClient();
export { getMusicUrl };
