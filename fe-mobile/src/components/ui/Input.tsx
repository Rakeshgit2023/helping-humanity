import { forwardRef } from 'react';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, className = '', ...rest },
  ref,
) {
  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#9CA3AF"
        className={`rounded-xl border px-4 py-3.5 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
        } ${className}`}
        {...rest}
      />
      {error ? <Text className="mt-1 text-xs text-red-600">{error}</Text> : null}
    </View>
  );
});
