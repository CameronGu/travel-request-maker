import type { FieldDefinition } from './types';

import React from 'react';
import { Controller, UseFormRegister, Control, FieldValues } from 'react-hook-form';

import TravelerSelector from '../TravelerSelector';

const fieldComponentMap: Record<string, (field: FieldDefinition, register: UseFormRegister<FieldValues>, extra: { control?: Control<FieldValues>; initialValue?: unknown }) => React.ReactNode> = {
  text: (field, register, _extra) => (
    <div className="mb-4">
      <label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
      </label>
      <input
        id={field.id}
        {...register(field.id, { required: !!field.required })}
        type="text"
        className="border rounded px-2 py-1 w-full"
      />
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  select: (field, register, _extra) => {
    let selectOptions: {label: string, value: string}[] = [];
    if (Array.isArray(field.options) && field.options.length > 0) {
      const first = field.options[0];
      if (typeof first === 'string' && field.options.every(opt => typeof opt === 'string')) {
        selectOptions = (field.options as string[]).map(opt => ({ label: opt, value: opt }));
      } else if (
        typeof first === 'object' &&
        first !== null &&
        'label' in first &&
        'value' in first &&
        field.options.every(opt => typeof opt === 'object' && opt !== null && 'label' in opt && 'value' in opt)
      ) {
        selectOptions = field.options as {label: string, value: string}[];
      }
    }
    return (
      <div className="mb-4">
        <label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
          {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
        </label>
        <select id={field.id} {...register(field.id, { required: !!field.required })} className="border rounded px-2 py-1 w-full">
          <option value="">Select...</option>
          {selectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
      </div>
    );
  },
  radio: (field, register, _extra) => (
    <div className="mb-4">
      <div>
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
      </div>
      {field.options?.map(opt => (
        <label key={opt.value} className="mr-3">
          <input type="radio" value={opt.value} {...register(field.id, { required: !!field.required })} /> {opt.label}
        </label>
      ))}
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  checkbox: (field, register, _extra) => (
    <div className="mb-4">
      <label htmlFor={field.id}>
        <input id={field.id} type="checkbox" {...register(field.id)} /> {field.label}
        {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
      </label>
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  date: (field, register, _extra) => (
    <div className="mb-4">
      <label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
      </label>
      <input id={field.id} type="date" {...register(field.id, { required: !!field.required })} className="border rounded px-2 py-1 w-full" />
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  textarea: (field, register, _extra) => (
    <div className="mb-4">
      <label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        {field.tooltip && <span title={String(field.tooltip)} className="ml-1 cursor-help">🛈</span>}
      </label>
      <textarea id={field.id} {...register(field.id, { required: !!field.required })} className="border rounded px-2 py-1 w-full" />
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  hidden: (field, register, _extra) => (
    <input id={field.id} type="hidden" {...register(field.id)} />
  ),
  map: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[Map input not yet implemented]</div>
    </div>
  ),
  slider: (field, register, _extra) => (
    <div className="mb-4">
      <label htmlFor={field.id}>{field.label}</label>
      <input id={field.id} type="range" min={Number(field.min) || 0} max={Number(field.max) || 100} {...register(field.id)} className="w-full" />
      {field.notes && <div className="text-xs text-gray-500">{field.notes}</div>}
    </div>
  ),
  array: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[Array input not yet implemented]</div>
    </div>
  ),
  object: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[Object input not yet implemented]</div>
    </div>
  ),
  travelerMultiSelect: (field, _register, extra) => {
    const { control, initialValue } = extra as { control: Control<Record<string, unknown>>; initialValue?: unknown };
    return (
      <Controller
        name={field.id}
        control={control}
        defaultValue={initialValue || []}
        render={({ field: rhfField }: { field: FieldValues }) => (
          <TravelerSelector value={rhfField.value || []} onChange={rhfField.onChange} editable={true} />
        )}
      />
    );
  },
  mapAutocomplete: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[MapAutocomplete input not yet implemented]</div>
    </div>
  ),
  dynamicMapAirport: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[DynamicMapAirport input not yet implemented]</div>
    </div>
  ),
  time: (field, _register, _extra) => (
    <div className="mb-4 text-gray-500">
      <label>{field.label}</label>
      <div>[Time input not yet implemented]</div>
    </div>
  ),
};

export default fieldComponentMap; 