"use client";

import { Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { VoiceCreateDialog } from "./voice-create-dialog";

interface VoicesToolbarProps {
  query: string;
  onQueryChange: (query: string) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
  onCreated: (voice: { id: string; name: string }) => void;
  onSubscriptionRequired: () => void;
  canCreate: boolean;
}

export function VoicesToolbar({
  query,
  onQueryChange,
  createOpen,
  onCreateOpenChange,
  onCreated,
  onSubscriptionRequired,
  canCreate,
}: VoicesToolbarProps) {
  const handleCreateClick = () => {
    if (!canCreate) {
      onSubscriptionRequired();
      return;
    }
    onCreateOpenChange(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">
          Your Voice Library
        </h2>
        <p className="text-sm text-muted-foreground">
          Clone your voice, or a guest speaker&apos;s, so your AI call agent
          sounds like a real person instead of a stock voice.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <InputGroup className="lg:max-w-sm">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search voices..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </InputGroup>
          <Button size="sm" className="ml-auto" onClick={handleCreateClick}>
            <Sparkles />
            Custom voice
          </Button>
        </div>
      </div>

      <VoiceCreateDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        onCreated={onCreated}
        onSubscriptionRequired={onSubscriptionRequired}
      />
    </div>
  );
}