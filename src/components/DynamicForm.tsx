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
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
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
          {(Object.entries(errors) as [string, FieldError][]).map(([key, err]) => (
            <div key={key}>{err.message || "Invalid value"}</div>
          ))}
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
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
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
