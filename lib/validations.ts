import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["BRAND", "CREATOR"]).refine((v) => !!v, "Please select a role"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Brand ────────────────────────────────────────────────────────────────────

export const brandProfileSchema = z.object({
  companyName: z.string().min(2).max(200),
  industry: z.string().max(100).optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ─── Creator ──────────────────────────────────────────────────────────────────

export const creatorProfileSchema = z.object({
  displayName: z.string().min(2).max(150),
  bio: z.string().max(500).optional().or(z.literal("")),
  niche: z.string().max(100).optional().or(z.literal("")),
  instagramHandle: z.string().max(100).optional().or(z.literal("")),
  tiktokHandle: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  profileImageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ─── Campaign ─────────────────────────────────────────────────────────────────

export const campaignSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().max(5000).optional().or(z.literal("")),
  // Zod v4: use .pipe() for coerce with custom error or just let it fail gracefully
  budget: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive("Budget must be positive").max(1_000_000).optional()
  ),
  niche: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).default("DRAFT"),
  coverImage: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ─── Application ─────────────────────────────────────────────────────────────

export const applySchema = z.object({
  campaignId: z.string().min(1),
  pitch: z.string().max(2000).optional().or(z.literal("")),
});

export const reviewApplicationSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(["ACCEPTED", "REJECTED"]),
  agreedRate: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().positive("Rate must be positive").max(1_000_000).optional()
  ),
});

// ─── Content Submission ───────────────────────────────────────────────────────

export const submitContentSchema = z.object({
  collaborationId: z.string().min(1),
  videoUrl: z.string().url("Must be a valid URL"),
  caption: z.string().max(2000).optional().or(z.literal("")),
});

export const reviewSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
  feedback: z.string().max(1000).optional().or(z.literal("")),
});

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const portfolioItemSchema = z.object({
  mediaUrl: z.string().url("Must be a valid URL"),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  caption: z.string().max(300).optional().or(z.literal("")),
});
