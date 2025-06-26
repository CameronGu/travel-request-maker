import { render, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { useUIStore } from './useUIStore';

function TestComponent() {
  const { isModalOpen, setModalOpen, selectedTravelers, setSelectedTravelers, formDraft, setFormDraft } = useUIStore();
  return (
    <div>
      <button onClick={() => setModalOpen(!isModalOpen)}>{isModalOpen ? 'Close' : 'Open'} Modal</button>
      <button onClick={() => setSelectedTravelers(['a', 'b'])}>Set Travelers</button>
      <button onClick={() => setFormDraft({ foo: 'bar' })}>Set Draft</button>
      <div data-testid="modal">{isModalOpen ? 'open' : 'closed'}</div>
      <div data-testid="travelers">{selectedTravelers.join(',')}</div>
      <div data-testid="draft">{String(formDraft.foo ?? '')}</div>
    </div>
  );
}

describe('useUIStore (Zustand)', () => {
  it('persists state across unmount/remount', () => {
    const { getByText, getByTestId, unmount } = render(<TestComponent />);

    // Open modal, set travelers, set draft
    act(() => {
      getByText('Open Modal').click();
      getByText('Set Travelers').click();
      getByText('Set Draft').click();
    });

    expect(getByTestId('modal').textContent).toBe('open');
    expect(getByTestId('travelers').textContent).toBe('a,b');
    expect(getByTestId('draft').textContent).toBe('bar');

    // Unmount and remount
    unmount();
    const { getByTestId: getByTestId2 } = render(<TestComponent />);

    // State should persist
    expect(getByTestId2('modal').textContent).toBe('open');
    expect(getByTestId2('travelers').textContent).toBe('a,b');
    expect(getByTestId2('draft').textContent).toBe('bar');
  });
}); 