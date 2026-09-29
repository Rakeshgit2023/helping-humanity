import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import {
  CheckSquare,
  Heart,
  HeartHandshake,
  Mail,
  Phone,
  Search,
  Square,
  User,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AuthHeader } from '@/features/auth/components/AuthHeader';
import { AuthPasswordField } from '@/features/auth/components/AuthPasswordField';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { Screen } from '@/components/ui/Screen';
import { useCategorySearch } from '@/features/category/hooks/useCategorySearch';
import type { Category } from '@/features/category/types/category.types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { BloodGroup, Gender } from '@/features/auth/types/auth.types';
import { brand } from '@/theme';
import { toAppError } from '@/utils/errorHandler';
import { joinDob, registerSchema, splitDob, type RegisterFormValues } from '@/utils/validation';

type RegisterRole = 'user' | 'volunteer';

const ROLE_OPTIONS: { id: RegisterRole; label: string; icon: typeof Heart }[] = [
  { id: 'user', label: 'Someone who needs help', icon: Heart },
  { id: 'volunteer', label: 'A volunteer', icon: HeartHandshake },
];

const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Other' },
];

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MAX_INTERESTS = 5;
const MAX_DROPDOWN_RESULTS = 3;

export default function RegisterScreen() {
  const { register } = useAuth();
  const [categoryQuery, setCategoryQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const isSearchingCategories = categoryQuery.trim().length >= 2;
  const {
    data: searchedCategories,
    isFetching: isSearchingFetching,
    isError: isSearchError,
  } = useCategorySearch(categoryQuery);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const dropdownResults = (searchedCategories ?? [])
    .filter((category) => !selectedCategories.some((selected) => selected.id === category.id))
    .slice(0, MAX_DROPDOWN_RESULTS);

  const { control, handleSubmit, watch, setValue, formState } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      dob: '',
      gender: 'male',
      password: '',
      confirmPassword: '',
      role: 'user',
      bloodGroup: undefined,
      interests: [],
      agree: false,
    },
  });

  const role = watch('role');
  const gender = watch('gender');
  const bloodGroup = watch('bloodGroup');

  const selectCategory = (category: Category) => {
    if (selectedCategories.some((selected) => selected.id === category.id)) return;
    if (selectedCategories.length >= MAX_INTERESTS) return;
    const next = [...selectedCategories, category];
    setSelectedCategories(next);
    setValue(
      'interests',
      next.map((c) => c.id),
      { shouldValidate: true },
    );
    setCategoryQuery('');
  };

  const removeCategory = (id: string) => {
    const next = selectedCategories.filter((c) => c.id !== id);
    setSelectedCategories(next);
    setValue(
      'interests',
      next.map((c) => c.id),
      { shouldValidate: true },
    );
  };

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    try {
      await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        dob: values.dob,
        gender: values.gender,
        password: values.password,
        role: values.role,
        bloodGroup: values.role === 'volunteer' ? values.bloodGroup : undefined,
        interests: values.role === 'volunteer' ? values.interests : undefined,
      });
      router.replace({ pathname: '/(auth)/verify-email', params: { email: values.email } });
    } catch (error) {
      setSubmitError(toAppError(error).message);
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
          title="Create your account"
          subtitle="Join a community that shows up for each other."
        />

        <Text className="mb-2 text-sm font-bold text-ink">I&apos;m signing up as</Text>
        <View className="mb-4 flex-row gap-2">
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = role === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setValue('role', option.id, { shouldValidate: true })}
                className={`flex-1 items-center gap-1.5 rounded-xl border p-3.5 ${
                  active ? 'border-teal bg-teal' : 'border-line bg-white'
                }`}
              >
                <Icon size={20} color={active ? '#FFFFFF' : brand.teal} />
                <Text
                  className={`text-center text-xs font-semibold leading-tight ${
                    active ? 'text-white' : 'text-ink'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="gap-4">
          <View className="flex-row gap-3">
            <View className="flex-1">
              <AuthTextField
                control={control}
                name="firstName"
                label="First name"
                icon={User}
                placeholder="Jane"
              />
            </View>
            <View className="flex-1">
              <AuthTextField control={control} name="lastName" label="Last name" placeholder="Doe" />
            </View>
          </View>
          <AuthTextField
            control={control}
            name="phone"
            label="Phone number"
            icon={Phone}
            keyboardType="phone-pad"
            placeholder="98765 43210"
          />
          <AuthTextField
            control={control}
            name="email"
            label="Email"
            icon={Mail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Controller
            control={control}
            name="dob"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => {
              const { year, month, day } = splitDob(value);
              const borderClass = error ? 'border-clay' : 'border-line';

              const updatePart = (part: keyof ReturnType<typeof splitDob>, digits: string) => {
                const next = { year, month, day, [part]: digits.replace(/\D/g, '') };
                onChange(joinDob(next));
              };

              return (
                <View>
                  <Text className="mb-2 text-sm font-bold text-ink">Date of birth</Text>
                  <View className="flex-row items-center gap-2">
                    <View className={`flex-[1.4] rounded-xl border bg-white px-4 ${borderClass}`}>
                      <TextInput
                        value={year}
                        onChangeText={(text) => updatePart('year', text.slice(0, 4))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        maxLength={4}
                        placeholder="YYYY"
                        placeholderTextColor={brand.inkSoft}
                        className="py-3.5 text-base text-ink"
                      />
                    </View>
                    <Text className="text-base font-bold text-ink-soft">-</Text>
                    <View className={`flex-1 rounded-xl border bg-white px-4 ${borderClass}`}>
                      <TextInput
                        value={month}
                        onChangeText={(text) => updatePart('month', text.slice(0, 2))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="MM"
                        placeholderTextColor={brand.inkSoft}
                        className="py-3.5 text-base text-ink"
                      />
                    </View>
                    <Text className="text-base font-bold text-ink-soft">-</Text>
                    <View className={`flex-1 rounded-xl border bg-white px-4 ${borderClass}`}>
                      <TextInput
                        value={day}
                        onChangeText={(text) => updatePart('day', text.slice(0, 2))}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="DD"
                        placeholderTextColor={brand.inkSoft}
                        className="py-3.5 text-base text-ink"
                      />
                    </View>
                  </View>
                  {error ? <Text className="mt-1.5 text-xs text-clay">{error.message}</Text> : null}
                </View>
              );
            }}
          />

          <View>
            <Text className="mb-2 text-sm font-bold text-ink">Gender</Text>
            <View className="flex-row gap-2">
              {GENDER_OPTIONS.map((option) => {
                const active = gender === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setValue('gender', option.id, { shouldValidate: true })}
                    className={`flex-1 items-center rounded-xl border py-2.5 ${
                      active ? 'border-teal bg-teal' : 'border-line bg-white'
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AuthPasswordField
            control={control}
            name="password"
            label="Password"
            placeholder="At least 8 characters"
          />
          <AuthPasswordField
            control={control}
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter password"
          />

          {role === 'volunteer' ? (
            <View>
              <Text className="mb-2 text-sm font-bold text-ink">Blood group</Text>
              <View className="flex-row flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => {
                  const active = bloodGroup === bg;
                  return (
                    <Pressable
                      key={bg}
                      onPress={() => setValue('bloodGroup', bg, { shouldValidate: true })}
                      className="rounded-full border px-3.5 py-2"
                      style={{
                        backgroundColor: active ? brand.clay : '#FFFFFF',
                        borderColor: active ? brand.clay : brand.line,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: active ? '#FFFFFF' : brand.clay }}
                      >
                        {bg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {formState.errors.bloodGroup ? (
                <Text className="mt-1 text-xs text-clay">{formState.errors.bloodGroup.message}</Text>
              ) : null}
            </View>
          ) : null}

          {role === 'volunteer' ? (
            <View className="z-10">
              <Text className="mb-2 text-sm font-bold text-ink">
                What do you want to help with?
              </Text>

              {selectedCategories.length > 0 ? (
                <View className="mb-3 flex-row flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <View
                      key={category.id}
                      className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5"
                      style={{ backgroundColor: brand.teal, borderColor: brand.teal }}
                    >
                      <Text className="text-sm font-semibold text-white">{category.name}</Text>
                      <Pressable onPress={() => removeCategory(category.id)} hitSlop={6}>
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {selectedCategories.length < MAX_INTERESTS ? (
                <View className="relative">
                  <View className="flex-row items-center gap-2.5 rounded-xl border border-line bg-white px-4">
                    <Search size={16} color={brand.inkSoft} />
                    <TextInput
                      value={categoryQuery}
                      onChangeText={setCategoryQuery}
                      placeholder="Search categories (min 2 letters)"
                      placeholderTextColor={brand.inkSoft}
                      autoCapitalize="none"
                      className="flex-1 py-3 text-sm text-ink"
                    />
                    {isSearchingFetching ? (
                      <ActivityIndicator size="small" color={brand.teal} />
                    ) : null}
                  </View>

                  {isSearchingCategories ? (
                    <View
                      className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-line bg-white"
                      style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 }}
                    >
                      {isSearchingFetching && dropdownResults.length === 0 ? (
                        <Text className="px-4 py-3 text-xs text-ink-soft">Searching…</Text>
                      ) : isSearchError ? (
                        <Text className="px-4 py-3 text-xs text-clay">Couldn&apos;t search categories.</Text>
                      ) : dropdownResults.length === 0 ? (
                        <Text className="px-4 py-3 text-xs text-ink-soft">No categories match.</Text>
                      ) : (
                        dropdownResults.map((category, index) => (
                          <Pressable
                            key={category.id}
                            onPress={() => selectCategory(category)}
                            className={`px-4 py-3 active:bg-teal-soft ${
                              index > 0 ? 'border-t border-line' : ''
                            }`}
                          >
                            <Text className="text-sm font-semibold text-ink">{category.name}</Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text className="text-xs text-ink-soft">You&apos;ve picked the max of {MAX_INTERESTS}.</Text>
              )}

              {formState.errors.interests ? (
                <Text className="mt-1 text-xs text-clay">{formState.errors.interests.message}</Text>
              ) : null}
            </View>
          ) : null}

          <Controller
            control={control}
            name="agree"
            render={({ field: { onChange, value } }) => (
              <Pressable
                onPress={() => onChange(!value)}
                className="mt-1 flex-row items-start gap-2"
              >
                {value ? (
                  <CheckSquare size={18} color={brand.teal} />
                ) : (
                  <Square size={18} color={brand.inkSoft} />
                )}
                <Text className="flex-1 text-sm text-ink-soft">
                  I agree to the Terms of Service and Privacy Policy, and consent to my number being
                  visible only inside in-app chat.
                </Text>
              </Pressable>
            )}
          />
          {formState.errors.agree ? (
            <Text className="text-xs text-clay">{formState.errors.agree.message}</Text>
          ) : null}

          {submitError ? <Text className="text-base text-clay">{submitError}</Text> : null}

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={formState.isSubmitting}
            className={`mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-teal py-4 ${
              formState.isSubmitting ? 'opacity-70' : 'active:opacity-90'
            }`}
          >
            {formState.isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : null}
            <Text className="text-base font-bold text-white">
              {formState.isSubmitting ? 'Creating account…' : 'Create Account'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 flex-row justify-center">
          <Text className="text-sm text-ink-soft">Already have an account? </Text>
          <Link href="/(auth)/login">
            <Text className="text-sm font-bold text-teal">Log In</Text>
          </Link>
        </View>
      </ScrollView>
    </Screen>
  );
}
