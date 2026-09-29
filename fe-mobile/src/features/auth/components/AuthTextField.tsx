import type { LucideIcon } from 'lucide-react-native';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { brand } from '@/theme';

interface AuthTextFieldProps<TFormValues extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText'
> {
  control: Control<TFormValues>;
  name: FieldPath<TFormValues>;
  label: string;
  icon?: LucideIcon;
}

export function AuthTextField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  icon: Icon,
  ...inputProps
}: AuthTextFieldProps<TFormValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View>
          <Text className="mb-2 text-sm font-bold text-ink">{label}</Text>
          <View
            className={`flex-row items-center gap-2.5 rounded-xl border bg-white px-4 ${
              error ? 'border-clay' : 'border-line'
            }`}
          >
            {Icon ? <Icon size={18} color={brand.inkSoft} /> : null}
            <TextInput
              value={typeof value === 'string' ? value : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholderTextColor={brand.inkSoft}
              className="flex-1 py-3.5 text-base text-ink"
              {...inputProps}
            />
          </View>
          {error ? <Text className="mt-1.5 text-xs text-clay">{error.message}</Text> : null}
        </View>
      )}
    />
  );
}
