"use client";

import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import {
  Globe,
  LucideIcon,
  Megaphone,
  Send,
  Tags,
  UserCheck,
} from "lucide-react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";
import { toast } from "react-toastify";

type Mode = "Group" | "Individuals" | "All";
const modes: { label: Mode; icon: LucideIcon }[] = [
  { label: "Group", icon: Tags },
  { label: "Individuals", icon: UserCheck },
  { label: "All", icon: Globe },
];

export default function page() {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("Group");
  const [broadCastGroups, setBroadcastGroups] = useState<Id<"groups">[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Id<"whatsappTemplates">>();

  //AI is responsible for this state, I couldn't
  const [selectedValue, setSelectedValue] = useState<
    Record<
      string,
      {
        source: string;
        value: string;
      }
    >
  >({});

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && userId ? { ownerId: userId } : "skip",
  );

  const groups = useQuery(
    api.groups.listByBusiness,
    business ? { businessId: business._id } : "skip",
  );

  const allTemplates = useQuery(
    api.templates.getTemplatesByBusinessId,
    business ? { businessId: business._id } : "skip",
  );

  const sendBroadcast = useAction(api.broadcast.sendBroadcast);

  useEffect(() => {
    if (business === null) router.push("/onboarding");
  }, [business]);

  if (business === undefined) {
    return (
      <div
        className="
          flex
          h-screen
          justify-center items-center
        "
      >
        <div
          className="
            w-8 h-8
            rounded-full border-4 border-indigo-600 border-t-indigo-300
            animate-spin
          "
        ></div>
      </div>
    );
  }
  if (business === null) return null;

  if (groups === undefined) return null;

  const searchOptions = groups.map((el) => {
    return {
      value: el._id,
      label: el.name,
    };
  });

  const templateVariables = allTemplates?.find(
    (el) => el._id === selectedTemplate,
  );

  async function handleBroadcast() {
    console.log("Broadcast groups: ", broadCastGroups);
    console.log("Selected template: ", selectedTemplate);
    console.log("Values", selectedValue);

    try {
      if (!business) return;
      if (selectedTemplate === undefined) return;
      sendBroadcast({
        businessId: business._id,
        broadcastGroupIds: broadCastGroups,
        templateId: selectedTemplate,
      });
    } catch (error) {
      if(error instanceof ConvexError){
        toast.error(`Error: ${error.data}`)
      }else{
        toast.error("Something went wrong")
      }

    }
  }

  return (
    <div
      className="
        min-h-full
      "
    >
      {/* Header */}
      <div
        className="
          z-10
          bg-white/80
          border-b border-gray-100
          backdrop-blur-md sticky top-0
        "
      >
        <div
          className="
            flex
            max-w-5xl
            mx-auto px-6 py-4
            items-center gap-4
          "
        >
          <div
            className="
              flex flex-1
              items-center gap-2
            "
          >
            <div
              className="
                flex
                w-8 h-8
                text-emerald-600
                bg-emerald-50
                rounded-xl
                items-center justify-center
              "
            >
              <Megaphone size={16} />
            </div>
            <h1
              className="
                text-lg font-bold text-gray-900
              "
            >
              Send Broadcast
            </h1>
          </div>
        </div>
      </div>

      <div
        className="
          max-w-4xl
          mx-auto px-6 py-4 mt-5
          border rounded-xl
        "
      >
        <h2
          className="
            font-semibold text-base
          "
        >
          Select Audience
        </h2>

        <div
          className="
            grid grid-cols-3
            mt-3
            gap-x-6
          "
        >
          {modes.map((el, idx) => {
            return (
              <Button
                key={idx}
                variant={"outline"}
                onClick={() => setMode(el.label)}
                className={cn(
                  `px-5 py-7 font-bold `,
                  mode === el.label
                    ? "text-emerald-700 bg-emerald-50 border-emerald-500  hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500"
                    : "",
                )}
              >
                <el.icon size={18} />
                {el.label}
              </Button>
            );
          })}
        </div>

        {/* Groups */}
        {mode === "Group" && (
          <>
            <h2
              className="
                mt-3
                font-semibold text-base
              "
            >
              Select Group
            </h2>
            <MultiSelect
              options={searchOptions}
              onValueChange={(value) =>
                setBroadcastGroups(value as Id<"groups">[])
              }
              className="
                min-h-10
                my-3
                text-sm
                bg-white
                rounded-xl border-gray-200
                shadow-sm
                hover:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-400
              "
            />
          </>
        )}

        {/* Select Templates */}
        <h2
          className="
            mt-3
            font-semibold text-base
          "
        >
          Select Template
        </h2>

        {/* Templates  */}
        <RadioGroup
          value={selectedTemplate}
          onValueChange={(value) =>
            setSelectedTemplate(value as Id<"whatsappTemplates">)
          }
          className="
            grid grid-cols-3
          "
        >
          {allTemplates &&
            allTemplates.map((template) => {
              return (
                <FieldLabel
                  key={template._id}
                  htmlFor={template.localName}
                  className={cn(
                    "col-span-1 rounded-lg border p-4 transition-colors",
                    template.status === "Pending"
                      ? "opacity-60 bg-muted/40 border-muted cursor-not-allowed"
                      : "hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer",
                  )}
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>
                        {template.localName}

                        {template.status === "Pending" && (
                          <span
                            className="
                              px-1 py-0.5
                              text-xs font-medium text-amber-700
                              bg-amber-100
                              rounded-full
                            "
                          >
                            Pending
                          </span>
                        )}
                      </FieldTitle>
                      <FieldDescription>
                        Variables detected in this template.
                      </FieldDescription>

                      <div
                        className="
                          mt-3 space-y-3
                        "
                      >
                        {template.header_text &&
                          template.header_text.length > 0 && (
                            <div>
                              <span
                                className="
                                  block
                                  mb-1
                                  text-xs font-medium text-muted-foreground
                                "
                              >
                                Header Variables
                              </span>

                              <div
                                className="
                                  flex flex-wrap
                                  gap-1
                                "
                              >
                                {template.header_text.map((variable) => (
                                  <span
                                    key={variable}
                                    className="
                                      px-2 py-1
                                      text-xs font-medium text-emerald-700
                                      bg-emerald-50
                                      border border-emerald-200 rounded-md
                                    "
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        {template.body_text &&
                          template.body_text.length > 0 && (
                            <div>
                              <span
                                className="
                                  block
                                  mb-1
                                  text-xs font-medium text-muted-foreground
                                "
                              >
                                Body Variables
                              </span>

                              <div
                                className="
                                  flex flex-wrap
                                  gap-1
                                "
                              >
                                {template.body_text.map((variable) => (
                                  <span
                                    key={variable}
                                    className="
                                      px-2 py-1
                                      text-xs font-medium text-blue-700
                                      bg-blue-50
                                      border border-blue-200 rounded-md
                                    "
                                  >
                                    {variable}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </FieldContent>
                    <RadioGroupItem
                      disabled={template.status === "Pending"}
                      value={template._id}
                      id={template.localName}
                    />
                  </Field>
                </FieldLabel>
              );
            })}
        </RadioGroup>

        {allTemplates && allTemplates.length === 0 && (
          <div
            className="
              flex
              py-16
              col-span-3 justify-center items-center
            "
          >
            <p
              className="
                text-gray-500 text-sm
              "
            >
              No templates found.
            </p>
          </div>
        )}

        {/* Template Variables */}
        {templateVariables &&
          templateVariables.body_text &&
          templateVariables.body_text?.length > 0 && (
            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold">Fill Variables</h2>
                <p className="text-sm text-muted-foreground">
                  Choose what each template variable should be replaced with.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-x-3 space-y-3">
                {templateVariables.body_text.map((el) => (
                  <div
                    key={el}
                    className="rounded-lg border p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Variable
                        </p>
                        <p className="font-medium">{`{{${el}}}`}</p>
                      </div>
                    </div>

                    <Select
                      onValueChange={(value) =>
                        setSelectedValue((prev) => ({
                          ...prev,
                          [el]: {
                            source: value,
                            value: prev[el]?.value ?? "",
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select replacement value" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Values</SelectLabel>

                          <SelectItem value="custom_text">
                            Custom Text
                          </SelectItem>

                          <SelectItem value="customer_name">
                            Customer Name
                          </SelectItem>

                          <SelectItem value="customer_phone">
                            Customer Phone Number
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    {selectedValue[el]?.source === "custom_text" && (
                      <Input
                        onChange={(e) =>
                          setSelectedValue((prev) => ({
                            ...prev,
                            [el]: {
                              source: prev[el]?.source ?? "custom_text",
                              value: e.target.value,
                            },
                          }))
                        }
                        placeholder={`Enter value for ${el}`}
                        required
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        {/* Send broadcast */}
        <Button
          disabled={broadCastGroups.length <= 0 ? true : false}
          onClick={handleBroadcast}
          className="
            w-full
            mt-4 py-7
            text-md
            bg-emerald-500
          "
        >
          <Send size={18} /> Send Broadcast
        </Button>
      </div>
    </div>
  );
}
