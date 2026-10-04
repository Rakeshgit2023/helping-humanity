import { z } from 'zod';

export const PHONE_RE = /^[6-9]\d{9}$/;
export const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/;

export function isValidCalendarDate(isoDate: string): boolean {
  if (!DOB_RE.test(isoDate)) return false;
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= Date.now()
  );
}

export interface DobParts {
  year: string;
  month: string;
  day: string;
}

/** Splits the combined YYYY-MM-DD form value into its three editable parts. */
export function splitDob(value: string): DobParts {
  const [year = '', month = '', day = ''] = value.split('-');
  return { year, month, day };
}

/** Joins the three DOB parts back into the combined YYYY-MM-DD form value. */
export function joinDob(parts: DobParts): string {
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: z.string().regex(PHONE_RE, 'Enter a valid 10-digit phone number'),
    dob: z
      .string()
      .regex(DOB_RE, 'Use YYYY-MM-DD format')
      .refine(isValidCalendarDate, 'Enter a valid date of birth'),
    gender: z.enum(['male', 'female', 'other']),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(
        PASSWORD_RE,
        'Include uppercase, lowercase, a number and a special character (@$!%*?&)',
      ),
    confirmPassword: z.string(),
    role: z.enum(['user', 'volunteer']),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    interests: z.array(z.string()),
    agree: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: 'custom',
        message: "Passwords don't match",
        path: ['confirmPassword'],
      });
    }
    if (data.role === 'volunteer' && data.interests.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Pick at least one interest',
        path: ['interests'],
      });
    }
    if (data.role === 'volunteer' && data.interests.length > 5) {
      ctx.addIssue({
        code: 'custom',
        message: 'You can select up to 5 interests',
        path: ['interests'],
      });
    }
    if (data.role === 'volunteer' && !data.bloodGroup) {
      ctx.addIssue({
        code: 'custom',
        message: 'Blood group is required to register as a volunteer',
        path: ['bloodGroup'],
      });
    }
    if (!data.agree) {
      ctx.addIssue({
        code: 'custom',
        message: 'Please accept the terms to continue',
        path: ['agree'],
      });
    }
  });

export type OtpFormValues = z.infer<typeof otpSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
