"use client";

import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";

import type { User } from "@/generated/prisma/client";
import { VoicesList } from "../components/voices-list";
import { VoicesToolbar } from "../components/voices-toolbar";
import type { VoiceItem } from "../components/voice-card";
import CustomVoiceAddonModal from "@/components/ReusableComponent/CustomVoiceAddOnModel";
import { Spinner } from "@/components/ui/spinner";

interface VoicesViewProps {
  user: User;
}

export function VoicesView({ user }: VoicesViewProps) {
  const [voices, setVoices] = useState<VoiceItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);

  const fetchVoices = async () => {
    try {
      const res = await fetch("/api/voices");
      if (!res.ok) return;
      const data: { voices: VoiceItem[] } = await res.json();
      setVoices(data.voices);
    } catch (error) {
      console.error("Failed to load voices:", error);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const filteredVoices = useMemo(() => {
    if (!voices) return [];
    const q = query.trim().toLowerCase();
    if (!q) return voices;
    return voices.filter(
      (voice) =>
        voice.name.toLowerCase().includes(q) ||
        (voice.description ?? "").toLowerCase().includes(q)
    );
  }, [voices, query]);

  return (
    <div className="flex-1 space-y-10 overflow-y-auto p-3 lg:p-6">
      <VoicesToolbar
        query={query}
        onQueryChange={setQuery}
        createOpen={createOpen}
        onCreateOpenChange={setCreateOpen}
        canCreate={user.customVoiceEnabled}
        onSubscriptionRequired={() => setAddonModalOpen(true)}
        onCreated={(voice) => {
          setVoices((prev) => [
            {
              id: voice.id,
              name: voice.name,
              description: null,
              category: "GENERAL",
              language: "en-US",
              createdAt: new Date().toISOString(),
            },
            ...(prev ?? []),
          ]);
        }}
      />

      {voices === null ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : (
        <VoicesList
          title="Custom Voices"
          voices={filteredVoices}
          emptyDescription="Voices you clone from an uploaded or recorded sample will appear here."
          onDeleted={(id) =>
            setVoices((prev) => prev?.filter((v) => v.id !== id) ?? prev)
          }
        />
      )}

      <div className="flex items-start gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          There&apos;s no separate library of built-in voices here - when an
          agent doesn&apos;t use a custom cloned voice, it automatically
          speaks with Vapi&apos;s stock voice instead.
        </p>
      </div>

      <CustomVoiceAddonModal
        user={user}
        trigger={null}
        open={addonModalOpen}
        onOpenChange={setAddonModalOpen}
        onSuccess={() => {
          setAddonModalOpen(false);
          fetchVoices();
        }}
      />
    </div>
  );
}