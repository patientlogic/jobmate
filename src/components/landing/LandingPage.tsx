import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Globe2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { ACCOUNT_ACTIVATION } from "@/lib/constants";
import { APP_NAME } from "@config/app-name";

const MATCHING_CRITERIA = [
  "Technical expertise",
  "Professional experience",
  "Preferred technology stack",
  "Career goals",
  "Salary expectations",
] as const;

const INTERVIEW_SUPPORT = [
  "Prepare for technical interviews",
  "Navigate client screening processes",
  "Complete identity verification requirements",
  "Improve your professional presentation",
  "Communicate effectively with hiring managers",
] as const;

const EXPECTATIONS = [
  "Long-term remote opportunities",
  "Competitive salary packages",
  "Personalized job matching",
  "Interview preparation support",
  "Ongoing career guidance",
  "Access to a growing developer network",
] as const;

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="group rounded-2xl border bg-card/80 p-6 shadow-sm backdrop-blur transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </article>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(var(--primary)/0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_110%)]"
        aria-hidden
      />

      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <AppLogo size="sm" showTile={false} />
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">
                Create account
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <SectionBadge>
              <Sparkles className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
              Remote careers, curated for developers
            </SectionBadge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Build Your Career with{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                High-Paying Remote Opportunities
              </span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Finding the right remote job isn&apos;t easy—even for highly
              experienced developers. Many talented engineers spend countless
              hours searching through job boards, submitting applications, and
              competing for opportunities that may not match their skills or
              career goals.
            </p>
            <p className="mt-4 text-base font-medium text-foreground sm:text-lg">
              We created {APP_NAME} to change that.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="w-full sm:w-auto"
              >
                <a
                  href={ACCOUNT_ACTIVATION.TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join our Telegram community
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Search} title="We Find Opportunities for You">
              <p>
                Instead of spending your time searching for jobs, our dedicated
                recruitment team actively looks for long-term, high-paying remote
                opportunities on your behalf.
              </p>
              <p>
                Our network of job specialists continuously connects with
                companies worldwide that are seeking skilled developers,
                engineers, architects, and technical leaders.
              </p>
            </FeatureCard>

            <FeatureCard icon={Target} title="Personalized Job Matching">
              <p>
                With hundreds of active opportunities and ongoing employer
                relationships, we carefully match developers with positions that
                align with their:
              </p>
              <BulletList items={MATCHING_CRITERIA} />
              <p>
                Every opportunity is reviewed to ensure it fits your background
                before being presented to you.
              </p>
            </FeatureCard>

            <FeatureCard icon={ShieldCheck} title="End-to-End Interview Support">
              <p>
                Once you join our platform, you&apos;ll receive guidance
                throughout the hiring process. We help you:
              </p>
              <BulletList items={INTERVIEW_SUPPORT} />
              <p>
                Our goal is to maximize your chances of securing a long-term
                remote position.
              </p>
            </FeatureCard>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <SectionBadge>Technical leadership</SectionBadge>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Led by Experienced Technical Leadership
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  The platform is managed by a Technical Leader with more than
                  10 years of experience in software engineering, team leadership,
                  and hiring. Having worked with developers across multiple
                  industries and technologies, we understand what companies are
                  looking for and how to position candidates for success.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Briefcase, label: "10+ years in engineering leadership" },
                  { icon: Globe2, label: "Global remote employer network" },
                  { icon: Users, label: "Growing developer community" },
                  { icon: MessageCircle, label: "Direct owner support" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 rounded-2xl border bg-card/70 p-4"
                  >
                    <Icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <p className="text-sm font-medium leading-snug">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-10">
            <SectionBadge>Membership</SectionBadge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">
              Join Our Developer Community
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Membership begins by joining our developer community. After joining,
              you can connect directly with the platform owner to activate your
              account and begin receiving opportunities tailored to your
              expertise.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Create your account</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a
                  href={ACCOUNT_ACTIVATION.TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {ACCOUNT_ACTIVATION.TELEGRAM_LABEL}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6">
          <div className="rounded-3xl border bg-muted/40 p-8 sm:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              What You Can Expect
            </h2>
            <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
              {EXPECTATIONS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm font-medium shadow-sm"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="/signin"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Create account
            </Link>
            <a
              href={ACCOUNT_ACTIVATION.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Telegram community
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
