import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { Input } from '@/components/ui/Input';

interface FormFieldProps<TFormValues extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText'
> {
  control: Control<TFormValues>;
  name: FieldPath<TFormValues>;
  label?: string;
}

export function FormField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: FormFieldProps<TFormValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <Input
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
