import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(3, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().regex(/^\d{11}$/, "Enter an 11-digit phone number (e.g. 08012345678)"),
    referralCode: z.string().min(4, "A referral code is required to join"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const personalInfoSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], { message: "Select a gender" }),
  address: z.string().min(5, "Enter your residential address"),
  stateOfOrigin: z.string().min(2, "Select your state of origin"),
  occupation: z.string().min(2, "Enter your occupation"),
  monthlySavingsCommitment: z.coerce.number().min(5000, "Minimum monthly savings commitment is ₦5,000"),
});

export const loanApplicationSchema = z.object({
  amount: z.coerce.number().positive("Enter a loan amount"),
  durationMonths: z.coerce.number().min(1, "Select repayment duration"),
  purpose: z.string().min(3, "Tell us what the loan is for"),
  loanType: z.enum(["cooperative", "emergency", "personal", "business"], { message: "Select a loan type" }),
  disbursementMethod: z.enum(["bank_transfer", "wallet"], { message: "Select a disbursement method" }),
  guarantorReferralCodes: z.array(z.string().min(3, "Enter a referral code")).length(3, "Three guarantor codes are required"),
});

export const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().regex(/^\d{10}$/, "Account number must be 10 digits"),
});