import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Not relevant for mobile, but explicit
    },
    mutations: {
      retry: 1,
      onError: __DEV__
        ? (error: unknown) => {
            console.warn("[Mutation Error]", error);
          }
        : undefined,
    },
  },
});
