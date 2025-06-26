import React from "react";

/**
 * TravelerSelector
 * -----------------------------------------------------------------------------
 * Multi-select traveler picker (stub). To be replaced with full implementation:
 * - Combobox with chips (see PRD 8.7)
 * - Validation and accessibility
 * - Integration with traveler data and permissions
 */
export default function TravelerSelector({ value, onChange, editable = true }: { value: string[]; onChange: (ids: string[]) => void; editable?: boolean }) {
  // TODO: Replace with real traveler list and chip UI per PRD 8.7
  return (
    <div className="border border-gray-300 p-2 rounded mb-2">
      <div>Traveler Selector [stub]</div>
      <div>Selected: {value?.join(", ") || "None"}</div>
      {editable && (
        <button type="button" onClick={() => onChange([...(value || []), `traveler${(value?.length || 0) + 1}`])}>
          + Add Traveler (stub)
        </button>
      )}
    </div>
  );
} 