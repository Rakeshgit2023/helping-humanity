import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthPasswordField } from '@/features/auth/components/AuthPasswordField';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toAppError } from '@/utils/errorHandler';
import { loginSchema, type LoginFormValues } from '@/utils/validation';

export default function LoginScreen() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    setUnverifiedEmail(null);
    try {
      await login(values);
    } catch (error) {
      const appError = toAppError(error);
      setSubmitError(appError.message);
      if (appError.message.toLowerCase().includes('verify your email')) {
        setUnverifiedEmail(values.email);
      }
    }
  };

  return (
    <Screen backgroundClassName="bg-paper" padded={false}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="mx-auto w-full max-w-md pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader
          title="Welcome back"
          subtitle="Log in to raise a request or help someone nearby."
        />

        <View className="gap-4">
          <AuthTextField
            control={control}
            name="email"
            label="Email"
            icon={Mail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <AuthPasswordField
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
          />

          <Pressable onPress={() => Alert.alert('Password reset link sent')} className="self-end">
            <Text className="text-sm font-semibold text-teal">Forgot password?</Text>
          </Pressable>

          {submitError ? <Text className="text-base text-clay">{submitError}</Text> : null}
          {unverifiedEmail ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(auth)/verify-email', params: { email: unverifiedEmail } })
              }
            >
              <Text className="text-sm font-bold text-teal">Verify your email now</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={formState.isSubmitting}
            className={`mt-1 items-center rounded-xl bg-teal py-4 ${
              formState.isSubmitting ? 'opacity-50' : 'active:opacity-90'
            }`}
          >
            <Text className="text-base font-bold text-white">Log In</Text>
          </Pressable>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-sm text-ink-soft">New here? </Text>
          <Link href="/(auth)/register">
            <Text className="text-sm font-bold text-teal">Create an account</Text>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
