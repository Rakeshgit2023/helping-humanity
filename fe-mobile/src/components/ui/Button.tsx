import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends PropsWithChildren {
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-black dark:bg-white active:opacity-80',
  secondary: 'bg-gray-100 dark:bg-gray-800 active:opacity-80',
  danger: 'bg-red-600 active:opacity-80',
  ghost: 'bg-transparent active:opacity-60',
};

const textVariantClasses: Record<ButtonVariant, string> = {
  primary: 'text-white dark:text-black',
  secondary: 'text-gray-900 dark:text-white',
  danger: 'text-white',
  ghost: 'text-gray-900 dark:text-white',
};

export function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-xl px-5 py-4 items-center justify-center flex-row ${variantClasses[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? '#111827' : '#fff'}
        />
      ) : typeof children === 'string' ? (
        <Text className={`font-semibold text-center ${textVariantClasses[variant]}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
