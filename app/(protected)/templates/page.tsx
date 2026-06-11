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
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "react-toastify";
import { ConvexError } from "convex/values";

const templateSchema = z.object({
  localName: z.string().min(1, "Local name is required."),
  display_name: z.string().min(1, "Display name is required."),
  category: z.enum(["Utility", "Marketing"]),
  header_format: z.enum(["NONE", "TEXT", "IMAGE"]),
  header: z.string(),
  header_text: z.string().optional(), //variable value inside the header, comma separated
  body: z.string().min(1, "Template body is required"),
  body_text: z.string().optional(), //variable value inside the body, comma separated
  footer: z.string().optional(),
});

type TemplateType = z.infer<typeof templateSchema>;

function RegisterTemplate({ businessId }: { businessId: Id<"business"> }) {
  const registerTemplate = useAction(api.templates.registerTemplate);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
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
    } catch (e: any) {
      if (e instanceof ConvexError) {
        toast.error(`Error: ${e.data}`);
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  return (
    <Dialog>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
          {/* whatsapp preview block */}
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
                  <p className="font-bold">{watch("header")}</p>
                  <p className="text-sm flex whitespace-pre-wrap break-all">
                    {watch("body")}
                  </p>

                  <p className="text-xs text-gray-400">{watch("footer")}</p>

                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    10:42 AM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function page() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );

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
            <RegisterTemplate businessId={business._id} />
          </div>
        </div>
      </div>
    </div>
  );
}
