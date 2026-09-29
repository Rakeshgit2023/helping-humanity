import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { Screen } from '@/components/ui/Screen';
import { authService } from '@/features/auth/services/auth.service';
import { toAppError } from '@/utils/errorHandler';
import { otpSchema, type OtpFormValues } from '@/utils/validation';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { control, handleSubmit, formState } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const onSubmit = async (values: OtpFormValues) => {
    if (!email) return;
    setSubmitError(null);
    try {
      await authService.verifyEmailWithOtp({ email, otp: values.otp });
      Alert.alert('Email verified', 'You can now log in to your account.');
      router.replace('/(auth)/login');
    } catch (error) {
      setSubmitError(toAppError(error).message);
    }
  };

  const onResend = async () => {
    if (!email || cooldown > 0) return;
    setSubmitError(null);
    setResendMessage(null);
    setIsResending(true);
    try {
      await authService.sendOtpForEmailVerification({ email });
      setResendMessage('A new OTP has been sent to your email.');
      startCooldown();
    } catch (error) {
      setSubmitError(toAppError(error).message);
    } finally {
      setIsResending(false);
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
          title="Verify your email"
          subtitle={
            email
              ? `Enter the 6-digit code we sent to ${email}.`
              : 'Enter the 6-digit code we sent to your email.'
          }
        />

        <View className="gap-4">
          <AuthTextField
            control={control}
            name="otp"
            label="OTP code"
            icon={ShieldCheck}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
          />

          {resendMessage ? <Text className="text-sm text-leaf">{resendMessage}</Text> : null}
          {submitError ? <Text className="text-base text-clay">{submitError}</Text> : null}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={formState.isSubmitting}
            className={`mt-1 items-center rounded-xl bg-teal py-4 ${
              formState.isSubmitting ? 'opacity-50' : 'active:opacity-90'
            }`}
          >
            <Text className="text-base font-bold text-white">Verify Email</Text>
          </Pressable>

          <Pressable onPress={onResend} disabled={isResending || cooldown > 0} className="items-center py-2">
            <Text className={`text-sm font-semibold ${cooldown > 0 ? 'text-ink-soft' : 'text-teal'}`}>
              {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-sm text-ink-soft">Already verified? </Text>
          <Pressable onPress={() => router.replace('/(auth)/login')}>
            <Text className="text-sm font-bold text-teal">Log In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
