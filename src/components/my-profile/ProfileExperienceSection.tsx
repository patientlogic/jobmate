"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Briefcase, Pencil, PlusCircle, Trash2 } from "lucide-react";

import { deleteProfileExperience } from "@/actions/userProfile.actions";
import { ProfileExperienceDialog } from "@/components/my-profile/ProfileExperienceDialog";
import { TipTapContentViewer } from "@/components/TipTapContentViewer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAlertDialog } from "@/components/DeleteAlertDialog";
import { toast } from "@/components/ui/use-toast";
import type { ProfileExperience } from "@/models/userProfile.model";

type ProfileExperienceSectionProps = {
  experiences: ProfileExperience[];
  onChanged: () => void;
};

export function ProfileExperienceSection({
  experiences,
  onChanged,
}: ProfileExperienceSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editExperience, setEditExperience] =
    useState<ProfileExperience | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAdd = () => {
    setEditExperience(null);
    setDialogOpen(true);
  };

  const openEdit = (experience: ProfileExperience) => {
    setEditExperience(experience);
    setDialogOpen(true);
  };

  const onDelete = () => {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteProfileExperience(deleteId);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
        return;
      }
      toast({ variant: "success", description: "Experience removed" });
      setDeleteId(null);
      onChanged();
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Experience
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={openAdd}>
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add your work history like on LinkedIn.
            </p>
          ) : (
            experiences.map((experience) => (
              <div
                key={experience.id}
                className="rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{experience.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {experience.company}
                      {experience.location ? ` · ${experience.location}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(experience.startDate), "MMM yyyy")} –{" "}
                      {experience.isCurrent || !experience.endDate
                        ? "Present"
                        : format(new Date(experience.endDate), "MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(experience)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      disabled={isPending}
                      onClick={() => setDeleteId(experience.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {experience.description ? (
                  <div className="mt-3 text-sm">
                    <TipTapContentViewer content={experience.description} />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ProfileExperienceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        experience={editExperience}
        onSaved={onChanged}
      />

      <DeleteAlertDialog
        pageTitle="experience entry"
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onDelete={onDelete}
      />
    </>
  );
}
