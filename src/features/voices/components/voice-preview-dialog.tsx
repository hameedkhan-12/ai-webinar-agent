"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { VoiceItem } from "./voice-card";

const MAX_PREVIEW_CHARS = 300;
const DEFAULT_TEXT =
  "Hi there, thanks so much for joining today's session. I'm really glad you're here.";

interface VoicePreviewDialogProps {
  voice: VoiceItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lets a host type arbitrary text and hear it back in a cloned voice,
 * using the same Chatterbox generation path Vapi calls mid-call
 * (src/lib/chatterbox.ts). This is a manual sanity check, not a
 * general-purpose text-to-speech feature - there's no history, no
 * saved generations, and it isn't billed/metered separately.
 */
export function VoicePreviewDialog({
  voice,
  open,
  onOpenChange,
}: VoicePreviewDialogProps) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Enter some text to generate");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`/api/voices/${voice.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, MAX_PREVIEW_CHARS) }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to generate preview");
      }

      const blob = await response.blob();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      audioRef.current?.pause();
      const audio = new Audio(url);
      audio.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current = audio;

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate preview",
      );
    } finally {
      setGenerating(false);
    }
  };

  const toggleReplay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-115">
        <DialogHeader>
          <DialogTitle>Test &quot;{voice.name}&quot;</DialogTitle>
          <DialogDescription>
            Generates a one-off sample so you can check quality before assigning
            this voice to a live agent. This does not save or bill anything - it
            uses the same Chatterbox model Vapi calls during a real call, so
            latency here is a good proxy for live-call latency.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_PREVIEW_CHARS}
          rows={4}
          placeholder="Type what you want this voice to say..."
        />
        <p className="text-right text-xs text-muted-foreground">
          {text.length}/{MAX_PREVIEW_CHARS}
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          {audioRef.current ? (
            <Button
              type="button"
              variant="outline"
              onClick={toggleReplay}
              disabled={generating}
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
              {isPlaying ? "Pause" : "Replay"}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="size-4" />
                Generate & play
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
