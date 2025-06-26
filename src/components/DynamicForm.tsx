"use client";

import type { FieldDefinition, DynamicFormProps } from './DynamicForm/types';
import type { FieldError, Control } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { logger } from '../lib/utils';

import fieldComponentMap from './DynamicForm/FieldMap';
import { shouldShowField } from './DynamicForm/useVisibility';
import ErrorBoundary from './ErrorBoundary';

/**
 * DynamicForm
 * ----------------------------------------------------------------------------
 * JSON-driven form component (placeholder).
 *
 * TODO:
 * • Accept a field-definition JSON prop.
 * • Build inputs dynamically.
 * • Integrate React Hook Form + zod validation.
 */

// Add this helper function at the top (or inside the component)
function extractErrorMessages(err: unknown, key?: string): string[] {
  if (!err) return [];
  if (typeof err === 'string') {
    // Filter out generic error type strings
    const genericTypes = ['required', 'min', 'max', 'pattern', 'email', 'string', 'number', 'date', 'invalid_type', 'too_small', 'too_big'];
    if (genericTypes.includes(err)) return [];
    return [err];
  }
  if (typeof err === 'object') {
    let messages: string[] = [];
    // Type guards for error properties
    const hasType = (e: unknown): e is { type: string } => typeof e === 'object' && e !== null && 'type' in e && typeof (e as { type: unknown }).type === 'string';
    const hasMessage = (e: unknown): e is { message: string } => typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string';
    // Synthesize required message if needed
    if (hasType(err) && err.type === 'required' && (!hasMessage(err) || err.message === '')) {
      let label = key || 'This field';
      label = label.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
      label = label.charAt(0).toUpperCase() + label.slice(1);
      messages.push(`${label} is required`);
    } else if (hasMessage(err) && err.message) {
      messages.push(err.message);
    }
    if ('types' in err && err.types && typeof err.types === 'object') {
      messages = messages.concat(Object.values(err.types as Record<string, unknown>).flatMap((v) => extractErrorMessages(v, key)));
    }
    if (Array.isArray(err)) {
      messages = messages.concat((err as unknown[]).flatMap((v) => extractErrorMessages(v, key)));
    }
    Object.entries(err).forEach(([k, v]) => {
      if (k === 'ref') return;
      if (typeof v === 'object' || typeof v === 'string') {
        messages = messages.concat(extractErrorMessages(v, k));
      }
    });
    // Filter out generic error type strings at the end as well
    const genericTypes = ['required', 'min', 'max', 'pattern', 'email', 'string', 'number', 'date', 'invalid_type', 'too_small', 'too_big'];
    return messages.filter(msg => msg && !genericTypes.includes(msg));
  }
  return [];
}

// Inner form component that is remounted when visibleFields or resolver changes
function DynamicFormInner({
  visibleFields,
  _initialValues,
  onSubmit,
  register,
  control,
  errors,
  handleSubmit,
}: {
  visibleFields: FieldDefinition[];
  _initialValues: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  register: ReturnType<typeof useForm>["register"];
  control: Control<Record<string, unknown>>;
  errors: ReturnType<typeof useForm>["formState"]["errors"];
  handleSubmit: ReturnType<typeof useForm>["handleSubmit"];
}) {
  // DEBUG: Log errors for test
  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'test' &&
    process.env.DEBUG_DYNAMIC_FORM === '1'
  ) {
    logger.log('DynamicFormInner errors:', errors);
  }
  const handleDynamicSubmit = (values: unknown) => {
    onSubmit(values as Record<string, unknown>);
  };
  const renderField = (field: FieldDefinition) => {
    const fieldError = errors[field.id] as FieldError | undefined;
    const errorMsg = fieldError?.message;
    return (
      <div key={field.id} className="mb-4">
        {fieldComponentMap[field.type]
          ? fieldComponentMap[field.type](field, register, { control })
          : <div className="text-red-500">Unsupported field type: {field.type}</div>}
        {errorMsg && (
          <span role="alert" className="text-red-500 block mt-1">{errorMsg}</span>
        )}
      </div>
    );
  };
  return (
    <form onSubmit={handleSubmit(handleDynamicSubmit)}>
      {/* Render all errors at the top for easier test matching */}
      {Object.keys(errors).length > 0 && (
        <div className="text-red-500 mt-2">
          {Object.entries(errors).flatMap(([key, err]) =>
            extractErrorMessages(err, key).map((msg, i) => <div key={key + i}>{msg}</div>)
          )}
        </div>
      )}
      {visibleFields.map(renderField)}
      <button type="submit">Submit</button>
    </form>
  );
}

export default function DynamicForm({ schema, initialValues = {} as Record<string, unknown>, onSubmit, zodSchema }: DynamicFormProps) {
  // Use a single form instance for both registration and value watching
  const form = useForm<Record<string, unknown>>({
    defaultValues: initialValues,
    resolver: zodSchema ? zodResolver(zodSchema as z.ZodObject<z.ZodRawShape>) : undefined,
    mode: 'onChange',
    shouldUnregister: false,
  });
  const allValues = form.watch();
  const visibleFields = React.useMemo(
    () => schema.filter(field => shouldShowField(field, allValues)),
    [schema, allValues]
  );
  const formKey = visibleFields.map(f => f.id).join(',');
  // DEBUG: Log values and visibleFields to help diagnose
  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'test' &&
    process.env.DEBUG_DYNAMIC_FORM === '1'
  ) {
    logger.log('DynamicForm values:', allValues);
    logger.log('DynamicForm visibleFields:', visibleFields.map(f => f.id));
  }
  return (
    <ErrorBoundary>
      <DynamicFormInner
        key={formKey}
        visibleFields={visibleFields}
        _initialValues={initialValues}
        onSubmit={onSubmit}
        // Pass form methods to inner form
        register={form.register}
        control={form.control}
        errors={form.formState.errors}
        handleSubmit={form.handleSubmit}
      />
    </ErrorBoundary>
  );
}

// Utility: Load and parse a form schema from a JSON file in src/form-fields
export async function loadFormSchema(schemaName: string): Promise<FieldDefinition[]> {
  try {
    // Dynamic import for local JSON files (e.g., 'fields.hotel.json')
    const mod = await import(`../form-fields/${schemaName}.json`);
    const schema = mod.default || mod;
    if (Array.isArray(schema) && schema.every(isFieldDefinition)) {
      return schema;
    }
    throw new Error("Invalid schema format: expected array of field definitions");
  } catch (err) {
    // eslint-disable-next-line no-console
    logger.error("Failed to load schema:", err);
    throw err;
  }
}

function isFieldDefinition(obj: unknown): obj is FieldDefinition {
  if (typeof obj === 'object' && obj !== null) {
    const rec = obj as Record<string, unknown>;
    return typeof rec.id === 'string' && typeof rec.type === 'string';
  }
  return false;
}

// TODO: Split this file into DynamicForm/index.tsx, DynamicForm/useVisibility.ts, DynamicForm/FieldMap.tsx
