import type { ReactNode } from "react";
import { ProfileDecorationOverlay } from "@/components/ProfileDecorationOverlay";
import type { ProfileDecoration } from "@/types/profile";

interface ProfileAvatarProps {
  avatarUrl?: string;
  avatarAlt?: string;
  avatarSize?: number;
  presetId?: string;
  customDecorationUrl?: string;
  decorations?: ProfileDecoration[];
  fallback: ReactNode;
  className?: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ProfileAvatar({
  avatarUrl,
  avatarAlt = "Avatar",
  avatarSize = 128,
  presetId,
  customDecorationUrl,
  decorations = [],
  fallback,
  className = "",
}: ProfileAvatarProps) {
  const frameSize = clamp(Math.round(avatarSize * 1.18), 140, 160);
  const containerSize = Math.max(frameSize, avatarSize) + 8;

  return (
    <div
      className={`group/profile-avatar relative shrink-0 ${className}`}
      style={{ width: containerSize, height: containerSize }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative overflow-hidden rounded-full border-4 border-white/80 bg-gradient-to-br from-purple-500 to-blue-500 shadow-[0_30px_70px_rgba(0,0,0,0.4)]"
          style={{
            width: avatarSize,
            height: avatarSize,
            WebkitMaskImage: "radial-gradient(circle, white 100%, transparent 100%)",
            maskImage: "radial-gradient(circle, white 100%, transparent 100%)",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={avatarAlt}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            fallback
          )}
        </div>
      </div>

      <ProfileDecorationOverlay
        presetId={presetId}
        customImageUrl={customDecorationUrl}
        decorations={decorations}
        avatarSize={avatarSize}
      />
    </div>
  );
}
