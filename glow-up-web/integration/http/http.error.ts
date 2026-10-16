import { getUserFriendlyErrorMessage } from '@/lib/errorMessages';

// Error shape
export interface HttpError {
  message: string          
  statusCode?: number     
  details?: any          
}

// Throwable class
export class ApiError extends Error implements HttpError {
  public statusCode?: number
  public details?: any

  constructor(message: string, statusCode?: number, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, ApiError.prototype)  
  }
}

// Convert Axios/network errors to HttpError with user-friendly messages
export const handleHttpError = (error: any, isRTL: boolean = false): HttpError => {
  const statusCode = error?.response?.status || error?.status;
  const userFriendlyMessage = getUserFriendlyErrorMessage(error, { isRTL });

  // Axios response error
  if (error.response) {
    return new ApiError(
      userFriendlyMessage,
      statusCode,
      error.response.data
    )
  }

  // Network error
  if (error.request) {
    return new ApiError(userFriendlyMessage)
  }

  // Unknown error
  return new ApiError(userFriendlyMessage)
}
