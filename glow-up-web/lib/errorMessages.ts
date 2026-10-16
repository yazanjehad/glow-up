/**
 * Utility functions for handling and displaying user-friendly error messages
 */

export interface ErrorMessageOptions {
  isRTL?: boolean;
  defaultMessage?: string;
}

/**
 * Convert technical error messages to user-friendly ones
 */
export function getUserFriendlyErrorMessage(
  error: any,
  options: ErrorMessageOptions = {}
): string {
  const { isRTL = false, defaultMessage } = options;

  // Extract error information
  const statusCode = error?.response?.status || error?.status;
  const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
  const errorMessage = error?.message;

  // Handle specific status codes with user-friendly messages
  switch (statusCode) {
    case 400:
      if (backendMessage) {
        // If backend provides a specific message, use it
        return backendMessage;
      }
      return isRTL
        ? "البيانات المدخلة غير صحيحة. يرجى التحقق من المعلومات والمحاولة مرة أخرى"
        : "Invalid data provided. Please check your information and try again";

    case 401:
      return isRTL
        ? "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى"
        : "Session expired. Please log in again";

    case 403:
      return isRTL
        ? "ليس لديك صلاحية للوصول إلى هذا المحتوى"
        : "You don't have permission to access this content";

    case 404:
      return isRTL
        ? "المحتوى المطلوب غير موجود"
        : "The requested content was not found";

    case 409:
      if (backendMessage) {
        return backendMessage;
      }
      return isRTL
        ? "البيانات موجودة مسبقاً"
        : "Data already exists";

    case 422:
      if (backendMessage) {
        return backendMessage;
      }
      return isRTL
        ? "البيانات المدخلة غير صالحة"
        : "Invalid data provided";

    case 429:
      return isRTL
        ? "تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة لاحقاً"
        : "Too many requests. Please try again later";

    case 500:
    case 502:
    case 503:
    case 504:
      return isRTL
        ? "حدث خطأ في الخادم. يرجى المحاولة لاحقاً"
        : "Server error. Please try again later";

    default:
      // Check if it's a network error
      if (error?.request && !error?.response) {
        return isRTL
          ? "خطأ في الاتصال. يرجى التحقق من الإنترنت والمحاولة مرة أخرى"
          : "Connection error. Please check your internet and try again";
      }

      // Use backend message if available
      if (backendMessage) {
        return backendMessage;
      }

      // Use error message if available and not technical
      if (errorMessage && !errorMessage.includes("status code")) {
        return errorMessage;
      }

      // Use default message or fallback
      return (
        defaultMessage ||
        (isRTL
          ? "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى"
          : "An unexpected error occurred. Please try again")
      );
  }
}

/**
 * Get a short error message for toasts/alerts
 */
export function getShortErrorMessage(error: any, isRTL: boolean = false): string {
  const statusCode = error?.response?.status || error?.status;

  switch (statusCode) {
    case 400:
      return isRTL ? "بيانات غير صحيحة" : "Invalid data";
    case 401:
      return isRTL ? "انتهت الجلسة" : "Session expired";
    case 403:
      return isRTL ? "غير مصرح" : "Unauthorized";
    case 404:
      return isRTL ? "غير موجود" : "Not found";
    case 500:
      return isRTL ? "خطأ في الخادم" : "Server error";
    default:
      return isRTL ? "حدث خطأ" : "Error occurred";
  }
}
