import { registry } from "../registry.js";
import {
  registerResponseSchema,
  registerSchema,
} from "../../module/auth/dto/register.dto.js";
import { commonErrorResponses } from "../../comman/dto/response.dto.js";
import {
  signInResponseSchema,
  signInSchema,
} from "../../module/auth/dto/signIn.dto.js";
import {
  verifyEmailWithOtpSchema,
  verifyEmailWithOtpResponseSchema,
} from "../../module/auth/dto/verifyEmailWithOtp.dto.js";
import {
  sendOtpForEmailVerificationResponseSchema,
  sendOtpForEmailVerificationSchema,
} from "../../module/auth/dto/sendOtpForEmailVerification.dto.js";
import {
  RefreshAccessTokenResponseSchema,
  refreshAccessTokenSchema,
} from "../../module/auth/dto/refreshAccessToken.dto.js";
import z from "zod";

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user, optionally as a volunteer",
  description:
    "Creates a user account and sends an email verification OTP. " +
    "If role is 'volunteer', bloodGroup and 1-5 interests (category ids) " +
    "are required, and a volunteer_profiles + volunteer_interests row are " +
    "created atomically with the user.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
          examples: {
            "as a regular user": {
              value: {
                firstName: "Aisha",
                lastName: "Khan",
                email: "aisha@example.com",
                dob: "15-08-2000",
                phone: "9876543210",
                gender: "female",
                password: "StrongPass1!",
              },
            },
            "as a volunteer": {
              value: {
                firstName: "Rohan",
                lastName: "Mehta",
                email: "rohan@example.com",
                dob: "02-11-1998",
                phone: "9123456780",
                gender: "male",
                role: "volunteer",
                password: "StrongPass1!",
                bloodGroup: "O+",
                interests: ["b3f1c2a0-1111-4a2b-9c3d-000000000001"],
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registration successful",
      content: { "application/json": { schema: registerResponseSchema } },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/signIn",
  tags: ["Auth"],
  summary: "Sign in an existing user",
  description:
    "Authenticates a user using email and password. The user's email must be verified and the account must not be banned. On successful authentication, a login session is created and access and refresh tokens are returned.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: signInSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User signed in successfully",
      content: {
        "application/json": {
          schema: signInResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/verifyEmailWithOtp",
  tags: ["Auth"],
  summary: "Verify email with OTP",
  description:
    "Verifies the user's email address using the OTP sent to their email and marks the email as verified.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: verifyEmailWithOtpSchema,
          examples: {
            default: {
              value: {
                email: "aisha@example.com",
                otp: "123456",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Email verified successfully",
      content: {
        "application/json": {
          schema: verifyEmailWithOtpResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/sendOtpForEmailVerification",
  tags: ["Auth"],
  summary: "Send email verification OTP",
  description:
    "Sends a new OTP to the user's email address for email verification.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: sendOtpForEmailVerificationSchema,
          examples: {
            default: {
              value: {
                email: "aisha@example.com",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP sent successfully",
      content: {
        "application/json": {
          schema: sendOtpForEmailVerificationResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  description:
    "Generates a new access token and refresh token using a valid refresh token and session ID. The refresh token is rotated after successful validation.",
  request: {
    query: refreshAccessTokenSchema,
  },
  responses: {
    200: {
      description: "Access token refreshed successfully",
      content: {
        "application/json": {
          schema: RefreshAccessTokenResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Log out user",
  description:
    "Logs out the authenticated user by invalidating all active login sessions associated with the user.",
  security: [
    {
      bearerAuth: [],
    },
  ],
  responses: {
    200: {
      description: "User logged out successfully",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            data: z.null(),
          }),
        },
      },
    },
    ...commonErrorResponses,
  },
});
