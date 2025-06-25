"use client";

import React from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  showWhen?: Record<string, any>;
  showWhenAny?: Record<string, any>[];
  // Additional fields for advanced types (array, object, etc.)
  [key: string]: any;
}

interface DynamicFormProps {
  schema: FieldDefinition[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  zodSchema?: z.ZodType<any, any>;
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

// TravelerSelector stub (to be extracted to its own file)
function TravelerSelector({ value, onChange, editable = true }: { value: string[]; onChange: (ids: string[]) => void; editable?: boolean }) {
  // TODO: Replace with real traveler list and chip UI
  return (
    <div style={{ border: '1px solid #ccc', padding: 8, borderRadius: 8, marginBottom: 8 }}>
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

// Field type to component mapping (factory pattern)
const fieldComponentMap: Record<string, (field: FieldDefinition, register: any, extra: any) => React.ReactNode> = {
  text: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <input
        id={field.id}
        {...register(field.id, { required: !!field.required })}
        type="text"
      />
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  select: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <select id={field.id} {...register(field.id, { required: !!field.required })}>
        <option value="">Select...</option>
        {field.options?.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  radio: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <div>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </div>
      {field.options?.map(opt => (
        <label key={opt.value} style={{ marginRight: 12 }}>
          <input type="radio" value={opt.value} {...register(field.id, { required: !!field.required })} /> {opt.label}
        </label>
      ))}
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  checkbox: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>
        <input id={field.id} type="checkbox" {...register(field.id)} /> {field.label}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  date: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <input id={field.id} type="date" {...register(field.id, { required: !!field.required })} />
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  textarea: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}{field.required && <span style={{ color: 'red' }}> *</span>}
        {field.tooltip && <span title={field.tooltip} style={{ marginLeft: 4, cursor: 'help' }}>🛈</span>}
      </label>
      <textarea id={field.id} {...register(field.id, { required: !!field.required })} />
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  hidden: (field, register, extra) => (
    <input id={field.id} type="hidden" {...register(field.id)} />
  ),
  // Stubs for advanced types (to be implemented)
  map: (field, register, extra) => (
    <div style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Map input not yet implemented]</div>
    </div>
  ),
  slider: (field, register, extra) => (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={field.id}>{field.label}</label>
      <input id={field.id} type="range" min={field.min || 0} max={field.max || 100} {...register(field.id)} />
      {field.notes && <div style={{ fontSize: 12, color: '#888' }}>{field.notes}</div>}
    </div>
  ),
  array: (field, register, extra) => (
    <div style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Array input not yet implemented]</div>
    </div>
  ),
  object: (field, register, extra) => (
    <div style={{ marginBottom: 16, color: '#888' }}>
      <label>{field.label}</label>
      <div>[Object input not yet implemented]</div>
    </div>
  ),
  travelerMultiSelect: (field, register, extra) => {
    // Use Controller for RHF integration
    const { control } = extra;
    const Controller = require('react-hook-form').Controller;
    return (
      <Controller
        name={field.id}
        control={control}
        defaultValue={extra.initialValue || []}
        render={({ field: rhfField }: { field: any }) => (
          <TravelerSelector value={rhfField.value || []} onChange={rhfField.onChange} editable={true} />
        )}
      />
    );
  },
  // Add more as needed
};

function buildZodSchema(schema: FieldDefinition[]): z.ZodObject<any> {
  const shape: Record<string, any> = {};
  for (const field of schema) {
    let zodType: any = z.any();
    switch (field.type) {
      case "text":
      case "textarea":
        zodType = z.string();
        break;
      case "select":
      case "radio":
        zodType = z.string();
        break;
      case "checkbox":
        zodType = z.boolean().optional();
        break;
      case "date":
        zodType = z.string(); // Could use z.coerce.date() for stricter
        break;
      case "slider":
        zodType = z.number();
        break;
      case "travelerMultiSelect":
        zodType = z.array(z.string());
        break;
      default:
        zodType = z.any();
    }
    if (field.required) {
      if (field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "radio" || field.type === "date") {
        zodType = zodType.nonempty({ message: `${field.label} is required` });
      } else if (field.type === "travelerMultiSelect") {
        zodType = zodType.min(1, { message: `${field.label} is required` });
      } // else leave as is for now
    } else {
      zodType = zodType.optional();
    }
    shape[field.id] = zodType;
  }
  return z.object(shape);
}

export default function DynamicForm({ schema, initialValues = {}, onSubmit, zodSchema }: DynamicFormProps) {
  const [visibleFields, setVisibleFields] = React.useState<FieldDefinition[]>(schema);

  // Helper to evaluate showWhen/showWhenAny
  function shouldShowField(field: FieldDefinition, values: Record<string, any>): boolean {
    if (field.showWhen) {
      return Object.entries(field.showWhen).every(([dep, val]) => values[dep] === val);
    }
    if (field.showWhenAny) {
      return field.showWhenAny.some((cond: Record<string, any>) =>
        Object.entries(cond).every(([dep, val]) => values[dep] === val)
      );
    }
    return true;
  }

  // Only watch the fields that are dependencies for conditional logic
  const dependencyFields = React.useMemo(() => {
    const deps = new Set<string>();
    for (const field of schema) {
      if (field.showWhen) Object.keys(field.showWhen).forEach(dep => deps.add(dep));
      if (field.showWhenAny) field.showWhenAny.forEach((cond: any) => Object.keys(cond).forEach(dep => deps.add(dep)));
    }
    return Array.from(deps);
  }, [schema]);

  // Watch only dependency fields
  const [depValues, setDepValues] = React.useState<Record<string, any>>({});
  const formRef = React.useRef<any>(null);

  // Build a Zod schema for only visible fields
  function buildVisibleZodSchema(fields: FieldDefinition[]): z.ZodObject<any> {
    const shape: Record<string, any> = {};
    for (const field of fields) {
      let zodType: any = z.any();
      switch (field.type) {
        case "text":
        case "textarea":
          zodType = z.string();
          break;
        case "select":
        case "radio":
          zodType = z.string();
          break;
        case "checkbox":
          zodType = z.boolean().optional();
          break;
        case "date":
          zodType = z.string();
          break;
        case "slider":
          zodType = z.number();
          break;
        case "travelerMultiSelect":
          zodType = z.array(z.string());
          break;
        default:
          zodType = z.any();
      }
      if (field.required) {
        if (field.type === "text" || field.type === "textarea" || field.type === "select" || field.type === "radio" || field.type === "date") {
          zodType = zodType.nonempty({ message: `${field.label} is required` });
        } else if (field.type === "travelerMultiSelect") {
          zodType = zodType.min(1, { message: `${field.label} is required` });
        }
      } else {
        zodType = zodType.optional();
      }
      shape[field.id] = zodType;
    }
    return z.object(shape);
  }

  // Memoize the resolver for visible fields
  const resolver = React.useMemo(() =>
    zodResolver(zodSchema || buildVisibleZodSchema(visibleFields)),
    [zodSchema, JSON.stringify(visibleFields)]
  );

  // useForm instance, do not use a changing key
  const { register, handleSubmit, formState: { errors }, watch, getValues, reset, control } =
    require('react-hook-form').useForm({
      defaultValues: initialValues,
      resolver,
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      shouldUnregister: false,
    });

  // Watch dependency fields and update visibleFields when they change
  React.useEffect(() => {
    const subscription = watch((values: any) => {
      setDepValues((prev) => {
        const changed = dependencyFields.some(dep => prev[dep] !== values[dep]);
        if (changed) {
          const newVisible = schema.filter(field => shouldShowField(field, values));
          // Only update if the set of visible field IDs has changed
          const prevIds = visibleFields.map(f => f.id).join(',');
          const newIds = newVisible.map(f => f.id).join(',');
          if (prevIds !== newIds) {
            setVisibleFields(newVisible);
          }
        }
        return values;
      });
    });
    return () => subscription.unsubscribe();
  }, [watch, dependencyFields, schema]);

  // Prefill fields with 'defaultFrom' if not already set
  React.useEffect(() => {
    const updates: Record<string, any> = {};
    schema.forEach(field => {
      if (field.defaultFrom && initialValues[field.id] === undefined) {
        // Try to prefill from initialValues[defaultFrom] or context (not implemented)
        if (initialValues[field.defaultFrom] !== undefined) {
          updates[field.id] = initialValues[field.defaultFrom];
        }
      }
    });
    if (Object.keys(updates).length > 0) {
      reset({ ...getValues(), ...updates });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema]);

  // Custom submit handler: only submit visible fields
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleDynamicSubmit = (values: Record<string, any>) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onSubmit(values);
    requestAnimationFrame(() => setIsSubmitting(false)); // allow next submit after a frame
  };

  const renderField = (field: FieldDefinition) => {
    const currentValues = getValues();
    if (!shouldShowField(field, currentValues)) return null;
    const renderer = fieldComponentMap[field.type];
    const rawErrorMsg = errors[field.id]?.message;
    const errorMsg = typeof rawErrorMsg === 'string' ? rawErrorMsg : undefined;
    // Pass extra props for custom field types
    return (
      <div key={field.id} style={{ marginBottom: 16 }}>
        {renderer ? renderer(field, register, { control, initialValue: initialValues[field.id] }) : (
          <div style={{ color: 'red' }}>Unsupported field type: {field.type}</div>
        )}
        {errorMsg && (
          <span role="alert" style={{ color: 'red', display: 'block', marginTop: 4 }}>{errorMsg}</span>
        )}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit(handleDynamicSubmit)}>
        {schema.map(renderField)}
        <button type="submit">Submit</button>
        {Object.keys(errors).length > 0 && (
          <div style={{ color: 'red', marginTop: 8 }}>
            {Object.entries(errors).map(([key, err]: any) => (
              <div key={key}>{err.message || "Invalid value"}</div>
            ))}
          </div>
        )}
      </form>
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
    console.error("Failed to load schema:", err);
    throw err;
  }
}

function isFieldDefinition(obj: any): obj is FieldDefinition {
  return obj && typeof obj === "object" && typeof obj.id === "string" && typeof obj.type === "string";
}
