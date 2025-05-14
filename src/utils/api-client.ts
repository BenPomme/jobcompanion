import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

/**
 * Helper function to call Firebase Functions with authentication
 */
export async function callAuthenticatedFunction<T, R>(
  functionName: string,
  data: T
): Promise<R> {
  try {
    const auth = getAuth();
    
    // Ensure user is logged in
    if (!auth.currentUser) {
      throw new Error('You must be logged in to perform this action');
    }
    
    // Get Firebase Functions instance
    const functions = getFunctions(getApp());
    
    // Create a callable function reference
    const callableFunction = httpsCallable<T, R>(functions, functionName);
    
    // Call the Firebase Function
    const result = await callableFunction(data);
    
    return result.data;
  } catch (error: any) {
    console.error(`Error calling Firebase function ${functionName}:`, error);
    throw new Error(error.message || `Failed to execute ${functionName}`);
  }
}

/**
 * Helper function to call API endpoints with auth token
 */
export async function callApiWithAuth<T, R>(endpoint: string, data: T): Promise<R> {
  try {
    const auth = getAuth();
    
    // Ensure user is logged in
    if (!auth.currentUser) {
      throw new Error('You must be logged in to perform this action');
    }
    
    // Get the user's ID token
    const token = await auth.currentUser.getIdToken();
    
    // Call the API with the token in the Authorization header
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    return await response.json() as R;
  } catch (error: any) {
    console.error(`Error calling API endpoint ${endpoint}:`, error);
    throw new Error(error.message || `Failed to call ${endpoint}`);
  }
}

/**
 * Generate documents using Firebase Functions
 */
export async function generateDocuments(profileData: any, jobData: any) {
  return callAuthenticatedFunction<
    { profileData: any; jobData: any },
    { cv: string; coverLetter: string }
  >('generateDocuments', { profileData, jobData });
}

/**
 * Parse CV using Firebase Functions
 */
export async function parseCV(cvText: string) {
  return callAuthenticatedFunction<
    { cvText: string },
    { parsedData: any }
  >('parseCV', { cvText });
}

/**
 * Parse LinkedIn job using Firebase Functions
 */
export async function parseLinkedInJob(url: string) {
  return callAuthenticatedFunction<
    { url: string },
    { jobDetails: string; url: string }
  >('parseLinkedInJob', { url });
}