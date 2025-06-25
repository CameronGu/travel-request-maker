// src/lib/queryKeys.ts
// Query key factory for TanStack Query (PRD section 6.2)

export const queryKeys = {
  requests: (projectId?: string) => ["requests", projectId].filter(Boolean),
  travelers: (clientId?: string) => ["travelers", clientId].filter(Boolean),
  links: (clientId?: string, projectId?: string) => ["links", clientId, projectId].filter(Boolean),
  // Add more as needed
}; 