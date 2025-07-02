// Stub traveler modal for view/add/edit/delete functionality using local storage.
// This will eventually render modal dialogs for traveler management via active StorageDriver.

import type { FieldDefinition } from "./DynamicForm/types";

import React, { useEffect, useState } from "react";

import { getActiveDriver } from "@/lib/storage";
import { normalizeAndValidatePhone, generateTravelerHash } from "@/lib/validation/phone";

import DynamicForm, { loadFormSchema } from "./DynamicForm";
import ErrorBoundary from "./ErrorBoundary";

interface TravelerModalProps {
  open: boolean;
  onClose: () => void;
  traveler?: Record<string, unknown> & { id?: string };
  clientId?: string;
}

// Helper to ensure error is always a string
function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error && typeof err.message === 'string') return err.message;
  if (err === null || err === undefined) return '';
  return String(err);
}

export default function TravelerModal({ open, onClose, traveler, clientId }: TravelerModalProps) {
  const [schema, setSchema] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Load traveler schema on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadFormSchema("fields.traveler")
      .then((s) => {
        if (mounted) {
          setSchema(s);
          setLoading(false);
        }
      })
      .catch((_err) => {
        setError("Failed to load traveler schema");
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Reset error on open
  useEffect(() => {
    if (open) setError("");
  }, [open]);

  // Submission handler
  const handleTravelerSubmit = async (values: Record<string, unknown>) => {
    const errors: string[] = [];
    // Phone normalization/validation
    const phoneResult = normalizeAndValidatePhone(String(values.phone || ""), "US"); // TODO: country
    let e164Phone = String(values.phone || "");
    if (!phoneResult.success) {
      errors.push(`Phone error: ${phoneResult.error}`);
    } else {
      e164Phone = phoneResult.e164;
    }
    // Email validation (primary)
    const email = String(values.primaryEmail || "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.push("Invalid primary email address");
    }
    if (errors.length > 0) {
      const errorString: string = (errors as string[]).join("\n");
      setError(errorString);
      return;
    }
    // Hash
    const hash = await generateTravelerHash(e164Phone, email);
    // Duplicate detection
    const driver = getActiveDriver();
    let allTravelers: any[] = [];
    try {
      allTravelers = (await driver.get<any[]>("travelers")) || [];
    } catch {}
    // If editing, allow self; otherwise, block if hash matches another traveler's hash
    const isEdit = Boolean(traveler?.id);
    const duplicate = allTravelers.find((t) => t.traveler_hash === hash && (!isEdit || t.id !== traveler?.id));
    if (duplicate) {
      setError("A traveler with the same phone and email already exists.");
      return;
    }
    // Prepare object
    const travelerObj = {
      ...values,
      phone: e164Phone,
      traveler_hash: hash,
      client_id: clientId,
      id: traveler?.id, // for update
    };
    try {
      await driver.set("travelers", travelerObj);
      onClose();
    } catch (_err: unknown) {
      setError(getErrorMessage(_err));
    }
  };

  if (!open) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-black"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-4">{traveler ? "Edit Traveler" : "Add Traveler"}</h2>
          {loading ? (
            <div>Loading form…</div>
          ) : error ? (
            <div className="text-red-500 mb-2" style={{ whiteSpace: 'pre-line' }}>{String(error).split('\n').map((msg, i) => <div key={i}>{msg}</div>)}</div>
          ) : (
            <DynamicForm
              schema={schema}
              initialValues={traveler || {}}
              onSubmit={handleTravelerSubmit}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}