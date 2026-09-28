import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

import { brand } from '@/theme';

interface AuthPasswordFieldProps<TFormValues extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'secureTextEntry'
> {
  control: Control<TFormValues>;
  name: FieldPath<TFormValues>;
  label: string;
}

export function AuthPasswordField<TFormValues extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: AuthPasswordFieldProps<TFormValues>) {
  const [visible, setVisible] = useState(false);

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
            <Lock size={18} color={brand.inkSoft} />
            <TextInput
              value={typeof value === 'string' ? value : ''}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry={!visible}
              placeholderTextColor={brand.inkSoft}
              className="flex-1 py-3.5 text-base text-ink"
              {...inputProps}
            />
            <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8}>
              {visible ? (
                <EyeOff size={18} color={brand.inkSoft} />
              ) : (
                <Eye size={18} color={brand.inkSoft} />
              )}
            </Pressable>
          </View>
          {error ? <Text className="mt-1.5 text-xs text-clay">{error.message}</Text> : null}
        </View>
      )}
    />
  );
}
