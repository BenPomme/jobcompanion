import { auth } from './firebase';

// Define base API URL - use hosted URL in production and localhost in development
const API_BASE_URL = 
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://us-central1-cvjob-3a4ed.cloudfunctions.net/api'
    : 'http://localhost:3000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  requiresAuth?: boolean;
}

/**
 * Makes an API request to our Firebase Functions
 * Handles authentication headers automatically if requiresAuth is true
 */
export async function apiRequest<T>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<T> {
  const { 
    method = 'GET', 
    body, 
    requiresAuth = true 
  } = options;

  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('API requests can only be made on the client side');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if required
  if (requiresAuth) {
    try {
      if (!auth) {
        console.warn('[apiRequest] Auth not initialized for API request');
      } else {
        const token = await auth.currentUser?.getIdToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else if (requiresAuth) {
          console.warn('[apiRequest] Authentication required but no token available');
        }
      }
    } catch (error) {
      console.error('[apiRequest] Error getting auth token:', error);
    }
  }

  // Build request object
  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'omit',
    mode: 'cors',
  };

  if (method !== 'GET' && body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    console.log(`[apiRequest] Fetching:`, { url, method, headers, body });
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[apiRequest] API error response:`, errorData);
      throw new Error(
        errorData.message || `API request failed with status ${response.status}`
      );
    }
    const json = await response.json();
    console.log(`[apiRequest] Success:`, json);
    return json;
  } catch (error) {
    console.error('[apiRequest] API request error:', error);
    throw error;
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  
  put: <T>(endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
  
  delete: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) => 
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Generate documents using Firebase API
 */
export async function generateDocuments(profileData: any, jobData: any) {
  return api.post<{ cv: string; coverLetter: string }>(
    'generate',
    { profileData, jobData }
  );
}

/**
 * Parse CV using Firebase API
 */
export async function parseCV(cvText: string) {
  return api.post<{ parsedData: any }>(
    'parse-cv',
    { cvText }
  );
}

/**
 * Parse LinkedIn job using Firebase API
 */
export async function parseLinkedInJob(url: string) {
  return api.post<{ jobDetails: string; url: string }>(
    'linkedin/job',
    { url }
  );
}

/**
 * Get LinkedIn authorization URL
 */
export async function getLinkedInAuthUrl() {
  console.log('[getLinkedInAuthUrl] Called');
  return api.get<{ authUrl: string }>(
    'linkedin/auth',
    { requiresAuth: false }
  );
}

/**
 * Handle LinkedIn callback with authorization code
 */
export async function processLinkedInCallback(code: string) {
  console.log('[processLinkedInCallback] Called with code:', code);
  return api.post<{ profile: any }>(
    'linkedin/callback',
    { code },
    { requiresAuth: false }
  );
}