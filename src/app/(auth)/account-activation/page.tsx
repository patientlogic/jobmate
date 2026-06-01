import Link from "next/link";
import { Metadata } from "next";
import { ExternalLink } from "lucide-react";

import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { ACCOUNT_ACTIVATION } from "@/lib/constants";
import { APP_NAME } from "@config/app-name";

export const metadata: Metadata = {
  title: "Account Activation",
};

export default function AccountActivationPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <AppLogo size="md" className="mb-4" priority />
        <h1 className="text-2xl font-semibold tracking-tight">{APP_NAME}</h1>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 space-y-2 text-center">
          <h2 className="text-xl font-semibold">Account pending activation</h2>
          <p className="text-sm text-muted-foreground">
            Your account must be activated by an admin before you can sign in.
          </p>
        </div>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            You can activate your account by joining our Telegram community and
            contacting the owner:
          </p>
          <Button asChild className="w-full">
            <a
              href={ACCOUNT_ACTIVATION.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join {ACCOUNT_ACTIVATION.TELEGRAM_LABEL}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-center text-xs">
            <a
              href={ACCOUNT_ACTIVATION.TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              {ACCOUNT_ACTIVATION.TELEGRAM_URL}
            </a>
          </p>
        </div>

        <div className="mt-6 border-t pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/signin">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
