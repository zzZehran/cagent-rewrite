"use client";

import { MessageSquare, Plus, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import z from "zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "react-toastify";
import { ConvexError } from "convex/values";

const templateSchema = z.object({
  localName: z.string().min(1, "Local name is required."),
  display_name: z.string().min(1, "Display name is required."),
  category: z.enum(["Utility", "Marketing"]),
  header_format: z.enum(["NONE", "TEXT", "IMAGE"]),
  header: z.string().optional(),
  header_text: z.string().optional(), //variable value inside the header, comma separated
  body: z.string().min(1, "Template body is required"),
  body_text: z.string().optional(), //variable value inside the body, comma separated
  footer: z.string().optional(),
});

type TemplateType = z.infer<typeof templateSchema>;

function WhatsappPreview({
  header,
  body,
  footer,
}: {
  header?: string;
  body: string;
  footer?: string;
}) {
  return (
    <div className="flex justify-center p-5">
      <div className="h-[82vh] w-80 overflow-hidden rounded-[28px] border-4 border-zinc-800 bg-[#e5ddd5] shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
          <div className="h-10 w-10 rounded-full bg-zinc-200" />

          <div>
            <p className="text-sm font-medium">Your Business</p>
            <p className="text-xs opacity-80">online</p>
          </div>
        </div>

        {/* Chat */}
        <div className="flex h-full flex-col gap-3 p-4">
          {/* Message */}
          <div className="max-w-[95%] h-auto rounded-lg rounded-tl-none bg-white p-3 shadow-sm">
            <p className="font-bold">{header}</p>
            <p className="text-sm flex whitespace-pre-wrap break-all">{body}</p>

            <p className="text-xs text-gray-400">{footer}</p>

            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              10:42 AM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterTemplate({
  businessId,
  showTemplateForm,
  setShowTemplateForm,
}: {
  businessId: Id<"business">;
  showTemplateForm: boolean;
  setShowTemplateForm: (value: boolean) => void;
}) {
  const registerTemplate = useAction(api.templates.registerTemplate);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TemplateType>({
    resolver: zodResolver(templateSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<TemplateType> = async (data) => {
    try {
      const res = await registerTemplate({
        ...data,
        businessId: businessId,
        body_text: data.body_text ? [data.body_text] : [],
        header_text: data.header_text ? [data.header_text] : [],
      });
      toast.success("Template created successfully.");
      setShowTemplateForm(false);
      reset();
    } catch (e: any) {
      if (e instanceof ConvexError) {
        toast.error(`Error: ${e.data}`);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="
            flex
            text-white text-sm font-semibold
            bg-emerald-600
            rounded-xl
            shadow-sm shadow-emerald-200
            items-center gap-2 hover:bg-emerald-700 hover:text-white transition
          "
        >
          <Plus size={16} />
          Open Dialog
        </Button>
      </DialogTrigger>
      <DialogContent
        className="
          sm:max-w-5xl
          p-8
          "
      >
        <div className="grid grid-cols-2 gap-6">
          <form
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <DialogHeader>
              <DialogTitle>Register new template</DialogTitle>
            </DialogHeader>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="localName">Local Name</Label>
                <Input {...register("localName")} id="localName" />
                {errors.localName && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.localName.message}
                  </p>
                )}
              </Field>

              <Field>
                <Label htmlFor="interaktCodeName">Interakt Code Name</Label>
                <Input {...register("display_name")} id="interaktCodeName" />
                {errors.display_name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.display_name.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field>
                <Label>Category</Label>

                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Categories</SelectLabel>
                          <SelectItem value="Utility">Utility</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.category && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.category.message}
                  </p>
                )}
              </Field>

              <Field>
                <Label>Template Type</Label>

                <Controller
                  name="header_format"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Template Type" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Types</SelectLabel>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="TEXT">Text</SelectItem>
                          <SelectItem value="IMAGE">Image</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.header_format && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.header_format.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            {watch("header_format") === "TEXT" && (
              <>
                <Field>
                  <Label htmlFor="header">Header Text</Label>
                  <Input {...register("header")} id="header" />

                  {errors.header && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.header.message}
                    </p>
                  )}
                </Field>

                <Field>
                  <Label htmlFor="header_text">
                    Header Variable names (comma separated)
                  </Label>

                  <Input
                    {...register("header_text")}
                    id="header_text"
                    placeholder="e.g. customer_name, company_name"
                  />

                  {errors.header_text && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.header_text.message}
                    </p>
                  )}
                </Field>
              </>
            )}

            <Field>
              <Label htmlFor="body">Body</Label>

              <Textarea
                {...register("body")}
                id="body"
                placeholder="Hi {{1}}, welcome to our platform."
              />

              {errors.body && (
                <p className="text-sm text-destructive mt-1">
                  {errors.body.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="variables">
                Body Variable names (comma separated)
              </Label>

              <Input
                {...register("body_text")}
                id="variables"
                placeholder="e.g. customer_name,discount_code"
              />

              {errors.body_text && (
                <p className="text-sm text-destructive mt-1">
                  {errors.body_text.message}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="footer">Footer</Label>

              <Input
                {...register("footer")}
                id="footer"
                placeholder="Thank you!"
              />

              {errors.footer && (
                <p className="text-sm text-destructive mt-1">
                  {errors.footer.message}
                </p>
              )}
            </Field>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
          {/* whatsapp preview block */}
          <WhatsappPreview
            header={watch("header")}
            body={watch("body")}
            footer={watch("footer")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function page() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showPreviewTemplate, setShowPreviewTemplate] = useState(false);
  const [previewHeader, setPreviewHeader] = useState<string | undefined>("");
  const [previewBody, setPreviewBody] = useState("");
  const [previewFooter, setPreviewFooter] = useState<string | undefined>("");

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );

  const allTemplates = useQuery(
    api.templates.getTemplatesByBusinessId,
    business ? { businessId: business._id } : "skip",
  );

  useEffect(() => {
    if (business === null) router.push("/onboarding");
  }, [business]);

  if (!isLoaded || business === undefined) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div
          className="
      w-8 h-8 rounded-full border-4 border-indigo-600 border-t-indigo-300 
      animate-spin"
        ></div>
      </div>
    );
  }
  if (business === null) return null;

  return (
    <div
      className="
        min-h-full

            max-w-5xl
            mx-auto px-6 py-4
            items-center gap-4
      "
    >
      <div
        className="
          z-10
          bg-white/80
          border-b border-gray-100
          backdrop-blur-md sticky top-0
        "
      >
        {/* Header */}
        <div
          className="
            flex
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
              <MessageSquare size={16} />
            </div>
            <h1
              className="
                text-lg font-bold text-gray-900
              "
            >
              WhatsApp Templates
            </h1>
            {/* {templates && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                {templates.length}
              </span>
            )} */}
          </div>
          <div
            className="
              flex
              items-center gap-3
            "
          >
            <Button
              className="
                flex
                px-4
                text-gray-700 text-sm font-semibold
                bg-white
                rounded-xl border border-gray-200
                shadow-sm
                items-center gap-2 hover:bg-gray-50 transition disabled:opacity-50
              "
            >
              <RefreshCw
                size={16}
                // className={isRefreshingAll ? "animate-spin" : ""}
              />
              Refresh All
            </Button>

            {/* Add new template button */}
            <RegisterTemplate
              businessId={business._id}
              showTemplateForm={showTemplateForm}
              setShowTemplateForm={setShowTemplateForm}
            />
          </div>
        </div>

        {/*Templates  */}
        <div className="grid grid-cols-3 gap-2">
          {allTemplates &&
            allTemplates.map((template) => {
              return (
                <div
                  onClick={() => {
                    setShowPreviewTemplate(true);
                    setPreviewHeader(template.header);
                    setPreviewBody(template.body);
                    setPreviewFooter(template.footer);
                  }}
                  key={template._id}
                  className="hover:cursor-pointer mt-8 col-span-1 relative h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-emerald-100 hover:shadow-md transition-all flex flex-col gap-4"
                >
                  {/* Status Badge */}
                  {template.status && (
                    <div className="absolute top-4 right-4 z-10">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          template.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : template.status === "Rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {template.status}
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="flex items-start justify-between shrink-0">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-linear-to-br flex items-center justify-center text-white font-bold text-lg shrink-0`}
                    >
                      {template.localName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col">
                    <p className="text-lg font-semibold text-gray-900 pr-20 line-clamp-2">
                      {template.localName}
                    </p>

                    <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                      {template.display_name}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                      {template.body_text?.map((v) => (
                        <span
                          key={v}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium"
                        >
                          {v}
                        </span>
                      ))}

                      {template.body_text?.length === 0 && (
                        <span className="text-xs text-gray-400 italic">
                          No variables
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-2">
                      {template.status === "Approved" ? (
                        <button
                          // onClick={() => setViewTemplateId(template._id)}
                          className="hover:cursor-pointer w-full py-2 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-xl hover:bg-emerald-100 transition"
                        >
                          Overview Template
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2 bg-amber-50 text-amber-700 font-semibold text-xs rounded-xl transition opacity-80"
                        >
                          <i>Waiting for approval</i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Template Quickview */}
        <Dialog
          open={showPreviewTemplate}
          onOpenChange={setShowPreviewTemplate}
        >
          <DialogContent>
            <DialogTitle></DialogTitle>
            <WhatsappPreview
              header={previewHeader}
              body={previewBody}
              footer={previewFooter}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
