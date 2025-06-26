import { z } from 'zod';

export interface FieldDefinition {
  id: string;
  label: string;
  type: string;
  required?: boolean | string;
  tooltip?: string;
  notes?: string;
  options?: { label: string; value: string }[];
  logic?: string;
  showWhen?: Record<string, unknown>;
  showWhenAny?: Record<string, unknown>[];
  [key: string]: unknown;
}

export interface DynamicFormProps {
  schema: FieldDefinition[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void;
  zodSchema?: z.ZodType<unknown, z.ZodTypeDef, unknown>;
} 