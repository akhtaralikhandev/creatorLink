"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Building2, UserCircle, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
  role: z.enum(["BRAND", "CREATOR"]),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "creator" ? "CREATOR" : "BRAND";
  const [selectedRole, setSelectedRole] = useState<"BRAND" | "CREATOR">(defaultRole);
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  function selectRole(r: "BRAND" | "CREATOR") {
    setSelectedRole(r);
    setValue("role", r);
  }

  async function onSubmit(values: FormData) {
    setServerError(null);
    const result = await registerUser(values);
    if ("error" in result) {
      setServerError(result.error ?? "Registration failed");
      return;
    }
    // Auto-sign in after registration
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    router.push(values.role === "BRAND" ? "/brand/dashboard" : "/creator/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">CL</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join CreatorLink today</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          {/* Role picker */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {(["BRAND", "CREATOR"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-all",
                    selectedRole === role
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {role === "BRAND" ? <Building2 className="h-5 w-5" /> : <UserCircle className="h-5 w-5" />}
                  {role === "BRAND" ? "Brand" : "Creator"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("role")} />

            <div className="space-y-1.5">
              <Label htmlFor="name">{selectedRole === "BRAND" ? "Company name" : "Your name"}</Label>
              <Input id="name" placeholder={selectedRole === "BRAND" ? "Acme Inc." : "Jane Doe"} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 characters"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
