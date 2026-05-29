import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@config/app-name";

const LOGO_SRC = "/logo_transparent.png";

const sizeStyles = {
  sm: {
    tile: "h-11 w-11 md:h-10 md:w-10",
    image: "h-9 w-9 md:h-8 md:w-8",
    dimensions: 40,
    tileRounded: "rounded-full",
  },
  md: {
    tile: "h-24 w-24",
    image: "h-20 w-20",
    dimensions: 80,
    tileRounded: "rounded-2xl",
  },
} as const;

type AppLogoProps = {
  size?: keyof typeof sizeStyles;
  href?: string;
  showTile?: boolean;
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  size = "sm",
  href = "/",
  showTile = size === "md",
  className,
  priority = false,
}: AppLogoProps) {
  const styles = sizeStyles[size];

  const logo = (
    <Image
      src={LOGO_SRC}
      alt={APP_NAME}
      width={styles.dimensions}
      height={styles.dimensions}
      unoptimized={true}
      className={cn(
        "object-contain transition-transform",
        !showTile && "group-hover:scale-110",
        styles.image,
      )}
      priority={priority}
    />
  );

  const content = showTile ? (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-background shadow-sm ring-1 ring-border/60 transition-transform group-hover:scale-[1.02]",
        styles.tile,
        styles.tileRounded,
      )}
    >
      {logo}
    </span>
  ) : (
    logo
  );

  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center justify-center", className)}
    >
      {content}
      <span className="sr-only">{APP_NAME}</span>
    </Link>
  );
}
