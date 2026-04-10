"use client";

interface Props {
  variant?: "full" | "icon";
  className?: string;
  iconSize?: number;
}

/**
 * IsarChecKI custom logo.
 * Icon concept: a checkmark whose right arm flows into a river wave –
 * merging "safety check" with the Isar river in one minimal stroke.
 */
export default function IsarLogo({
  variant = "full",
  className = "",
  iconSize = 32,
}: Props) {
  const icon = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Badge background */}
      <rect x="1" y="1" width="30" height="30" rx="8" fill="rgba(78,201,212,0.08)" />
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        stroke="rgba(78,201,212,0.38)"
        strokeWidth="1.5"
      />
      {/*
        Check-to-wave path:
        Left leg:  M 5.5 16.5 → L 10.5 21.5  (down-right — left arm of ✓)
        Right leg: L 10.5 21.5 → L 15 17      (up-right — right arm of ✓)
        Wave 1:    Q 18.5 13  → 22.5 17        (hump up = first river crest)
        Wave 2:    Q 26.5 21  → 29.5 17        (trough down = second river valley)
      */}
      <path
        d="M 5.5 16.5 L 10.5 21.5 L 15 17 Q 18.5 13 22.5 17 Q 26.5 21 29.5 17"
        stroke="#4EC9D4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === "icon") {
    return (
      <span className={className} role="img" aria-label="IsarChecKI">
        {icon}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span role="img" aria-label="IsarChecKI">{icon}</span>
      <span
        className="font-bold tracking-tight leading-none"
        style={{ color: "white", fontSize: iconSize * 0.65 }}
      >
        IsarChec<span style={{ color: "var(--isar-cyan)" }}>KI</span>
      </span>
    </div>
  );
}
