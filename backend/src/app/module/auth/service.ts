import ApiError from "../../comman/utils/api.error.js";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../../../db/index.js";
import type { RegisterInput } from "./dto/register.dto.js";
import { userInterestsTable, usersTable } from "../../../db/schema.js";
import bcrypt from "bcryptjs";
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

// Register service function
export const register = async ({
  firstName,
  lastName,
  email,
  dob,
  mobileNumber,
  state,
  role,
  password,
  interestIds,
}: RegisterInput) => {
  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (user.length > 0) throw ApiError.conflict("User already exist");
    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationOtp = generateOtp().toString();

    const newUser = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(usersTable)
        .values({
          firstName,
          lastName,
          email,
          password: hashedPassword,
          mobileNumber,
          state,
          dob,
          ...(role && { role }),
          emailVerificationOtp: hashToken(emailVerificationOtp),
          emailVerificationOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        })
        .returning({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          email: usersTable.email,
        });

      if (!createdUser) {
        throw ApiError.internal("Unable to create user");
      }

      await tx.insert(userInterestsTable).values(
        interestIds.map((interestId) => ({
          userId: createdUser.id,
          interestId,
        })),
      );

      return createdUser;
    });

    await sendVerificationEmail(email, emailVerificationOtp);
    return newUser;
  } catch (error: any) {
    console.error("Register Error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(
      error?.cause?.detail ||
        "Unable to register user. Please try again later.",
    );
  }
};

// Sign in service function
export const signIn = async ({ email, password }: SignInInput) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (!user.password) {
      throw ApiError.internal("Invalid email or password");
    }
    const isMatchPassword = await bcrypt.compare(password, user.password);
    if (!isMatchPassword) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (!user.emailVerified)
      throw ApiError.forbidden("Please verify your email berfore logging in");

    const claims: User = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(claims);
    const refreshToken = generateRefreshToken(claims);
    await db
      .update(usersTable)
      .set({ refreshToken: hashToken(refreshToken) })
      .where(eq(usersTable.email, email));

    return { user: claims, accessToken, refreshToken };
  } catch (error: any) {
    console.error("Sign In Error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(
      error?.cause?.detail || "Unable to sign in. Please try again later.",
    );
  }
};

// verify email with otp service function
export const verifyEmailWithOtp = async ({
  email,
  otp,
}: VerifyEmailWithOtpInput) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.email, email),
          eq(usersTable.emailVerificationOtp, hashToken(otp)),
          gt(usersTable.emailVerificationOtpExpiresAt, new Date()),
        ),
      )
      .limit(1);
    if (!user) {
      throw ApiError.notFound("Invalid email or verification code");
    }
    await db
      .update(usersTable)
      .set({
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpiresAt: null,
      })
      .where(eq(usersTable.id, user.id));
  } catch (error: any) {
    console.error("Verify Email with OTP Error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(
      error?.cause?.detail || "Unable to verify email. Please try again later.",
    );
  }
};

// send otp for email verification service function
export const sendOtpForEmailVerification = async ({
  email,
}: SendOtpForEmailVerificationInput) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    const emailVerificationOtp = generateOtp().toString();
    await db
      .update(usersTable)
      .set({
        emailVerificationOtp: hashToken(emailVerificationOtp),
        emailVerificationOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })
      .where(eq(usersTable.id, user.id));
    await sendVerificationEmail(email, emailVerificationOtp);
  } catch (error: any) {
    console.error("Send OTP for Email Verification Error:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(
      error?.cause?.detail ||
        "Unable to send OTP for email verification. Please try again later.",
    );
  }
};
