"use client";

import { Loader, Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { SiteProfileFormSchema } from "@/models/siteProfileForm.schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { SiteProfile } from "@/models/profile.model";
import { toast } from "../ui/use-toast";
import {
  createSiteProfile,
  getSiteProfilePassword,
  updateSiteProfile,
} from "@/actions/siteProfile.actions";

type CreateSiteProfileProps = {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  siteProfileToEdit?: SiteProfile | null;
  reloadDocuments: () => void;
  subjectUserId?: string;
};

function CreateSiteProfile({
  dialogOpen,
  setDialogOpen,
  siteProfileToEdit,
  reloadDocuments,
  subjectUserId,
}: CreateSiteProfileProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const isEditing = !!siteProfileToEdit?.id;

  const pageTitle = isEditing ? "Edit Site Profile" : "Add Site Profile";

  const form = useForm<z.infer<typeof SiteProfileFormSchema>>({
    resolver: zodResolver(SiteProfileFormSchema),
    mode: "onChange",
    defaultValues: {
      siteUrl: "",
      accountName: "",
      email: "",
      password: "",
    },
  });

  const {
    reset,
    watch,
    formState: { errors, isValid },
  } = form;

  const password = watch("password");
  const canSubmit = isEditing ? isValid : isValid && !!password?.trim();

  const closeDialog = () => setDialogOpen(false);

  useEffect(() => {
    reset({
      id: siteProfileToEdit?.id ?? undefined,
      siteUrl: siteProfileToEdit?.siteUrl ?? "",
      accountName: siteProfileToEdit?.accountName ?? "",
      email: siteProfileToEdit?.email ?? "",
      password: "",
    });
    setCopied(false);
  }, [siteProfileToEdit, reset]);

  const copyPassword = async () => {
    try {
      let value = password?.trim();

      if (!value && siteProfileToEdit?.id) {
        const { success, password: storedPassword, message } =
          await getSiteProfilePassword(siteProfileToEdit.id, subjectUserId);

        if (!success || !storedPassword) {
          toast({
            variant: "destructive",
            title: "Error!",
            description: message ?? "Failed to copy password.",
          });
          return;
        }

        value = storedPassword;
      }

      if (!value) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: "No password available to copy.",
        });
        return;
      }

      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        variant: "success",
        description: "Password copied to clipboard.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to copy password.",
      });
    }
  };

  const onSubmit = (data: z.infer<typeof SiteProfileFormSchema>) => {
    if (!isEditing && !data.password?.trim()) {
      form.setError("password", {
        message: "Password is required.",
      });
      return;
    }

    startTransition(async () => {
      const { success, message } = isEditing
        ? await updateSiteProfile(
            data.id!,
            data.siteUrl,
            data.accountName,
            data.email,
            data.password?.trim() || undefined,
            subjectUserId,
          )
        : await createSiteProfile(
            data.siteUrl,
            data.accountName,
            data.email,
            data.password!,
            subjectUserId,
          );

      if (!success) {
        toast({
          variant: "destructive",
          title: "Error!",
          description: message,
        });
      } else {
        reset();
        setDialogOpen(false);
        reloadDocuments();
        toast({
          variant: "success",
          description: `Site profile has been ${
            isEditing ? "updated" : "created"
          } successfully`,
        });
      }
    });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="lg:max-w-screen-sm">
        <DialogHeader>
          <DialogTitle>{pageTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.stopPropagation();
              form.handleSubmit(onSubmit)(event);
            }}
            className="grid grid-cols-1 gap-4 p-2"
          >
            <FormField
              control={form.control}
              name="siteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: https://www.indeed.com"
                    />
                  </FormControl>
                  <FormMessage>
                    {errors.siteUrl && (
                      <span className="text-red-500">
                        {errors.siteUrl.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Indeed - John Doe" />
                  </FormControl>
                  <FormMessage>
                    {errors.accountName && (
                      <span className="text-red-500">
                        {errors.accountName.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Ex: you@example.com"
                    />
                  </FormControl>
                  <FormMessage>
                    {errors.email && (
                      <span className="text-red-500">
                        {errors.email.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password
                    {isEditing && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (leave blank to keep current)
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        className={isEditing ? "pr-10" : undefined}
                      />
                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                          onClick={copyPassword}
                          aria-label="Copy password to clipboard"
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage>
                    {errors.password && (
                      <span className="text-red-500">
                        {errors.password.message}
                      </span>
                    )}
                  </FormMessage>
                </FormItem>
              )}
            />

            <div className="mt-4">
              <DialogFooter>
                <div>
                  <Button
                    type="reset"
                    variant="outline"
                    className="mt-2 md:mt-0 w-full"
                    onClick={closeDialog}
                  >
                    Cancel
                  </Button>
                </div>
                <Button type="submit" disabled={!canSubmit || isPending}>
                  Save
                  {isPending && (
                    <Loader className="h-4 w-4 shrink-0 spinner" />
                  )}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateSiteProfile;
