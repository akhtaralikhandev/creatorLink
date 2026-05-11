import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Megaphone, Users, DollarSign, BarChart2 } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role === "BRAND") redirect("/brand/dashboard");
  if (session?.user?.role === "CREATOR") redirect("/creator/dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CL</span>
            </div>
            <span className="font-bold text-lg tracking-tight">CreatorLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          The UGC Creator Marketplace
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight mb-6">
          Connect brands with the right creators
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          CreatorLink streamlines the full UGC workflow — from campaign discovery to content approval and payment — all in one place.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="xl" asChild>
            <Link href="/register?role=brand">Start as a Brand</Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/register?role=creator">Join as Creator</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need, end-to-end</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Megaphone, title: "Campaign Management", desc: "Create targeted campaigns with budgets, niches, and status controls." },
            { icon: Users, title: "Creator Discovery", desc: "Creators browse and apply. Brands review profiles and portfolios before accepting." },
            { icon: BarChart2, title: "Collaboration Workflow", desc: "Track the full lifecycle from application → content → approval." },
            { icon: DollarSign, title: "Payment Tracking", desc: "Automatic payment records released on content approval." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">Join brands and creators already using CreatorLink.</p>
          <Button size="xl" asChild>
            <Link href="/register">Create your free account <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CreatorLink · CS232 Database Systems Project
      </footer>
    </div>
  );
}
