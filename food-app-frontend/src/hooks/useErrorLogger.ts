import { useCallback } from 'react';

interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Centralized error logging hook
 * Placeholder for Sentry integration
 */
export function useErrorLogger() {
  const logError = useCallback(
    (error: Error | string, context?: ErrorContext) => {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;

      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('Error logged:', {
          message: errorMessage,
          stack: errorStack,
          context,
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: Integrate with Sentry
      // if (import.meta.env.PROD) {
      //   Sentry.captureException(error, {
      //     tags: {
      //       component: context?.component,
      //       action: context?.action,
      //     },
      //     user: {
      //       id: context?.userId,
      //     },
      //     extra: context?.metadata,
      //   });
      // }

      // You can also send to your own error tracking endpoint
      // api.post('/errors', {
      //   message: errorMessage,
      //   stack: errorStack,
      //   context,
      //   timestamp: new Date().toISOString(),
      // });
    },
    []
  );

  const logWarning = useCallback(
    (message: string, context?: ErrorContext) => {
      if (import.meta.env.DEV) {
        console.warn('Warning logged:', {
          message,
          context,
          timestamp: new Date().toISOString(),
        });
      }

      // TODO: Integrate with Sentry
      // if (import.meta.env.PROD) {
      //   Sentry.captureMessage(message, {
      //     level: 'warning',
      //     tags: context,
      //   });
      // }
    },
    []
  );

  return {
    logError,
    logWarning,
  };
}

