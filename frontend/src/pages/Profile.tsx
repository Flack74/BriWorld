import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Edit2,
  Upload,
  X,
  Trophy,
  Zap,
  Target,
  Flame,
  ImagePlus,
  Sparkles,
  Crown,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import RankBadge from "@/components/RankBadge";
import { AVATAR_DECORATION_PRESETS } from "@/constants/profileDecorations";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { AvatarEditorDialog } from "@/components/AvatarEditorDialog";
import { BannerEditorDialog } from "@/components/BannerEditorDialog";
import { LottieRenderer } from "@/components/LottieRenderer";
import type { ProfileDecoration } from "@/types/profile";

interface ProfileData {
  username: string;
  email?: string;
  created_at?: string;
  avatar_url?: string;
  avatar_type?: string;
  banner_url?: string;
  banner_type?: string;
  avatar_decoration_preset?: string;
  avatar_decoration_url?: string;
  profile_customization_json?: string;
  decorations?: ProfileDecoration[];
  total_points?: number;
  rating?: number;
  rank?: string;
  rank_tier?: string;
  is_placement_complete?: boolean;
  placement_matches?: number;
  total_games?: number;
  total_wins?: number;
  win_streak?: number;
  longest_win_streak?: number;
  countries_mastered?: number;
}

const fallbackBanner =
  "bg-[radial-gradient(circle_at_top_left,#ffb86b_0%,#ff6b4a_28%,#7d5cff_62%,#1b2438_100%)]";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [bannerEditorOpen, setBannerEditorOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [savingDecorationPreset, setSavingDecorationPreset] = useState<string | null>(null);
  const [mediaVersion, setMediaVersion] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const data = await api.getProfile();
      setProfile(data);
      setNewUsername(data.username);
    } catch (err) {
      if (err instanceof Error && err.message.includes("401")) {
        navigate("/login");
      } else {
        setError("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const setFlashMessage = (type: "error" | "success", message: string) => {
    if (type === "error") {
      setError(message);
      return;
    }

    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const withVersion = (url?: string) => {
    if (!url) return "";
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${mediaVersion}`;
  };

  const handleUpdateUsername = async () => {
    try {
      setError("");
      setSuccess("");
      if (!newUsername.trim()) {
        setError("Username cannot be empty");
        return;
      }
      await api.updateProfile({ username: newUsername.trim() });
      localStorage.setItem("username", newUsername.trim());
      setProfile((prev) => (prev ? { ...prev, username: newUsername.trim() } : prev));
      setEditingUsername(false);
      setFlashMessage("success", "Username updated successfully!");
    } catch (err) {
      setFlashMessage("error", err instanceof Error ? err.message : "Failed to update username");
    }
  };

  const handleAvatarFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFlashMessage("error", "Please select an image file");
      return;
    }

    const isGif = file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
    if (isGif) {
      void handleAvatarUpload(file);
      return;
    }

    setPendingAvatarFile(file);
    setAvatarEditorOpen(true);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setError("");
      const response = await api.uploadAvatar(file) as { avatar_url?: string; avatar_type?: string };
      setProfile((prev) => (
        prev
          ? {
              ...prev,
              avatar_url: response.avatar_url || prev.avatar_url,
              avatar_type: response.avatar_type || prev.avatar_type,
            }
          : prev
      ));
      setFlashMessage("success", "Avatar updated successfully!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
      setPendingAvatarFile(null);
    } catch (err) {
      setFlashMessage("error", "Failed to upload avatar");
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError("");
      const response = await api.uploadBanner(file) as { banner_url?: string; banner_type?: string };
      setProfile((prev) => (
        prev
          ? {
              ...prev,
              banner_url: response.banner_url || prev.banner_url,
              banner_type: response.banner_type || prev.banner_type,
            }
          : prev
      ));
      setFlashMessage("success", "Banner uploaded successfully!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
    } catch (err) {
      setFlashMessage("error", err instanceof Error ? err.message : "Failed to upload banner");
    }
  };

  const handleDecorationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError("");
      await api.uploadAvatarDecoration(file);
      setFlashMessage("success", "Custom avatar decoration uploaded!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
    } catch {
      setFlashMessage("error", "Failed to upload avatar decoration");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setError("");
      await api.deleteAvatar();
      setFlashMessage("success", "Avatar deleted successfully!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
    } catch {
      setFlashMessage("error", "Failed to delete avatar");
    }
  };

  const handleDeleteBanner = async () => {
    try {
      setError("");
      await api.deleteBanner();
      setFlashMessage("success", "Banner deleted successfully!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
    } catch {
      setFlashMessage("error", "Failed to delete banner");
    }
  };

  const handleDeleteDecoration = async () => {
    try {
      setError("");
      await api.deleteAvatarDecoration();
      setFlashMessage("success", "Avatar decoration cleared!");
      setMediaVersion((prev) => prev + 1);
      await fetchProfile();
    } catch {
      setFlashMessage("error", "Failed to clear avatar decoration");
    }
  };

  const handleDecorationPresetSelect = async (presetId: string) => {
    if (!profile) return;
    setSavingDecorationPreset(presetId);
    try {
      setError("");
      await api.updateProfile({ avatar_decoration_preset: presetId });
      setProfile({
        ...profile,
        avatar_decoration_preset: presetId,
        avatar_decoration_url: "",
      });
      setFlashMessage("success", "Avatar decoration updated!");
    } catch {
      setFlashMessage("error", "Failed to save avatar decoration");
    } finally {
      setSavingDecorationPreset(null);
    }
  };

  const winRate = useMemo(() => {
    if (!profile?.total_games) return 0;
    return (profile.total_wins || 0) / profile.total_games * 100;
  }, [profile]);
  const customizationConfig = useMemo(() => {
    if (!profile?.profile_customization_json) return {};
    try {
      return JSON.parse(profile.profile_customization_json) as {
        banner_media?: { scale?: number; offset_x?: number; offset_y?: number };
      };
    } catch {
      return {};
    }
  }, [profile?.profile_customization_json]);

  const getRank = (totalPoints: number) => {
    if (totalPoints >= 10000) return { rank: "Legendary", icon: "👑", color: "text-yellow-500", bgColor: "from-yellow-500/20 to-yellow-600/20" };
    if (totalPoints >= 5000) return { rank: "Master", icon: "🏆", color: "text-purple-500", bgColor: "from-purple-500/20 to-purple-600/20" };
    if (totalPoints >= 2000) return { rank: "Expert", icon: "⭐", color: "text-blue-500", bgColor: "from-blue-500/20 to-blue-600/20" };
    if (totalPoints >= 1000) return { rank: "Advanced", icon: "🎯", color: "text-green-500", bgColor: "from-green-500/20 to-green-600/20" };
    if (totalPoints >= 500) return { rank: "Intermediate", icon: "📈", color: "text-orange-500", bgColor: "from-orange-500/20 to-orange-600/20" };
    return { rank: "Beginner", icon: "🌱", color: "text-gray-500", bgColor: "from-gray-500/20 to-gray-600/20" };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{error || "Failed to load profile"}</p>
          <Button onClick={() => navigate("/lobby")}>Back to Lobby</Button>
        </div>
      </div>
    );
  }

  const rankInfo = getRank(profile.total_points || 0);
  const avatarDecorations = (profile.decorations || []).filter((item) => item.target === "avatar" && item.enabled);
  const bannerDecorations = (profile.decorations || []).filter((item) => item.target === "banner" && item.enabled);
  const bannerMedia = customizationConfig.banner_media || {};
  const bannerTransform = `translate(${bannerMedia.offset_x || 0}px, ${bannerMedia.offset_y || 0}px) scale(${bannerMedia.scale || 1})`;

  const renderDecorationAsset = (item: ProfileDecoration, sizeClassName: string) => (
    <div
      key={item.id || `${item.name}-${item.z_index}`}
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{
        transform: `translate(calc(-50% + ${item.position_x}px), calc(-50% + ${item.position_y}px)) scale(${item.scale}) rotate(${item.rotation}deg)`,
        zIndex: item.z_index,
      }}
    >
      {item.asset_type === "lottie" ? (
        <LottieRenderer src={item.asset_url} loop={item.loop} speed={item.speed} className={sizeClassName} />
      ) : (
        <img src={withVersion(item.asset_url)} alt="" className={`${sizeClassName} object-contain`} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-8 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute left-8 bottom-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => navigate("/lobby")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Lobby
          </Button>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">Profile Studio</h1>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-500">
            {success}
          </div>
        )}

        <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-card/95 shadow-2xl backdrop-blur">
          <div className="relative h-44 sm:h-56 lg:h-72">
            {profile.banner_url ? (
              profile.banner_type === "lottie" ? (
                <div className="absolute inset-0" style={{ transform: bannerTransform, transformOrigin: "center center" }}>
                  <LottieRenderer src={profile.banner_url} className="h-full w-full" />
                </div>
              ) : (
                <img
                  src={withVersion(profile.banner_url)}
                  alt="Profile banner"
                  key={withVersion(profile.banner_url)}
                  className="h-full w-full object-cover"
                  style={{ transform: bannerTransform, transformOrigin: "center center" }}
                />
              )
            ) : (
              <div className={`h-full w-full ${fallbackBanner}`} />
            )}
            {bannerDecorations.map((item) => renderDecorationAsset(item, "h-40 w-72 sm:h-48 sm:w-96"))}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
            <div className="absolute left-3 right-3 top-3 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-4 sm:top-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/json,.json" className="hidden" onChange={handleBannerUpload} />
                <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-xs font-semibold text-white backdrop-blur sm:px-4 sm:text-sm">
                  <ImagePlus className="h-4 w-4" />
                  Upload Banner
                </div>
              </label>
              {profile.banner_url && (
                <Button
                  variant="outline"
                  onClick={() => setBannerEditorOpen(true)}
                  className="border-white/15 bg-black/35 text-white hover:bg-black/50"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Adjust
                </Button>
              )}
              {profile.banner_url && (
                <Button
                  variant="outline"
                  onClick={handleDeleteBanner}
                  className="border-white/15 bg-black/35 text-white hover:bg-black/50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>

          <div className="relative z-10 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:-mt-20 lg:px-8 lg:pb-7 lg:pt-0">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
                <div className="relative shrink-0 self-center sm:self-auto">
                  <ProfileAvatar
                    key={withVersion(profile.avatar_url)}
                    avatarUrl={withVersion(profile.avatar_url)}
                    avatarAlt="Avatar"
                    avatarSize={128}
                    presetId={profile.avatar_decoration_preset}
                    customDecorationUrl={withVersion(profile.avatar_decoration_url)}
                    decorations={avatarDecorations.map((item) => ({
                      ...item,
                      asset_url: withVersion(item.asset_url),
                    }))}
                    className="mx-auto"
                    fallback={(
                      <div className="flex h-full w-full items-center justify-center text-5xl font-black text-white">
                        {profile.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  />
                </div>

                <div className="w-full space-y-3 text-white">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur">
                      <Crown className="h-3.5 w-3.5" />
                      BriWorld Identity
                    </div>
                    {profile.avatar_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteAvatar}
                        className="border-white/20 bg-black/30 text-white hover:bg-black/40"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove Avatar
                      </Button>
                    )}
                  </div>
                  {editingUsername ? (
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-white/20 bg-black/35 px-4 py-2 text-sm text-white outline-none ring-0 placeholder:text-white/45 sm:flex-none"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleUpdateUsername}>Save</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-black/30 text-white hover:bg-black/40"
                        onClick={() => {
                          setEditingUsername(false);
                          setNewUsername(profile.username);
                          setError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                      <h2 className="break-all text-2xl font-black sm:text-4xl">{profile.username}</h2>
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="rounded-full border border-white/20 bg-black/30 p-2 text-white/80 transition hover:text-white"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-white/75 sm:justify-start sm:gap-3 sm:text-sm">
                    <span className="break-all">{profile.email || "No email"}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Joined{" "}
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                <label className="cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarFilePick} className="hidden" />
                  <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    Edit Avatar
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleDecorationUpload} className="hidden" />
                  <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    <Sparkles className="h-4 w-4" />
                    Custom Decoration
                  </div>
                </label>
                {(profile.avatar_decoration_preset || profile.avatar_decoration_url) && (
                  <Button
                    variant="outline"
                    className="border-white/15 bg-black/35 text-white hover:bg-black/50"
                    onClick={handleDeleteDecoration}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Decoration
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              {profile.rating && (
                <div className="rounded-[1.75rem] border border-primary/20 bg-gradient-to-r from-primary/15 to-accent/15 p-5">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">🏆</div>
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">Competitive Rank</div>
                      <div className="mt-1 flex items-center gap-3">
                        <RankBadge rank={profile.rank} tier={profile.rank_tier} size="md" />
                        <span className="text-2xl font-black text-foreground">{profile.rating}</span>
                      </div>
                      {!profile.is_placement_complete && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Placement: {profile.placement_matches}/5 matches
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={`rounded-[1.75rem] border border-primary/20 bg-gradient-to-r ${rankInfo.bgColor} p-5`}>
                <div className="flex items-center gap-4">
                  <div className={`text-5xl ${rankInfo.color}`}>{rankInfo.icon}</div>
                  <div>
                    <div className="text-sm text-muted-foreground">Legacy Rank</div>
                    <div className={`text-2xl font-black ${rankInfo.color}`}>{rankInfo.rank}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {[
                  { icon: Trophy, label: "Total Points", value: profile.total_points || 0, color: "text-primary" },
                  { icon: Zap, label: "Total Wins", value: profile.total_wins || 0, color: "text-green-500" },
                  { icon: Target, label: "Games Played", value: profile.total_games || 0, color: "text-blue-500" },
                  { icon: Flame, label: "Current Streak", value: profile.win_streak || 0, color: "text-orange-500" },
                  { icon: Flame, label: "Longest Streak", value: profile.longest_win_streak || 0, color: "text-purple-500" },
                  { icon: Sparkles, label: "Countries Mastered", value: profile.countries_mastered || 0, color: "text-cyan-500" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/50 bg-muted/25 p-4 text-center">
                    <div className={`mb-2 text-3xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <stat.icon className="h-4 w-4" />
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {profile.total_games ? (
                <div className="rounded-[1.75rem] border border-border/50 bg-card/70 p-5">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="mt-2 text-5xl font-black text-primary">{winRate.toFixed(1)}%</div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {profile.total_wins} wins out of {profile.total_games} games
                  </div>
                </div>
              ) : null}

            </div>

            <div className="space-y-6">
              <div className="rounded-[1.75rem] border border-border/50 bg-card/70 p-5">
                <h3 className="text-xl font-black text-foreground">Avatar Decorations</h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p>Pick a preset theme below or upload your own transparent avatar decoration.</p>
                  <p>Avatar editing now supports zooming out more before you save.</p>
                  <p>Banner images and GIFs can now be scaled and repositioned with the Adjust button.</p>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-border/50 bg-card/70 p-5">
                <div className="grid max-h-[32rem] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                  {AVATAR_DECORATION_PRESETS.map((preset) => {
                    const selected = profile.avatar_decoration_preset === preset.id && !profile.avatar_decoration_url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => void handleDecorationPresetSelect(preset.id)}
                        className={`group rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-primary bg-primary/10 shadow-glow-primary"
                            : "border-border/50 bg-muted/20 hover:border-primary/40"
                        }`}
                        disabled={savingDecorationPreset === preset.id}
                      >
                        <div className={`mb-3 flex h-16 items-center justify-center rounded-2xl bg-gradient-to-br ${preset.accent} text-3xl shadow-lg`}>
                          {preset.emoji}
                        </div>
                        <div className="text-sm font-semibold text-foreground">{preset.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground capitalize">{preset.vibe}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AvatarEditorDialog
        open={avatarEditorOpen}
        file={pendingAvatarFile}
        onClose={() => {
          setAvatarEditorOpen(false);
          setPendingAvatarFile(null);
        }}
        onSave={handleAvatarUpload}
      />

      <BannerEditorDialog
        open={bannerEditorOpen}
        bannerUrl={withVersion(profile.banner_url)}
        bannerType={profile.banner_type}
        initialScale={bannerMedia.scale || 1}
        initialOffsetX={bannerMedia.offset_x || 0}
        initialOffsetY={bannerMedia.offset_y || 0}
        onClose={() => setBannerEditorOpen(false)}
        onSave={async ({ scale, offsetX, offsetY }) => {
          const nextConfig = {
            ...customizationConfig,
            banner_media: {
              scale,
              offset_x: offsetX,
              offset_y: offsetY,
            },
          };
          await api.updateProfile({ profile_customization_json: JSON.stringify(nextConfig) });
          setProfile((prev) => (
            prev
              ? {
                  ...prev,
                  profile_customization_json: JSON.stringify(nextConfig),
                }
              : prev
          ));
          setFlashMessage("success", "Banner layout updated!");
        }}
      />
    </div>
  );
}
