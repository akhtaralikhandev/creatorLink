"use server";

import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";

export async function registerUser(data: unknown) {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return { error: "An account with this email already exists" };

  const hashed = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashed,
      role,
    },
  });

  // Create matching profile record
  if (role === "BRAND") {
    await db.brand.create({
      data: {
        userId: user.id,
        companyName: name,
      },
    });
  } else {
    await db.creator.create({
      data: {
        userId: user.id,
        displayName: name,
      },
    });
  }

  return { success: true };
}
