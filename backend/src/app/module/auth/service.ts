import ApiError from "../../comman/utils/api.error.js";
import { db } from "../../../db/index.js";
import bcrypt from "bcryptjs";
import { and, eq, gt, inArray, or } from "drizzle-orm";
import {
  users,
  emailVerificationOtps,
  sessions,
  category,
  volunteerProfiles,
  volunteerInterests,
} from "../../../db/schema.js";
import type { RegisterInput } from "./dto/register.dto.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  type User,
} from "../../comman/utils/jwt.js";
import { generateOtp } from "../../comman/utils/helper.js";
import { sendVerificationEmail } from "../../comman/utils/email.js";
import type { SignInInput } from "./dto/signIn.dto.js";
import type { VerifyEmailWithOtpInput } from "./dto/verifyEmailWithOtp.dto.js";
import type { SendOtpForEmailVerificationInput } from "./dto/sendOtpForEmailVerification.dto.js";
import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";

// Register service function
export const register = withErrorHandling(
  "Register",
  async ({
    firstName,
    lastName,
    email,
    dob,
    phone,
    role,
    gender,
    password,
    bloodGroup,
    interests,
  }: RegisterInput) => {
    // Check whether email or phone already exists
    const existingUser = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(or(eq(users.email, email), eq(users.phone, phone)))
      .limit(1);

    if (existingUser.length > 0) {
      if (existingUser[0] && existingUser[0].email === email) {
        throw ApiError.conflict("Email already exists");
      }

      if (existingUser[0] && existingUser[0].phone === phone) {
        throw ApiError.conflict("Phone number already exists");
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp().toString();

    const result = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          firstName,
          lastName,
          email,
          dob,
          phone,
          passwordHash,
          ...(role && { role }),
          gender,
        })
        .returning({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
          dob: users.dob,
          role: users.role,
          isEmailVerified: users.isEmailVerified,
        });

      if (!newUser) {
        throw ApiError.internal("Failed to create user");
      }

      await tx.insert(emailVerificationOtps).values({
        userId: newUser.id,
        otpHash: hashToken(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      if (role === "volunteer") {
        if (interests && interests.length > 0) {
          const foundCategories = await tx
            .select({ id: category.id })
            .from(category)
            .where(inArray(category.id, interests));

          if (foundCategories.length !== new Set(interests).size) {
            throw ApiError.badRequest(
              "One or more selected interests are invalid",
            );
          }
        }

        await tx.insert(volunteerProfiles).values({
          userId: newUser.id,
          bloodGroup: bloodGroup ?? null,
        });

        if (interests && interests.length > 0) {
          await tx.insert(volunteerInterests).values(
            interests.map((categoryId) => ({
              volunteerId: newUser.id,
              categoryId,
            })),
          );
        }
      }

      return {
        user: newUser,
      };
    });

    await sendVerificationEmail(result.user.email, otp);

    return {
      user: result.user,
      message: "Registration successful. Please verify your email.",
    };
  },
);

// Sign in service function
export const signIn = withErrorHandling(
  "Sign In",
  async ({ email, password }: SignInInput, userAgent?: string) => {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Check password exists
    if (!user.passwordHash) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Verify password
    const isMatchPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isMatchPassword) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Check email verification
    if (!user.isEmailVerified) {
      throw ApiError.forbidden("Please verify your email before logging in");
    }

    // Check banned user
    if (user.isBanned) {
      throw ApiError.forbidden("Your account has been banned");
    }

    // JWT payload
    const claims: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    // Generate tokens
    const accessToken = generateAccessToken(claims);
    const refreshToken = generateRefreshToken(claims);

    // Create session
    const [session] = await db
      .insert(sessions)
      .values({
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: userAgent ?? null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .returning({
        id: sessions.id,
      });

    if (!session) {
      throw ApiError.internal("Unable to create login session");
    }

    return {
      user: claims,
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  },
);

// Verify email with OTP
export const verifyEmailWithOtp = withErrorHandling(
  "Verify Email with OTP",
  async ({ email, otp }: VerifyEmailWithOtpInput) => {
    const result = await db.transaction(async (tx) => {
      // Find user
      const [user] = await tx
        .select({
          id: users.id,
          email: users.email,
          isEmailVerified: users.isEmailVerified,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw ApiError.notFound("User not found");
      }

      if (user.isEmailVerified) {
        throw ApiError.badRequest("Email is already verified");
      }

      // Find valid OTP using userId + OTP hash + expiry
      const [otpRecord] = await tx
        .select({
          id: emailVerificationOtps.id,
          userId: emailVerificationOtps.userId,
        })
        .from(emailVerificationOtps)
        .where(
          and(
            eq(emailVerificationOtps.userId, user.id),
            eq(emailVerificationOtps.otpHash, hashToken(otp)),
            gt(emailVerificationOtps.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!otpRecord) {
        throw ApiError.badRequest("Invalid or expired OTP");
      }

      // Mark email as verified
      await tx
        .update(users)
        .set({
          isEmailVerified: true,
        })
        .where(eq(users.id, user.id));

      // Delete OTP after successful verification
      await tx
        .delete(emailVerificationOtps)
        .where(eq(emailVerificationOtps.id, otpRecord.id));

      return {
        userId: user.id,
        email: user.email,
      };
    });

    return {
      message: "Email verified successfully",
      userId: result.userId,
      email: result.email,
    };
  },
);

// Send / Resend OTP for email verification
export const sendOtpForEmailVerification = withErrorHandling(
  "Send OTP for Email Verification",
  async ({ email }: SendOtpForEmailVerificationInput) => {
    const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isEmailVerified: users.isEmailVerified,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (user.isEmailVerified) {
      throw ApiError.badRequest("Email is already verified");
    }

    const [existingOtp] = await db
      .select({ createdAt: emailVerificationOtps.createdAt })
      .from(emailVerificationOtps)
      .where(eq(emailVerificationOtps.userId, user.id))
      .limit(1);

    if (
      existingOtp &&
      Date.now() - existingOtp.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      const waitSec = Math.ceil(
        (OTP_RESEND_COOLDOWN_MS -
          (Date.now() - existingOtp.createdAt.getTime())) /
          1000,
      );
      throw ApiError.badRequest(
        `Please wait ${waitSec}s before requesting another OTP`,
      );
    }

    const otp = generateOtp().toString();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Single atomic statement: inserts a new row, or — if this user already
    // has one (guaranteed unique by the index) — updates it in place. No
    // more separate existingOtp branch-and-decide logic needed for the write.
    await db
      .insert(emailVerificationOtps)
      .values({ userId: user.id, otpHash, expiresAt })
      .onConflictDoUpdate({
        target: emailVerificationOtps.userId,
        set: { otpHash, expiresAt, createdAt: new Date() },
      });

    await sendVerificationEmail(user.email, otp);

    return { message: "OTP sent successfully. Please check your email." };
  },
);
