import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, Save, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { PREBUILT_PROFILE_ASSETS, PROFILE_EFFECT_THEMES } from "@/constants/profileAssets";
import { LottieRenderer } from "@/components/LottieRenderer";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { ProfileAsset, ProfileDecoration, ProfileDecorationTarget } from "@/types/profile";

interface ProfileCustomizationStudioProps {
  avatarUrl?: string;
  avatarType?: string;
  bannerUrl?: string;
  bannerType?: string;
  decorations: ProfileDecoration[];
  uploadedAssets: ProfileAsset[];
  onAssetsChange: (assets: ProfileAsset[]) => void;
  onDecorationsChange: (decorations: ProfileDecoration[], customizationJSON: string) => Promise<void>;
}

function buildDecorationId() {
  return `local-${crypto.randomUUID()}`;
}

function getDecorationConfigJSON(decoration: ProfileDecoration) {
  return JSON.stringify({
    target: decoration.target,
    asset_type: decoration.asset_type,
    position: {
      x: decoration.target === "avatar" ? 0 : decoration.position_x,
      y: decoration.target === "avatar" ? 0 : decoration.position_y,
    },
    scale: decoration.target === "avatar" ? Math.min(1.25, Math.max(1.1, decoration.scale)) : decoration.scale,
    rotation: decoration.rotation,
    z_index: decoration.z_index,
    loop: decoration.loop,
    speed: decoration.speed,
  });
}

function createDecoration(asset: ProfileAsset, target: ProfileDecorationTarget, order: number): ProfileDecoration {
  return {
    id: buildDecorationId(),
    asset_id: asset.id.startsWith("prebuilt-") ? null : asset.id,
    name: asset.name,
    source: asset.id.startsWith("prebuilt-") ? "prebuilt" : "uploaded",
    asset_type: asset.asset_type,
    target,
    asset_url: asset.url,
    position_x: 0,
    position_y: 0,
    scale: target === "banner" ? 1 : 1.14,
    rotation: 0,
    z_index: order,
    loop: true,
    speed: 1,
    enabled: true,
    config_json: "",
  };
}

function AssetRenderer({
  assetType,
  url,
  loop,
  speed,
  className,
}: {
  assetType: string;
  url: string;
  loop?: boolean;
  speed?: number;
  className?: string;
}) {
  if (assetType === "lottie") {
    return <LottieRenderer src={url} loop={loop} speed={speed} className={className} />;
  }

  return <img src={url} alt="" className={className} />;
}

