"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { saveProfileExperience } from "@/actions/userProfile.actions";
import { DatePicker } from "@/components/DatePicker";
import TiptapEditor from "@/components/TiptapEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { ProfileExperienceFormSchema } from "@/models/userProfileForm.schema";
import type { ProfileExperience } from "@/models/userProfile.model";

type ProfileExperienceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: ProfileExperience | null;
  onSaved: () => void;
};

export function ProfileExperienceDialog({
  open,
  onOpenChange,
  experience,
  onSaved,
}: ProfileExperienceDialogProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof ProfileExperienceFormSchema>>({
    resolver: zodResolver(ProfileExperienceFormSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      isCurrent: false,
    },
  });

  const isCurrent = form.watch("isCurrent");

  useEffect(() => {
    if (!open) return;
    if (experience) {
      form.reset({
        id: experience.id,
        title: experience.title,
        company: experience.company,
        location: experience.location ?? "",
        startDate: new Date(experience.startDate),
        endDate: experience.endDate ? new Date(experience.endDate) : undefined,
        isCurrent: experience.isCurrent,
        description: experience.description ?? "",
      });
    } else {
      form.reset({
        title: "",
        company: "",
        location: "",
        isCurrent: false,
        description: "",
      });
    }
  }, [open, experience, form]);

  const onSubmit = (data: z.infer<typeof ProfileExperienceFormSchema>) => {
    startTransition(async () => {
      const result = await saveProfileExperience(data);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
        return;
      }
      toast({
        variant: "success",
        description: experience ? "Experience updated" : "Experience added",
      });
      onOpenChange(false);
      onSaved();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {experience ? "Edit experience" : "Add experience"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Senior Software Engineer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Company name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Remote · City, Country"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <DatePicker field={field} presets={false} isEnabled />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <DatePicker
                      field={field}
                      presets={false}
                      isEnabled={!isCurrent}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isCurrent"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          form.setValue("endDate", undefined);
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">I currently work here</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <TiptapEditor field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                Save
                {isPending ? (
                  <Loader className="ml-2 h-4 w-4 shrink-0 spinner" />
                ) : null}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
