"use client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "next-themes";
import React from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2, // PRD: automatic retry for network errors
        refetchOnWindowFocus: true,
        staleTime: 60 * 1000, // 1 minute default
        gcTime: 5 * 60 * 1000, // 5 minutes default (v5: use gcTime instead of cacheTime)
      },
      mutations: {
        retry: 1,
      },
    },
  }));
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        {children}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </ThemeProvider>
  );
} 