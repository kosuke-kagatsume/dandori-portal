'use client';

import { UseFormRegister, FieldErrors, FieldValues } from 'react-hook-form';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  register: UseFormRegister<FieldValues>;
  errors?: FieldErrors;
  helpText?: string;
}

interface SelectFieldProps extends Omit<InputFieldProps, 'type'> {
  options: { value: string; label: string }[];
}

/**
 * ネストしたフィールドパスからエラーを取得するヘルパー関数
 * 例: "currentAddress.postalCode" -> errors.currentAddress.postalCode
 */
function getNestedError(errors: FieldErrors | undefined, path: string) {
  if (!errors) return undefined;

  const keys = path.split('.');
  let current: Record<string, unknown> = errors as Record<string, unknown>;

  for (const key of keys) {
    if (current?.[key] === undefined) return undefined;
    current = current[key] as Record<string, unknown>;
  }

  return current as { message?: string };
}

/**
 * Text Input Field
 */
export function InputField({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
  register,
  errors,
  helpText,
}: InputFieldProps) {
  const error = getNestedError(errors, name);

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name)}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      />
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}

/**
 * Select Field
 */
export function SelectField({
  label,
  name,
  required = false,
  options,
  register,
  errors,
  helpText,
}: SelectFieldProps) {
  const error = getNestedError(errors, name);

  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500'
        }`}
      >
        <option value="">選択してください</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}

/**
 * Checkbox Field
 */
export function CheckboxField({
  label,
  name,
  register,
  errors,
  helpText,
}: Omit<InputFieldProps, 'type' | 'placeholder' | 'required'>) {
  const error = getNestedError(errors, name);

  return (
    <div className="mb-4">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          {...register(name)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">{label}</span>
      </label>
      {helpText && <p className="mt-1 ml-6 text-xs text-gray-500">{helpText}</p>}
      {error && (
        <p className="mt-1 ml-6 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}

/**
 * Section Header
 */
export function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900">
      {title}
    </h3>
  );
}

/**
 * Form Section Container
 */
export function FormSection({ children }: { children: React.ReactNode }) {
  return <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">{children}</div>;
}
