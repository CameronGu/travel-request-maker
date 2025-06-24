"use client";

import React from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";

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

// PRD-aligned FieldDefinition interface
interface FieldDefinition {
  id: string; // stable, camelCase identifier
  label: string;
  type: string;
  required?: boolean | string; // true, false, or conditional string
  tooltip?: string;
  notes?: string;
  options?: { label: string; value: string }[]; // for select, radio, etc.
  logic?: string; // concise behaviour/dependency rules
  // Additional fields for advanced types (array, object, etc.)
  [key: string]: any;
}

interface DynamicFormProps {
  schema: FieldDefinition[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  // Optionally: custom field renderers, overrides, etc.
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    // Log error
    // eslint-disable-next-line no-console
    console.error("DynamicForm error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong rendering the form.</div>;
    }
    return this.props.children;
  }
}

// Field type to component mapping (factory pattern)
const fieldComponentMap: Record<string, (field: FieldDefinition, register: any, errors: any) => React.ReactNode> = {
  text: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <input
        id={field.id}
        {...register(field.id, { required: !!field.required })}
        type="text"
      />
      {errors[field.id] && <span style={{ color: 'red' }}>Required</span>}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  select: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <select id={field.id} {...register(field.id, { required: !!field.required })}>
        <option value="">Select...</option>
        {field.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors[field.id] && <span style={{ color: 'red' }}>Required</span>}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  radio: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <div>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </div>
      {field.options?.map(opt => (
        <label key={opt.value} style={{ marginRight: 12 }}>
          <input type="radio" value={opt.value} {...register(field.id, { required: !!field.required })} /> {opt.label}
        </label>
      ))}
      {errors[field.id] && <span style={{ color: 'red' }}>Required</span>}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  checkbox: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>
        <input id={field.id} type="checkbox" {...register(field.id)} /> {field.label}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  date: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <input id={field.id} type="date" {...register(field.id, { required: !!field.required })} />
      {errors[field.id] && <span style={{ color: 'red' }}>Required</span>}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  textarea: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <textarea id={field.id} {...register(field.id, { required: !!field.required })} />
      {errors[field.id] && <span style={{ color: 'red' }}>Required</span>}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  hidden: (field, register, errors) => (
    <input key={field.id} id={field.id} type="hidden" {...register(field.id)} />
  ),
  // Stubs for advanced types (to be implemented)
  map: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Map input not yet implemented]</div>
    </div>
  ),
  slider: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}</label>
      <input id={field.id} type="range" min={field.min || 0} max={field.max || 100} {...register(field.id)} />
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  array: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Array input not yet implemented]</div>
    </div>
  ),
  object: (field, register, errors) => (
    <div key={field.id} style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Object input not yet implemented]</div>
    </div>
  ),
  // Add more as needed
};

export default function DynamicForm({ schema, initialValues = {}, onSubmit }: DynamicFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initialValues });

  const renderField = (field: FieldDefinition) => {
    const renderer = fieldComponentMap[field.type];
    if (renderer) return renderer(field, register, errors);
    return <div key={field.id} style={{ color: 'red' }}>Unsupported field type: {field.type}</div>;
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit(onSubmit)}>
        {schema.map(renderField)}
        <button type="submit">Submit</button>
      </form>
    </ErrorBoundary>
  );
}

// Utility: Load and parse a form schema from a JSON file in src/form-fields
export async function loadFormSchema(schemaName: string): Promise<FieldDefinition[]> {
  try {
    // Dynamic import for local JSON files (e.g., 'fields.hotel.json')
    const mod = await import(`../form-fields/${schemaName}`);
    const schema = mod.default || mod;
    if (Array.isArray(schema) && schema.every(isFieldDefinition)) {
      return schema;
    }
    throw new Error("Invalid schema format: expected array of field definitions");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to load schema:", err);
    throw err;
  }
}

function isFieldDefinition(obj: any): obj is FieldDefinition {
  return obj && typeof obj === "object" && typeof obj.id === "string" && typeof obj.type === "string";
}
