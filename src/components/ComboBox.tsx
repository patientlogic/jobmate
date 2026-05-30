"use client";

import { Check, ChevronsUpDown, CirclePlus, Loader } from "lucide-react";
import { ControllerRenderProps } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { useState, useTransition } from "react";
import { createLocation } from "@/actions/job.actions";
import { addCompany } from "@/actions/company.actions";
import { createJobTitle } from "@/actions/jobtitle.actions";
import { toast } from "./ui/use-toast";
import { createActivityType } from "@/actions/activity.actions";
import { createJobSource } from "@/actions/job.actions";

interface ComboboxProps {
  options: any[];
  field: ControllerRenderProps<any, any>;
  creatable?: boolean;
  onOptionsChange?: (options: any[]) => void;
}

export function Combobox({
  options,
  field,
  creatable,
  onOptionsChange,
}: ComboboxProps) {
  const [newOption, setNewOption] = useState<string>("");
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const [isPending, startTransition] = useTransition();

  const onCreateOption = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    startTransition(async () => {
      let response;
      switch (field.name) {
        case "company":
          const res = await addCompany({ company: trimmed });
          if (!res?.success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: res?.message,
            });
            return;
          }
          response = res.data;
          break;
        case "title":
          response = await createJobTitle(trimmed);
          break;
        case "location":
          const { data, success, message } = await createLocation(trimmed);
          if (!success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: message,
            });
          }
          response = data;
          break;
        case "source":
          const sourceRes = await createJobSource(trimmed);
          if (!sourceRes.success) {
            toast({
              variant: "destructive",
              title: "Error!",
              description: sourceRes.message,
            });
          }
          response = sourceRes.data;
          if (!sourceRes.success) return;
          break;
        case "activityType":
          response = await createActivityType(trimmed);
          break;
        default:
          break;
      }
      if (!response?.id) return;

      const exists = options.some((option) => option.id === response.id);
      const updatedOptions = exists
        ? options
        : [response, ...options];

      onOptionsChange?.(updatedOptions);
      field.onChange(response.id);
      setNewOption("");
      setIsPopoverOpen(false);
    });
  };

  const trimmedSearch = newOption.trim();
  const showCreateOption =
    creatable &&
    trimmedSearch.length > 0 &&
    !options.some(
      (option) =>
        option.label.toLowerCase() === trimmedSearch.toLowerCase() ||
        option.value.toLowerCase() === trimmedSearch.toLowerCase(),
    );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "md:w-[240px] lg:w-[280px] justify-between capitalize",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? options.find((option) => option.id === field.value)?.label
              : `Select ${field.name}`}

            {isPending ? (
              <Loader className="h-4 w-4 shrink-0 spinner" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="md:w-[240px] lg:w-[280px] p-0">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput
            value={newOption}
            onValueChange={(val: string) => setNewOption(val)}
            placeholder={`${creatable ? "Create or " : ""}Search ${field.name}`}
          />
          <CommandEmpty
            onClick={() => {
              onCreateOption(newOption);
              setNewOption("");
            }}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1 italic mt-2",
              !newOption && "text-muted-foreground cursor-default"
            )}
          >
            {creatable ? (
              <>
                <CirclePlus className="h-4 w-4" />
                <p>Create: </p>
                <p className="block max-w-48 truncate font-semibold text-primary">
                  {newOption}
                </p>
              </>
            ) : (
              <p className="font-semibold text-primary">No source found!</p>
            )}
          </CommandEmpty>
          <ScrollArea>
            <CommandGroup>
              <CommandList className="capitalize">
                {showCreateOption ? (
                  <CommandItem
                    value={`__create__${trimmedSearch}`}
                    onSelect={() => onCreateOption(trimmedSearch)}
                    className="cursor-pointer text-primary"
                  >
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Create &quot;{trimmedSearch}&quot;
                  </CommandItem>
                ) : null}
                {options.map((option) => (
                  <CommandItem
                    value={option.value}
                    key={option.id}
                    onSelect={() => {
                      if (field.onChange) {
                        field.onChange(option.id);
                        setIsPopoverOpen(false);
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.id === field.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
