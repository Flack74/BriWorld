import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface AvatarEditorDialogProps {
  open: boolean;
  file: File | null;
  onClose: () => void;
  onSave: (file: File) => Promise<void> | void;
}

export function AvatarEditorDialog({
  open,
  file,
  onClose,
  onSave,
}: AvatarEditorDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [open, file]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    setDragging(true);
    dragStartRef.current = {
      x: clientX - offset.x,
      y: clientY - offset.y,
    };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!dragging) return;
    setOffset({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const finishDrag = () => setDragging(false);

  const computePreviewGeometry = async () => {
    if (!previewUrl || !file || !frameRef.current) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = previewUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const frameRect = frameRef.current.getBoundingClientRect();
    const baseScale = Math.max(frameRect.width / img.width, frameRect.height / img.height);

    return {
      img,
      frameWidth: frameRect.width,
      frameHeight: frameRect.height,
      displayScale: baseScale * zoom,
      displayWidth: img.width * baseScale * zoom,
      displayHeight: img.height * baseScale * zoom,
    };
  };

  const generateCroppedFile = async () => {
    const geometry = await computePreviewGeometry();
    if (!geometry) return null;

    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaleX = size / geometry.frameWidth;
    const scaleY = size / geometry.frameHeight;
    const drawWidth = geometry.displayWidth * scaleX;
    const drawHeight = geometry.displayHeight * scaleY;
    const drawX = (size - drawWidth) / 2 + offset.x * scaleX;
    const drawY = (size - drawHeight) / 2 + offset.y * scaleY;

    ctx.drawImage(geometry.img, drawX, drawY, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 0.92),
    );
    if (!blob) return null;

    return new File([blob], `avatar-${Date.now()}.png`, { type: "image/png" });
  };

  const handleSave = async () => {
    const croppedFile = await generateCroppedFile();
    if (!croppedFile) return;
    setSaving(true);
    try {
      await onSave(croppedFile);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl border-border/60 bg-card/95 p-0 backdrop-blur-xl">
        <div className="overflow-hidden rounded-3xl">
          <div className="border-b border-border/50 bg-[radial-gradient(circle_at_top_left,#1d3658_0%,#121e2b_50%,#0a1018_100%)] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Frame Your Avatar</DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-white/70">
              Zoom in or out, drag the image, and choose the exact section before saving.
            </p>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
            <div
              className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[2rem] border border-border/50 bg-[radial-gradient(circle_at_center,#28405f_0%,#121d2a_52%,#09111b_100%)]"
              onMouseMove={(event) => handlePointerMove(event.clientX, event.clientY)}
              onMouseUp={finishDrag}
              onMouseLeave={finishDrag}
              onTouchMove={(event) => {
                const touch = event.touches[0];
                if (touch) handlePointerMove(touch.clientX, touch.clientY);
              }}
              onTouchEnd={finishDrag}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[length:100%_36px]" />
              <div ref={frameRef} className="relative h-72 w-72 overflow-hidden rounded-full border-4 border-white/80 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="absolute left-1/2 top-1/2 h-full w-full max-w-none select-none object-cover"
                    draggable={false}
                    onMouseDown={(event) => handlePointerDown(event.clientX, event.clientY)}
                    onTouchStart={(event) => {
                      const touch = event.touches[0];
                      if (touch) handlePointerDown(touch.clientX, touch.clientY);
                    }}
                    style={{
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                      cursor: dragging ? "grabbing" : "grab",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6 rounded-[1.75rem] border border-border/50 bg-muted/20 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Zoom
                </p>
                <div className="mt-4">
                  <Slider
                    value={[zoom]}
                    min={0.5}
                    max={5}
                    step={0.05}
                    onValueChange={(value) => setZoom(value[0] || 1)}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {zoom.toFixed(2)}x crop scale
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/70 p-4 text-sm text-muted-foreground">
                Drag the image inside the circle to choose which section becomes your avatar.
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSave}
                  className="h-auto rounded-2xl px-5 py-3 text-sm font-bold"
                  disabled={!file || saving}
                >
                  {saving ? "Saving..." : "Save Avatar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-auto rounded-2xl px-5 py-3 text-sm font-bold"
                >
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
