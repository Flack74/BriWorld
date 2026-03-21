import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LottieRenderer } from "@/components/LottieRenderer";

interface BannerEditorDialogProps {
  open: boolean;
  bannerUrl?: string;
  bannerType?: string;
  initialScale?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onClose: () => void;
  onSave: (settings: { scale: number; offsetX: number; offsetY: number }) => Promise<void> | void;
}

export function BannerEditorDialog({
  open,
  bannerUrl,
  bannerType = "image",
  initialScale = 1,
  initialOffsetX = 0,
  initialOffsetY = 0,
  onClose,
  onSave,
}: BannerEditorDialogProps) {
  const [scale, setScale] = useState(initialScale);
  const [offsetX, setOffsetX] = useState(initialOffsetX);
  const [offsetY, setOffsetY] = useState(initialOffsetY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setScale(initialScale);
      setOffsetX(initialOffsetX);
      setOffsetY(initialOffsetY);
    }
  }, [open, initialOffsetX, initialOffsetY, initialScale]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ scale, offsetX, offsetY });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl border-border/60 bg-card/95 p-0 backdrop-blur-xl">
        <div className="overflow-hidden rounded-3xl">
          <div className="border-b border-border/50 bg-[radial-gradient(circle_at_top_left,#1d3658_0%,#121e2b_50%,#0a1018_100%)] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Adjust Banner</DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-white/70">
              Scale and reposition your banner image or GIF without reuploading it.
            </p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
            <div className="overflow-hidden rounded-[2rem] border border-border/50 bg-slate-950">
              <div className="relative h-72 overflow-hidden">
                {bannerUrl ? (
                  bannerType === "lottie" ? (
                    <div
                      className="absolute inset-0"
                      style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: "center center" }}
                    >
                      <LottieRenderer src={bannerUrl} className="h-full w-full" />
                    </div>
                  ) : (
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`, transformOrigin: "center center" }}
                    />
                  )
                ) : null}
                <div className="pointer-events-none absolute inset-0 border border-white/10" />
              </div>
            </div>

            <div className="space-y-6 rounded-[1.75rem] border border-border/50 bg-muted/20 p-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Scale</span>
                  <span>{scale.toFixed(2)}x</span>
                </div>
                <Slider value={[scale]} min={0.3} max={5} step={0.01} onValueChange={(value) => setScale(value[0] || 1)} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Horizontal</span>
                  <span>{offsetX}px</span>
                </div>
                <Slider value={[offsetX]} min={-240} max={240} step={1} onValueChange={(value) => setOffsetX(value[0] || 0)} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Vertical</span>
                  <span>{offsetY}px</span>
                </div>
                <Slider value={[offsetY]} min={-180} max={180} step={1} onValueChange={(value) => setOffsetY(value[0] || 0)} />
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/70 p-4 text-sm text-muted-foreground">
                Use a lower scale to zoom out. GIF banners stay animated because this editor stores transform settings instead of flattening the file.
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleSave} disabled={saving || !bannerUrl} className="h-auto rounded-2xl px-5 py-3 text-sm font-bold">
                  {saving ? "Saving..." : "Save Banner Layout"}
                </Button>
                <Button variant="outline" onClick={onClose} className="h-auto rounded-2xl px-5 py-3 text-sm font-bold">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
