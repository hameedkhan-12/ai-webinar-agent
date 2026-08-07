"use client";

import { useEffect, useMemo, useState } from "react";

import type { User } from "@/generated/prisma/client";
import { VoicesList } from "../components/voices-list";
import { VoicesToolbar } from "../components/voices-toolbar";
import type { VoiceItem } from "../components/voice-card";
import CustomVoiceAddonModal from "@/components/ReusableComponent/CustomVoiceAddOnModel";
import { Spinner } from "@/components/ui/spinner";

interface VoicesViewProps {
  user: User;
}

function filterVoices(voices: VoiceItem[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return voices;
  return voices.filter(
    (voice) =>
      voice.name.toLowerCase().includes(q) ||
      (voice.description ?? "").toLowerCase().includes(q)
  );
}

export function VoicesView({ user }: VoicesViewProps) {
  const [custom, setCustom] = useState<VoiceItem[] | null>(null);
  const [system, setSystem] = useState<VoiceItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [addonModalOpen, setAddonModalOpen] = useState(false);

  const fetchVoices = async () => {
    try {
      const res = await fetch("/api/voices");
      if (!res.ok) return;
      const data: { custom: VoiceItem[]; system: VoiceItem[] } =
        await res.json();
      setCustom(data.custom);
      setSystem(data.system);
    } catch (error) {
      console.error("Failed to load voices:", error);
    }
  };

  useEffect(() => {
    fetchVoices();
  }, []);

  const filteredCustom = useMemo(
    () => filterVoices(custom ?? [], query),
    [custom, query]
  );
  const filteredSystem = useMemo(
    () => filterVoices(system ?? [], query),
    [system, query]
  );

  const loading = custom === null || system === null;

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
          setCustom((prev) => [
            {
              id: voice.id,
              name: voice.name,
              description: null,
              category: "GENERAL",
              language: "en-US",
              variant: "CUSTOM",
              createdAt: new Date().toISOString(),
            },
            ...(prev ?? []),
          ]);
        }}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <VoicesList
            title="Your Custom Voices"
            voices={filteredCustom}
            emptyDescription="Voices you clone from an uploaded or recorded sample will appear here."
            onDeleted={(id) =>
              setCustom((prev) => prev?.filter((v) => v.id !== id) ?? prev)
            }
          />

          <VoicesList
            title="Built-in Voices"
            voices={filteredSystem}
            emptyDescription="Built-in voices haven't been seeded yet."
          />
        </>
      )}

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