export function ProfileCustomizationStudio({
  avatarUrl,
  avatarType = "image",
  bannerUrl,
  bannerType = "image",
  decorations,
  uploadedAssets,
  onAssetsChange,
  onDecorationsChange,
}: ProfileCustomizationStudioProps) {
  const [localDecorations, setLocalDecorations] = useState<ProfileDecoration[]>(decorations);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | undefined>(decorations[0]?.id);
  const [isSaving, setIsSaving] = useState(false);
  const dragStateRef = useRef<{ id: string; startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    setLocalDecorations(decorations);
    setSelectedDecorationId(decorations[0]?.id);
  }, [decorations]);

  const allAssets = useMemo(() => [...PREBUILT_PROFILE_ASSETS, ...uploadedAssets], [uploadedAssets]);
  const selectedDecoration = localDecorations.find((item) => item.id === selectedDecorationId);

  const sortedDecorations = useMemo(
    () => [...localDecorations].sort((a, b) => a.z_index - b.z_index),
    [localDecorations],
  );
  const avatarPreviewDecorations = useMemo(
    () => sortedDecorations.filter((item) => item.target === "avatar" && item.enabled),
    [sortedDecorations],
  );
  const bannerPreviewDecorations = useMemo(
    () => sortedDecorations.filter((item) => item.target === "banner" && item.enabled),
    [sortedDecorations],
  );

  const updateDecoration = (id: string, updater: (item: ProfileDecoration) => ProfileDecoration) => {
    setLocalDecorations((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const handleAddDecoration = (asset: ProfileAsset, target: ProfileDecorationTarget) => {
    const next = createDecoration(asset, target, localDecorations.length);

    setLocalDecorations((prev) => [...prev, next]);
    setSelectedDecorationId(next.id);
  };

  const applyThemePair = (themeId: string) => {
    const theme = PROFILE_EFFECT_THEMES.find((item) => item.id === themeId);
    if (!theme) return;

    const preserved = localDecorations.filter(
      (item) => !item.name.endsWith("Avatar Effect") && !item.name.endsWith("Banner Effect"),
    );
    const avatarDecoration = createDecoration(theme.avatarAsset, "avatar", preserved.length);
    const bannerDecoration = createDecoration(theme.bannerAsset, "banner", preserved.length + 1);
    bannerDecoration.scale = 1.02;

    const next = [...preserved, avatarDecoration, bannerDecoration];
    setLocalDecorations(next);
    setSelectedDecorationId(avatarDecoration.id);
  };

  const handleDecorationUpload = async (file: File, target: ProfileDecorationTarget) => {
    const uploaded = (await api.uploadProfileAsset(file, "decoration", target)) as ProfileAsset;
    onAssetsChange([uploaded, ...uploadedAssets]);
    handleAddDecoration(uploaded, target);
  };

  const persistDecorations = async () => {
    setIsSaving(true);
    try {
      const normalized = localDecorations.map((item, index) => ({
        ...item,
        position_x: item.target === "avatar" ? 0 : item.position_x,
        position_y: item.target === "avatar" ? 0 : item.position_y,
        scale: item.target === "avatar" ? Math.min(1.25, Math.max(1.1, item.scale)) : item.scale,
        z_index: index,
        config_json: getDecorationConfigJSON(item),
      }));
      setLocalDecorations(normalized);
      await onDecorationsChange(
        normalized,
        JSON.stringify({
          version: 1,
          decorations: normalized,
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const removeDecoration = (id: string) => {
    setLocalDecorations((prev) => prev.filter((item) => item.id !== id));
    if (selectedDecorationId === id) {
      setSelectedDecorationId(undefined);
    }
  };

  const beginDrag = (event: React.PointerEvent, item: ProfileDecoration) => {
    if (item.target === "avatar") {
      setSelectedDecorationId(item.id);
      return;
    }
    dragStateRef.current = {
      id: item.id || "",
      startX: event.clientX,
      startY: event.clientY,
      originX: item.position_x,
      originY: item.position_y,
    };
    setSelectedDecorationId(item.id);
  };

  const moveDrag = (event: React.PointerEvent) => {
    if (!dragStateRef.current) return;
    const { id, startX, startY, originX, originY } = dragStateRef.current;
    updateDecoration(id, (item) => ({
      ...item,
      position_x: originX + (event.clientX - startX),
      position_y: originY + (event.clientY - startY),
    }));
  };

  const stopDrag = () => {
    dragStateRef.current = null;
  };

  const renderDecoration = (item: ProfileDecoration) => (
    <div
      key={item.id}
      className={`absolute select-none ${item.target === "avatar" ? "inset-0 flex items-center justify-center" : "left-1/2 top-1/2 cursor-grab"} ${selectedDecorationId === item.id ? "ring-2 ring-primary/80" : ""}`}
      style={
        item.target === "avatar"
          ? {
              zIndex: item.z_index,
            }
          : {
              transform: `translate(calc(-50% + ${item.position_x}px), calc(-50% + ${item.position_y}px)) scale(${item.scale}) rotate(${item.rotation}deg)`,
              zIndex: item.z_index,
            }
      }
      onPointerDown={(event) => beginDrag(event, item)}
    >
      <AssetRenderer
        assetType={item.asset_type}
        url={item.asset_url}
        loop={item.loop}
        speed={item.speed}
        className={
          item.target === "avatar"
            ? "pointer-events-none h-[150px] w-[150px] object-contain"
            : "pointer-events-none h-32 w-56 object-contain"
        }
      />
    </div>
  );

  return (
    <div className="rounded-[1.75rem] border border-border/50 bg-card/90 p-5 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-foreground">Customization Studio</h3>
          <p className="text-sm text-muted-foreground">
            Drag decorations onto your avatar or banner, tune motion, then save the layout JSON.
          </p>
        </div>
        <Button onClick={() => void persistDecorations()} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Layout"}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Profile Effect Themes</div>
            <p className="mb-4 text-sm text-muted-foreground">
              Apply a coordinated avatar effect and banner effect together, then fine-tune them.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {PROFILE_EFFECT_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => applyThemePair(theme.id)}
                  className="overflow-hidden rounded-2xl border border-border/50 bg-background/80 text-left transition hover:border-primary/50 hover:bg-background"
                >
                  <div className="relative h-24 overflow-hidden border-b border-border/40">
                    <img src={theme.bannerAsset.url} alt="" className="h-full w-full object-cover opacity-95" />
                    <div className="absolute inset-y-0 left-4 my-auto h-14 w-14 overflow-hidden rounded-full border-2 border-white/70 bg-slate-950/70">
                      <img src={theme.avatarAsset.url} alt="" className="h-full w-full object-contain" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-foreground">{theme.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{theme.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[1.5rem] border border-border/50 bg-muted/20"
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            <div className="border-b border-border/40 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Banner Preview</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag banner decorations directly here. Use the right-side controls for scale, speed, rotation, and layering.
              </p>
            </div>
            <div className="relative h-56 overflow-hidden border-t border-border/40 bg-slate-900">
              {bannerUrl ? (
                bannerType === "lottie" ? (
                  <LottieRenderer src={bannerUrl} className="h-full w-full" />
                ) : (
                  <img src={bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,#ffb86b_0%,#ff6b4a_28%,#7d5cff_62%,#1b2438_100%)]" />
              )}
              {bannerPreviewDecorations.map(renderDecoration)}
            </div>
          </div>

          <div
            className="overflow-hidden rounded-[1.5rem] border border-border/50 bg-muted/20"
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            <div className="border-b border-border/40 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Avatar Preview</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Avatar decorations stay centered and locked to the circle. Add them from the library, then adjust motion on the right.
              </p>
            </div>
            <div className="flex justify-center border-t border-border/40 p-8">
              <ProfileAvatar
                avatarUrl={avatarUrl}
                avatarAlt="Avatar preview"
                avatarSize={128}
                decorations={avatarPreviewDecorations}
                fallback={<div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-600" />}
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Decoration Layers</div>
            <p className="mb-4 text-sm text-muted-foreground">
              Use this list to select a layer when the preview feels crowded. Banner layers can be dragged in preview; avatar layers remain locked to the frame.
            </p>
            {sortedDecorations.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {sortedDecorations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDecorationId(item.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      selectedDecorationId === item.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-background/70 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{item.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {item.target} • {item.asset_type}
                        </div>
                      </div>
                      <div className="rounded-full border border-border/50 px-2 py-1 text-xs text-muted-foreground">
                        z{item.z_index}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/50 bg-background/50 p-4 text-sm text-muted-foreground">
                No layers yet. Add a prebuilt theme, upload your own PNG/GIF/Lottie file, or choose an asset from the library below.
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <div className="text-sm font-semibold text-foreground">Decoration Library</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  The library stores reusable assets for profile customization. Use it for transparent PNG frames, animated GIF overlays, Lottie JSON effects, and prebuilt paired theme assets.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,application/json,.json,.avif,.svg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void handleDecorationUpload(file, "avatar");
                    }}
                  />
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-xs font-semibold">
                    <Upload className="h-4 w-4" />
                    Upload Avatar Decoration
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,application/json,.json,.avif,.svg"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void handleDecorationUpload(file, "banner");
                    }}
                  />
                  <div className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-background px-3 py-2 text-xs font-semibold">
                    <Upload className="h-4 w-4" />
                    Upload Banner Effect
                  </div>
                </label>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {allAssets.map((asset) => (
                <div key={asset.id} className="rounded-2xl border border-border/50 bg-background/80 p-4">
                  <div className="flex h-full flex-col gap-4 xl:flex-row">
                    <div className="overflow-hidden rounded-xl bg-slate-950/70 xl:w-40 xl:shrink-0">
                      <AssetRenderer
                        assetType={asset.asset_type}
                        url={asset.url}
                        loop
                        speed={1}
                        className="h-28 w-full object-contain xl:h-32"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="text-sm font-semibold text-foreground">{asset.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{asset.asset_type}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {asset.id.startsWith("prebuilt-")
                          ? "Prebuilt reusable effect asset."
                          : "Uploaded reusable asset for avatar or banner."}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleAddDecoration(asset, "avatar")} className="flex-1">
                          Add To Avatar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleAddDecoration(asset, "banner")} className="flex-1">
                          Add To Banner
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
            <div className="mb-4 text-sm font-semibold text-foreground">Selected Decoration</div>
            {selectedDecoration ? (
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Target</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedDecoration.target === "avatar" ? "default" : "outline"}
                      onClick={() => updateDecoration(selectedDecoration.id || "", (item) => ({
                        ...item,
                        target: "avatar",
                        position_x: 0,
                        position_y: 0,
                        scale: Math.min(1.25, Math.max(1.1, item.scale)),
                      }))}
                    >
                      Avatar
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedDecoration.target === "banner" ? "default" : "outline"}
                      onClick={() => updateDecoration(selectedDecoration.id || "", (item) => ({ ...item, target: "banner" }))}
                    >
                      Banner
                    </Button>
                  </div>
                </div>

                {[
                  { label: "Scale", min: selectedDecoration.target === "avatar" ? 1.05 : 0.3, max: selectedDecoration.target === "avatar" ? 1.25 : 3, step: 0.01, value: selectedDecoration.scale, key: "scale" as const },
                  { label: "Rotation", min: -180, max: 180, step: 1, value: selectedDecoration.rotation, key: "rotation" as const },
                  { label: "Speed", min: 0.2, max: 3, step: 0.1, value: selectedDecoration.speed, key: "speed" as const },
                  { label: "Z Index", min: 0, max: 20, step: 1, value: selectedDecoration.z_index, key: "z_index" as const },
                ].map((control) => (
                  <div key={control.label}>
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{control.label}</span>
                      <span>{control.value}</span>
                    </div>
                    <Slider
                      value={[control.value]}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      onValueChange={(value) =>
                        updateDecoration(selectedDecoration.id || "", (item) => ({
                          ...item,
                          [control.key]: value[0] ?? control.value,
                        }))
                      }
                    />
                  </div>
                ))}

                {selectedDecoration.target === "banner" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">X</div>
                      <Slider
                        value={[selectedDecoration.position_x]}
                        min={-200}
                        max={200}
                        step={1}
                        onValueChange={(value) =>
                          updateDecoration(selectedDecoration.id || "", (item) => ({
                            ...item,
                            position_x: value[0] ?? item.position_x,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Y</div>
                      <Slider
                        value={[selectedDecoration.position_y]}
                        min={-200}
                        max={200}
                        step={1}
                        onValueChange={(value) =>
                          updateDecoration(selectedDecoration.id || "", (item) => ({
                            ...item,
                            position_y: value[0] ?? item.position_y,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/50 bg-background/70 p-3 text-sm text-muted-foreground">
                    Avatar frames stay locked to the circle and scale around the edge like Nitro-style decorations.
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    id="loop-toggle"
                    type="checkbox"
                    checked={selectedDecoration.loop}
                    onChange={(event) =>
                      updateDecoration(selectedDecoration.id || "", (item) => ({
                        ...item,
                        loop: event.target.checked,
                      }))
                    }
                  />
                  <label htmlFor="loop-toggle" className="text-sm text-foreground">Loop animation</label>
                </div>

                <Button variant="destructive" onClick={() => removeDecoration(selectedDecoration.id || "")}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Decoration
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Select a decoration from the preview or add one from the library.
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-border/50 bg-muted/20 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Saved JSON Preview</div>
            <textarea
              className="min-h-[240px] w-full rounded-xl border border-border/50 bg-background/90 p-3 font-mono text-xs text-foreground"
              readOnly
              value={JSON.stringify(
                {
                  version: 1,
                  decorations: localDecorations,
                },
                null,
                2,
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
