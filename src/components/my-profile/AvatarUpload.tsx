"use client";

import { useRef, useState } from "react";
import { Camera, Loader } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type AvatarUploadProps = {
  avatarUrl: string | null;
  displayName: string;
  onUploaded: (url: string) => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AvatarUpload({
  avatarUrl,
  displayName,
  onUploaded,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/my-profile/avatar", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed");
      }
      onUploaded(result.url);
      toast({ variant: "success", description: "Avatar updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Avatar upload failed",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar className="h-28 w-28 border-2 border-border shadow-sm">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={displayName || "Profile avatar"} />
        ) : null}
        <AvatarFallback className="text-2xl font-semibold">
          {getInitials(displayName || "U")}
        </AvatarFallback>
      </Avatar>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="absolute bottom-0 right-0 h-9 w-9 rounded-full shadow"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload avatar"
      >
        {uploading ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
