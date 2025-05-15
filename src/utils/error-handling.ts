/**
 * Error Handling Utilities
 * 
 * This file contains utilities for handling errors consistently across the application.
 */

// Error types
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  API = 'api',
  LINKEDIN = 'linkedin',
  OPENAI = 'openai',
  FIREBASE = 'firebase',
  GENERAL = 'general'
}

// Error severities
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error response interface
export interface ErrorResponse {
  type: ErrorType;
  message: string;
  originalError?: any;
  code?: string;
  severity: ErrorSeverity;
  suggestedAction?: string;
}

/**
 * Handles API errors and returns a standardized error response
 */
export function handleApiError(error: any): ErrorResponse {
  // Default error response
  let errorResponse: ErrorResponse = {
    type: ErrorType.GENERAL,
    message: 'An unexpected error occurred',
    originalError: error,
    severity: ErrorSeverity.ERROR
  };

  // Check if it's an Axios error
  if (error.isAxiosError) {
    errorResponse.type = ErrorType.NETWORK;
    
    if (!error.response) {
      errorResponse.message = 'Network error: Could not connect to the server';
      errorResponse.severity = ErrorSeverity.ERROR;
      errorResponse.suggestedAction = 'Please check your internet connection and try again';
    } else {
      // Handle different HTTP status codes
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        errorResponse.type = ErrorType.AUTHENTICATION;
        errorResponse.message = 'Authentication error: You are not authorized to perform this action';
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.suggestedAction = 'Please sign in again to continue';
      } else if (status === 400) {
        errorResponse.type = ErrorType.VALIDATION;
        errorResponse.message = error.response.data?.message || 'Invalid request';
        errorResponse.severity = ErrorSeverity.WARNING;
      } else if (status === 404) {
        errorResponse.type = ErrorType.API;
        errorResponse.message = 'The requested resource was not found';
        errorResponse.severity = ErrorSeverity.WARNING;
      } else if (status >= 500) {
        errorResponse.type = ErrorType.API;
        errorResponse.message = 'Server error: The server encountered an error';
        errorResponse.severity = ErrorSeverity.ERROR;
        errorResponse.suggestedAction = 'Please try again later';
      }
    }
  } 
  // Check for Firebase errors
  else if (error.code && error.code.startsWith('auth/')) {
    errorResponse.type = ErrorType.FIREBASE;
    errorResponse.code = error.code;
    
    // Translate common Firebase auth errors to user-friendly messages
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorResponse.message = 'This email is already registered';
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.suggestedAction = 'Try signing in instead or use a different email';
        break;
      case 'auth/wrong-password':
        errorResponse.message = 'Incorrect password';
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.suggestedAction = 'Check your password and try again';
        break;
      case 'auth/user-not-found':
        errorResponse.message = 'No account found with this email';
        errorResponse.severity = ErrorSeverity.WARNING;
        errorResponse.suggestedAction = 'Check your email or create a new account';
        break;
      case 'auth/too-many-requests':
        errorResponse.message = 'Too many unsuccessful login attempts';
        errorResponse.severity = ErrorSeverity.ERROR;
        errorResponse.suggestedAction = 'Please try again later or reset your password';
        break;
      default:
        errorResponse.message = error.message || 'Firebase authentication error';
        errorResponse.severity = ErrorSeverity.ERROR;
    }
  } 
  // Check for LinkedIn-specific errors
  else if (error.message && (
    error.message.includes('LinkedIn') || 
    error.message.includes('profile') || 
    error.message.includes('extract')
  )) {
    errorResponse.type = ErrorType.LINKEDIN;
    errorResponse.message = error.message;
    errorResponse.severity = ErrorSeverity.WARNING;
    errorResponse.suggestedAction = 'Please check the URL or try manual input instead';
  }
  // Check for OpenAI errors
  else if (error.message && (
    error.message.includes('OpenAI') || 
    error.message.includes('API key') ||
    error.message.includes('generate')
  )) {
    errorResponse.type = ErrorType.OPENAI;
    errorResponse.message = 'AI generation error: ' + error.message;
    errorResponse.severity = ErrorSeverity.ERROR;
    errorResponse.suggestedAction = 'Please try again later or contact support';
  }
  // Use the error message if it exists
  else if (error.message) {
    errorResponse.message = error.message;
  }

  // Log error for debugging
  console.error('[ErrorHandler]', errorResponse);
  
  return errorResponse;
}

/**
 * Format error message for display to user
 */
export function formatErrorMessage(error: ErrorResponse): string {
  let message = error.message;
  
  if (error.suggestedAction) {
    message += `. ${error.suggestedAction}`;
  }
  
  return message;
}

/**
 * Get CSS class for error severity
 */
export function getErrorSeverityClass(severity: ErrorSeverity): string {
  switch (severity) {
    case ErrorSeverity.INFO:
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case ErrorSeverity.WARNING:
      return 'linkedin-alert linkedin-alert-error';
    case ErrorSeverity.ERROR:
      return 'linkedin-alert linkedin-alert-error';
    case ErrorSeverity.CRITICAL:
      return 'bg-red-100 text-red-900 border-red-300';
    default:
      return 'linkedin-alert linkedin-alert-error';
  }
}

/**
 * Create a common error handler for component try/catch blocks
 */
export function createErrorHandler(setError: (error: string) => void) {
  return (err: any) => {
    const errorResponse = handleApiError(err);
    setError(formatErrorMessage(errorResponse));
  };
}

export default {
  handleApiError,
  formatErrorMessage,
  getErrorSeverityClass,
  createErrorHandler,
  ErrorType,
  ErrorSeverity
}; 