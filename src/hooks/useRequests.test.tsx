import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { render, waitFor, act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import * as storage from '@/lib/storage';

import { useRequests, Request } from './useRequests';

const TEST_KEY = 'requests';

describe('useRequests (TanStack Query)', () => {
  it('caches and invalidates data', async () => {
    // Mock storage driver
    let data = [{ id: 1, name: 'A' }];
    vi.spyOn(storage, 'getActiveDriver').mockReturnValue({
      get: ((_key: string) => Promise.resolve(data)) as <T = unknown>(key: string) => Promise<T | null>,
      set: vi.fn(),
    });

    const queryClient = new QueryClient();
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    function TestComponent() {
      const { data: reqs, isLoading } = useRequests();
      const qc = useQueryClient();
      return (
        <div>
          <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
          <div data-testid="data">{reqs ? reqs.map((r: Request) => typeof r.name === 'string' ? r.name : '').join(',') : ''}</div>
          <button onClick={() => qc.invalidateQueries({ queryKey: [TEST_KEY] })}>Invalidate</button>
        </div>
      );
    }

    const { getByTestId, getByText } = render(<TestComponent />, { wrapper: Wrapper });

    // Wait for initial load
    await waitFor(() => expect(getByTestId('loading').textContent).toBe('ready'));
    expect(getByTestId('data').textContent).toBe('A');

    // Change data and invalidate
    act(() => {
      data = [{ id: 2, name: 'B' }];
      getByText('Invalidate').click();
    });

    await waitFor(() => expect(getByTestId('data').textContent).toBe('B'));
  });

  it('should handle request updates', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    renderHook(() => useRequests(), { wrapper });
  });
}); 