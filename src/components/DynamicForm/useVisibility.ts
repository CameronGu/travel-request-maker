import type { FieldDefinition } from './types';

import { z } from 'zod';

export function shouldShowField(field: FieldDefinition, values: Record<string, unknown>): boolean {
  if (field.showWhen) {
    return Object.entries(field.showWhen).every(([dep, val]) => values[dep] === val);
  }
  if (field.showWhenAny) {
    return field.showWhenAny.some((cond: Record<string, unknown>) =>
      Object.entries(cond).every(([dep, val]) => values[dep] === val)
    );
  }
  return true;
}

export function buildVisibleZodSchema(fields: FieldDefinition[]): z.ZodObject<z.ZodRawShape, 'strip', z.ZodTypeAny, Record<string, unknown>, Record<string, unknown>> {
  const shape: z.ZodRawShape = {};
  for (const field of fields) {
    let zodType: z.ZodTypeAny = z.any();
    switch (field.type) {
      case 'text':
      case 'textarea':
        zodType = z.string();
        break;
      case 'select':
      case 'radio':
        zodType = z.string();
        break;
      case 'checkbox':
        zodType = z.boolean().optional();
        break;
      case 'date':
        zodType = z.string();
        break;
      case 'slider':
        zodType = z.number();
        break;
      case 'travelerMultiSelect':
        zodType = z.array(z.string());
        break;
      default:
        zodType = z.any();
    }
    if (field.required) {
      if ((zodType instanceof z.ZodString) && (field.type === 'text' || field.type === 'textarea' || field.type === 'select' || field.type === 'radio' || field.type === 'date')) {
        zodType = zodType.nonempty({ message: `${field.label} is required` });
      } else if (zodType instanceof z.ZodArray && field.type === 'travelerMultiSelect') {
        zodType = zodType.min(1, { message: `${field.label} is required` });
      }
    } else {
      zodType = zodType.optional();
    }
    shape[field.id] = zodType;
  }
  return z.object(shape);
} 