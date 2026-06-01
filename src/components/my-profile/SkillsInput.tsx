"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SkillsInputProps = {
  value: string[];
  onChange: (skills: string[]) => void;
};

export function SkillsInput({ value, onChange }: SkillsInputProps) {
  const [draft, setDraft] = useState("");

  const addSkill = () => {
    const skill = draft.trim();
    if (!skill) return;
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setDraft("");
      return;
    }
    if (value.length >= 30) return;
    onChange([...value, skill]);
    setDraft("");
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((item) => item !== skill));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a skill and press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addSkill}>
          Add
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((skill) => (
            <Badge key={skill} variant="secondary" className="gap-1 pr-1">
              {skill}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No skills added yet.</p>
      )}
    </div>
  );
}
