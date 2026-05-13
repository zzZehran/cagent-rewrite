"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { ReactMutation, useMutation, useQuery } from "convex/react";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  Mail,
  Phone,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Id } from "@/convex/_generated/dataModel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

type Group = {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  businessId: Id<"business">;
};

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().optional(),
  phone: z.string().min(1, "Phone is required."),
  groupIds: z
    .array(z.custom<Id<"groups">>())
    .min(1, "Select atleast one group."),
});
type CustomerFormData = z.infer<typeof customerFormSchema>;

export function CustomerModal({
  groups,
  businessId,
  createCustomer,
}: {
  groups: Group[];
  businessId: Id<"business">;
  createCustomer: ReactMutation<typeof api.customers.createCustomer>;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      groupIds: [],
    },
  });

  // console.log(watch("groups"));

  async function onSubmit(data: CustomerFormData) {
    try {
      const customerId = await createCustomer({ ...data, businessId });
      if (customerId) {
        setModalOpen(false);
        console.log("Customer addedd successfully:", customerId);
        toast.success("Customer added successfully");
      }
    } catch (e) {
      console.log("Error in onSubmit:", e);
      toast.error("Failed to add customer.");
    }
  }
  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
        >
          + Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
              <Input
                {...register("name")}
                id="fullName"
                placeholder="John Doe"
                required
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                id="email"
                placeholder="example@email.com"
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">Phone</FieldLabel>
              <Input
                {...register("phone")}
                id="phone"
                placeholder="+91-1234567890"
                required
              />
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="phone">Groups</FieldLabel>

              <Controller
                name="groupIds"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    type="multiple"
                    spacing={2}
                    className="flex flex-wrap"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    {groups.map((el, idx) => (
                      <ToggleGroupItem
                        key={idx}
                        value={el._id}
                        aria-label="Light"
                        className="flex flex-col items-center justify-center rounded-xl
                      border border-gray-200 px-2 py-1 text-xs transition-colors
                      hover:bg-gray-100
                      data-[state=on]:bg-indigo-600
                      data-[state=on]:text-white
                      data-[state=on]:border-indigo-600 hover:cursor-pointer"
                      >
                        {el.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={() => console.log("pressed")} type="submit">
              Add customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomersPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );
  const groups = useQuery(
    api.groups.listByBusiness,
    business ? { businessId: business._id } : "skip",
  );
  const createCustomer = useMutation(api.customers.createCustomer);

  useEffect(() => {
    if (business === null) router.push("/onboarding");
  }, [business, router]);

  if (business === undefined) return null;
  if (business === null) return null;

  return (
    <div className="min-h-full">
      {/* Sticky Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Customers</h1>
            {/* {results.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                {results.length}
                {canLoadMore ? "+" : ""}
              </span>
            )} */}
          </div>
          {/* <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
          >
            <Plus size={16} />
            Add Customer
          </button> */}
          <CustomerModal
            businessId={business._id}
            groups={groups ?? []}
            createCustomer={createCustomer}
          />
          <button
            onClick={() => setShowImport(true)}
            className="hover:cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            <FileSpreadsheet size={16} />
            Import Excel
          </button>
        </div>
      </div>
    </div>
  );
}
