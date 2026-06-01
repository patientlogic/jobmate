"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  getMyUserProfile,
  updateMyUserProfile,
} from "@/actions/userProfile.actions";
import { AvatarUpload } from "@/components/my-profile/AvatarUpload";
import { ProfileExperienceSection } from "@/components/my-profile/ProfileExperienceSection";
import { SkillsInput } from "@/components/my-profile/SkillsInput";
import Loading from "@/components/Loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { UpdateUserProfileSchema } from "@/models/userProfileForm.schema";
import type { UserProfile } from "@/models/userProfile.model";

export default function MyProfileContainer({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  const form = useForm<z.infer<typeof UpdateUserProfileSchema>>({
    resolver: zodResolver(UpdateUserProfileSchema),
    defaultValues: {
      displayName: "",
      headline: "",
      bio: "",
      skills: [],
      avatarUrl: null,
      resumeUrl: null,
      resumeName: null,
    },
  });

  const loadProfile = useCallback(async () => {
    const result = await getMyUserProfile();
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: result.message,
      });
      return;
    }
    setProfile(result.data);
    form.reset({
      displayName: result.data.displayName,
      headline: result.data.headline,
      bio: result.data.bio ?? "",
      skills: result.data.skills,
      avatarUrl: result.data.avatarUrl,
      resumeUrl: result.data.resumeUrl,
      resumeName: result.data.resumeName,
    });
  }, [form]);

  useEffect(() => {
    (async () => {
      setInitialLoading(true);
      await loadProfile();
      setInitialLoading(false);
    })();
  }, [loadProfile]);

  const onSubmit = (data: z.infer<typeof UpdateUserProfileSchema>) => {
    startTransition(async () => {
      const result = await updateMyUserProfile(data);
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: result.message,
        });
        return;
      }
      setProfile(result.data);
      toast({ variant: "success", description: "Profile saved" });
    });
  };

  const onResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/my-profile/resume", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Upload failed");
      }
      form.setValue("resumeUrl", result.url);
      form.setValue("resumeName", result.fileName ?? file.name);
      toast({ variant: "success", description: "Resume uploaded" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description:
          error instanceof Error ? error.message : "Resume upload failed",
      });
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  };

  if (initialLoading) {
    return <Loading />;
  }

  const displayName = form.watch("displayName");
  const avatarUrl = form.watch("avatarUrl");
  const resumeUrl = form.watch("resumeUrl");
  const resumeName = form.watch("resumeName");

  return (
    <div className="space-y-6">
      <div>
        {embedded ? (
          <>
            <h3 className="text-lg font-medium">My Profile</h3>
            <p className="text-sm text-muted-foreground">
              Your public-facing profile for recruiters and the community.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your public-facing profile for recruiters and the community.
            </p>
          </>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-start">
              <AvatarUpload
                avatarUrl={avatarUrl ?? null}
                displayName={displayName}
                onUploaded={(url) => form.setValue("avatarUrl", url)}
              />
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Full Stack Developer · React · Node.js"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={5}
                        placeholder="Tell recruiters about your background, strengths, and goals..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SkillsInput
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {resumeName || "View resume"}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Upload a PDF or Word resume.
                </p>
              )}
              <div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onResumeUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resumeUploading}
                  onClick={() => resumeInputRef.current?.click()}
                >
                  {resumeUploading ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {resumeUrl ? "Replace resume" : "Upload resume"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              Save profile
              {isPending ? (
                <Loader className="ml-2 h-4 w-4 shrink-0 spinner" />
              ) : null}
            </Button>
          </div>
        </form>
      </Form>

      {profile ? (
        <ProfileExperienceSection
          experiences={profile.experiences}
          onChanged={loadProfile}
        />
      ) : null}
    </div>
  );
}
