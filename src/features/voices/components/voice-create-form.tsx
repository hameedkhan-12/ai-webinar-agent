"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import {
  AudioLines,
  FolderOpen,
  X,
  FileAudio,
  Upload,
  Mic,
  Tag,
  Play,
  Pause,
  Check,
  ChevronsUpDown,
  Globe,
  Layers,
  AlignLeft,
} from "lucide-react";
import locales from "locale-codes";

import { cn, formatFileSize } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { VOICE_CATEGORIES, VOICE_CATEGORY_LABELS } from "@/lib/voiceCategories";
import type { VoiceCategory } from "@/generated/prisma/enums";
import { VoiceRecorder } from "./voice-recorder";
import { Field, FieldError } from "@/components/ui/field";
import { useAudioPlayback } from "@/hooks/use-audio-playbook";

const LANGUAGE_OPTIONS = locales.all
  .filter((l) => l.tag && l.tag.includes("-") && l.name)
  .map((l) => ({
    value: l.tag,
    label: l.location ? `${l.name} (${l.location})` : l.name,
  }));

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // matches the API's own limit

function FileDropzone({
  file,
  onFileChange,
  isInvalid,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  isInvalid?: boolean;
}) {
  const { isPlaying, togglePlay } = useAudioPlayback(file);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: { "audio/*": [] },
      maxSize: MAX_FILE_SIZE_BYTES,
      multiple: false,
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          onFileChange(acceptedFiles[0]);
        }
      },
    });

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <FileAudio className="size-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>

        <Button type="button" variant="ghost" size="icon-sm" onClick={togglePlay}>
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onFileChange(null)}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border px-6 py-10 transition-colors",
        isDragReject || isInvalid
          ? "border-destructive"
          : isDragActive
            ? "border-primary"
            : ""
      )}
    >
      <input {...getInputProps()} />
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <AudioLines className="size-5 text-muted-foreground" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-base font-semibold tracking-tight">
          Upload your audio file
        </p>
        <p className="text-center text-sm text-muted-foreground">
          At least 10 seconds of clean, single-speaker audio. Max size 20MB.
        </p>
      </div>

      <Button type="button" variant="outline" size="sm">
        <FolderOpen className="size-3.5" />
        Upload file
      </Button>
    </div>
  );
}

function LanguageCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    LANGUAGE_OPTIONS.find((l) => l.value === value)?.label ?? "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            {value ? selectedLabel : "Select language..."}
          </div>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {LANGUAGE_OPTIONS.map((lang) => (
                <CommandItem
                  key={lang.value}
                  value={lang.label}
                  onSelect={() => {
                    onChange(lang.value);
                    setOpen(false);
                  }}
                >
                  {lang.label}
                  <Check
                    className={cn(
                      "ml-auto size-4",
                      value === lang.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface VoiceCreateFormProps {
  scrollable?: boolean;
  footer?: (submit: React.ReactNode) => React.ReactNode;
  onError?: (message: string) => void;
  onCreated?: (voice: { id: string; name: string }) => void;
}

export function VoiceCreateForm({
  scrollable,
  footer,
  onError,
  onCreated,
}: VoiceCreateFormProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<VoiceCategory>("GENERAL");
  const [language, setLanguage] = useState("en-US");
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nameInvalid = touched && name.trim().length === 0;
  const fileInvalid = touched && !file;

  const resetForm = () => {
    setName("");
    setFile(null);
    setCategory("GENERAL");
    setLanguage("en-US");
    setDescription("");
    setTouched(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!name.trim() || !file) {
      return;
    }

    setSubmitting(true);
    try {
      const params = new URLSearchParams({ name, category, language });
      if (description) params.set("description", description);

      const response = await fetch(`/api/voices/create?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": file.type || "audio/wav" },
        body: file,
      });

      const result = await response.json();

      if (response.status === 403 && result.error === "SUBSCRIPTION_REQUIRED") {
        onError?.("SUBSCRIPTION_REQUIRED");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to create voice");
      }

      toast.success("Voice created successfully!");
      onCreated?.({ id: result.id, name: result.name ?? name });
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create voice";
      if (onError) {
        onError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitButton = (
    <Button type="submit" disabled={submitting}>
      {submitting ? "Creating..." : "Create Voice"}
    </Button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col", scrollable ? "min-h-0 flex-1" : "gap-6")}
    >
      <div
        className={cn(
          scrollable
            ? "no-scrollbar flex flex-col gap-6 overflow-y-auto px-4"
            : "flex flex-col gap-6"
        )}
      >
        <Field data-invalid={fileInvalid}>
          <Tabs defaultValue="upload">
            <TabsList className="h-11! w-full">
              <TabsTrigger value="upload">
                <Upload className="size-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="record">
                <Mic className="size-3.5" />
                Record
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <FileDropzone
                file={file}
                onFileChange={setFile}
                isInvalid={fileInvalid}
              />
            </TabsContent>
            <TabsContent value="record">
              <VoiceRecorder
                file={file}
                onFileChange={setFile}
                isInvalid={fileInvalid}
              />
            </TabsContent>
          </Tabs>
          {fileInvalid && (
            <FieldError errors={[{ message: "An audio file is required" }]} />
          )}
        </Field>

        <Field data-invalid={nameInvalid}>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-0 flex h-full w-11 items-center justify-center">
              <Tag className="size-4 text-muted-foreground" />
            </div>
            <Input
              placeholder="Voice Label"
              aria-invalid={nameInvalid}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              className="pl-10"
            />
          </div>
          {nameInvalid && (
            <FieldError errors={[{ message: "Name is required" }]} />
          )}
        </Field>

        <Field>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-0 flex h-full w-11 items-center justify-center">
              <Layers className="size-4 text-muted-foreground" />
            </div>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as VoiceCategory)}
            >
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {VOICE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {VOICE_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>

        <Field>
          <LanguageCombobox value={language} onChange={setLanguage} />
        </Field>

        <Field>
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-0 top-3 flex w-11 items-center justify-center">
              <AlignLeft className="size-4 text-muted-foreground" />
            </div>
            <Textarea
              placeholder="Describe this voice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 pl-10"
              rows={3}
            />
          </div>
        </Field>

        {footer ? footer(submitButton) : submitButton}
      </div>
    </form>
  );
}