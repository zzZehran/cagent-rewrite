"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  ReactMutation,
  useMutation,
  usePaginatedQuery,
  useQuery,
} from "convex/react";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Users,
  Pencil,
  Trash2,
  X,
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { downloadTemplate } from "@/lib/utils";
import { CUSTOMERS_TO_FETCH } from "@/constants";

type Group = {
  _id: Id<"groups">;
  name: string;
};

type Customer = {
  _id: Id<"customers">;
  _creationTime: number;
  businessId: Id<"business">;

  name: string;
  email?: string;
  phone: string;

  groups: Group[];

  lastContactedAt?: number;
};

type ParsedRow = {
  name: string;
  email?: string;
  phone: string;
  groupNames: string[];
};

function lastContactedOn(timestamp: number) {
  console.log(timestamp);
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 1) return "Today";
  if (days < 7) return "Last week";
  if (days < 30) return "Last month";
  if (days <= 365) return "Last year";
  if (days > 365) return "Over a year ago";
  // return date.toLocaleDateString();
}

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(50, "Use a valid name."),
  email: z.email().optional(),
  phone: z
    .string()
    .min(1, "Phone is required.")
    .max(15, "Use valid phone number"),
  groupIds: z.array(z.custom<Id<"groups">>()).optional(),
});
type CustomerFormData = z.infer<typeof customerFormSchema>;

export function CustomerModal({
  allGroups,
  businessId,
  createCustomer,
  editing,
  editCustomer,
  customer,
}: {
  allGroups: Group[];
  businessId: Id<"business">;
  createCustomer?: ReactMutation<typeof api.customers.createCustomer>;
  editCustomer?: ReactMutation<typeof api.customers.updateCustomer>;
  editing: Boolean;
  customer?: Customer;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  // const [selectedGroups, setSelectedGroups] = useState<Id<"groups">[]>(
  //   customer?.groups.map((g) => g._id) ?? [],
  // );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    mode: "onChange",
    defaultValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        groupIds: customer.groups.map((g) => g._id),
      });
    }
  }, [customer, reset]);

  async function onSubmit(data: CustomerFormData) {
    try {
      if (createCustomer) {
        const customerId = await createCustomer({ ...data, businessId });
        if (customerId) {
          reset();
          setModalOpen(false);
          console.log("Customer addedd successfully:", customerId);
          toast.success("Customer added successfully");
        }
      } else if (customer && editCustomer) {
        await editCustomer({ ...data, customerId: customer._id });
        reset();
        setModalOpen(false);
        toast.success("Customer edited successfully.");
      }
    } catch (e) {
      console.log("Error in onSubmit:", e);
      toast.error("Error occured. Please try again.");
    }
  }

  return (
    <Dialog
      open={modalOpen}
      onOpenChange={() => {
        reset();
        setModalOpen(!modalOpen);
      }}
    >
      <DialogTrigger asChild>
        {editing ? (
          <Button
            className="hover:cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 bg-white hover:bg-white hover:shadow-sm transition"
            title="Edit Customer"
          >
            <Pencil size={14} />
          </Button>
        ) : (
          <Button
            type="button"
            className="hover:cursor-pointer flex items-center gap-2 px-4 py-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
          >
            + Add Customer
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className="
      w-full max-w-md
      rounded-3xl
      border-0
      bg-white
      p-7
      shadow-2xl
      sm:max-w-md
    "
      >
        <DialogHeader className="mb-6 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {editing ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Name <span className="text-red-400">*</span>
            </label>

            <Input
              {...register("name")}
              placeholder="Full name"
              autoFocus
              className={`
            h-auto rounded-xl border px-4 py-2.5 text-sm
            text-gray-800 placeholder:text-gray-400
            focus-visible:ring-2
            ${
              errors.name
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus-visible:ring-indigo-400"
            }
          `}
            />

            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email <span className="text-red-400">*</span>
            </label>

            <Input
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              className={`
            h-auto rounded-xl border px-4 py-2.5 text-sm
            text-gray-800 placeholder:text-gray-400
            focus-visible:ring-2
            ${
              errors.email
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus-visible:ring-indigo-400"
            }
          `}
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Phone <span className="text-red-400">*</span>
            </label>

            <Input
              {...register("phone")}
              type="tel"
              placeholder="+91 1234567890"
              className={`
            h-auto rounded-xl border px-4 py-2.5 text-sm
            text-gray-800 placeholder:text-gray-400
            focus-visible:ring-2
            ${
              errors.phone
                ? "border-red-400 focus-visible:ring-red-400"
                : "border-gray-200 focus-visible:ring-indigo-400"
            }
          `}
            />

            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Groups */}
          {allGroups.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Groups
              </label>

              <Controller
                name="groupIds"
                control={control}
                render={({ field }) => (
                  <ToggleGroup
                    type="multiple"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap justify-start gap-2"
                  >
                    {allGroups.map((g) => (
                      <ToggleGroupItem
                        key={g._id}
                        value={g._id}
                        className="
                      rounded-full border border-gray-200
                      bg-white px-3 py-1
                      text-xs font-medium text-gray-600
                      transition
                      hover:border-indigo-300
                      hover:bg-white
                      data-[state=on]:border-indigo-600
                      data-[state=on]:bg-indigo-600
                      data-[state=on]:text-white
                    "
                      >
                        {g.name}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                )}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="
              flex-1 rounded-xl border-gray-200
              py-5 text-sm font-semibold text-gray-600
              hover:bg-gray-50
            "
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              disabled={!isValid}
              className="
            flex-1 rounded-xl
            bg-indigo-600 py-5
            text-sm font-semibold text-white
            hover:bg-indigo-700
            disabled:opacity-40
          "
            >
              {editing ? "Update Customer" : "Add Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (rows: ParsedRow[]) => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const parseFile = (file: File) => {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        const result: ParsedRow[] = [];
        let skipped = 0;

        for (const r of rows) {
          const rawName = (
            r["Name"] ||
            r["name"] ||
            r["Full Name"] ||
            ""
          ).trim();
          if (!rawName) continue; // Skip completely empty names

          const rawEmail = (r["Email"] || r["email"] || "").trim();
          const rawPhone = (r["Phone"] || r["phone"] || r["Phone Number"] || "")
            .toString()
            .trim();
          const groupStr = (
            r["Groups"] ||
            r["groups"] ||
            r["Group"] ||
            r["group"] ||
            ""
          ).trim();
          const groupNames = groupStr
            ? groupStr
                .split(",")
                .map((g) => g.trim())
                .filter(Boolean)
            : [];

          const validation = customerFormSchema.safeParse({
            name: rawName,
            email: rawEmail,
            phone: rawPhone,
          });

          if (validation.success) {
            result.push({
              name: validation.data.name,
              email: validation.data.email,
              phone: validation.data.phone,
              groupNames,
            });
          } else {
            skipped++;
          }
        }
        if (result.length === 0) {
          setParseError(
            "No valid rows found. Make sure the sheet has valid data (e.g., correct email/phone formats).",
          );
          return;
        }

        if (skipped > 0) {
          setParseError(
            `Successfully parsed ${result.length} rows, but skipped ${skipped} row(s) due to invalid formatting.`,
          );
        }

        setParsed(result);
        setFileName(file.name);
      } catch {
        setParseError(
          "Failed to parse file. Please upload a valid .xlsx or .csv file.",
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, []);

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onImport(parsed);
      onClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Import from Excel / CSV
          </h2>
          <Button
            variant={"outline"}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all mb-4
            ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) parseFile(f);
            }}
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <FileSpreadsheet className="text-indigo-500" size={24} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-700 text-sm">
              {fileName ?? "Drop your file here or click to browse"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports .xlsx, .xls, .csv
            </p>
          </div>
          {fileName && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setParsed([]);
                setFileName(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Template download */}
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700 mb-4 transition"
        >
          <Download size={13} /> Download template
        </button>

        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={15} /> {parseError}
          </div>
        )}

        {/* Preview */}
        {parsed.length > 0 && (
          <div className="rounded-xl border border-gray-100 overflow-hidden mb-5">
            <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-600">
                {parsed.length} customers ready to import
              </span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
              {parsed.slice(0, 50).map((c, i) => (
                <div
                  key={i}
                  className="px-4 py-2 flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-gray-400 text-xs">
                      {c.email ?? c.phone ?? "—"}
                    </p>
                  </div>
                  {c.groupNames.length > 0 && (
                    <div className="flex gap-1 flex-wrap justify-end max-w-40">
                      {c.groupNames.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {parsed.length > 50 && (
                <div className="px-4 py-2 text-center text-xs text-gray-400">
                  …and {parsed.length - 50} more
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={parsed.length === 0 || importing}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-40 text-sm flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Importing…
              </>
            ) : (
              <>
                <Upload size={14} /> Import{" "}
                {parsed.length > 0 ? parsed.length : ""} customers
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [showExcelImport, setShowExcelImport] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );
  const allGroups = useQuery(
    api.groups.listByBusiness,
    business ? { businessId: business._id } : "skip",
  );

  const searchedCustomers = useQuery(
    api.customers.getSearchedCustomers,
    debouncedSearch && business
      ? { customerName: debouncedSearch, businessId: business._id }
      : "skip",
  );
  const editCustomer = useMutation(api.customers.updateCustomer);

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.customers.getPaginatedCustomersByBusiness,
    business ? { businessId: business._id } : "skip",
    { initialNumItems: CUSTOMERS_TO_FETCH },
  );

  const isLoadingFirst = status === "LoadingFirstPage";
  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const createCustomer = useMutation(api.customers.createCustomer);
  const bulkCreateCustomers = useMutation(api.customers.bulkCreateCustomers);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    if (business === null) router.push("/onboarding");
  }, [business, router]);

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
    <div className="min-h-full">
      {/* Sticky Header */}
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={16} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Customers</h1>
          </div>

          {/* Add single customer modal */}
          <CustomerModal
            editing={false}
            businessId={business._id}
            allGroups={allGroups ?? []}
            createCustomer={createCustomer}
          />

          <Button
            onClick={() => setShowExcelImport(true)}
            className="hover:cursor-pointer flex items-center gap-2 px-4 py-4 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm"
          >
            <FileSpreadsheet size={16} />
            Import Excel
          </Button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-2 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded customers by name, email or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400 text-sm shadow-sm"
          />
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-5">
          {isLoadingFirst && (
            <div className="col-span-2 flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}

          {searchedCustomers ? (
            <>
              {searchedCustomers.map((customer, idx) => (
                <div
                  key={customer._id}
                  className="col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                >
                  {/* Name */}
                  <div className="flex items-center gap-4 w-full md:w-1/3 min-w-0 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-inner">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex flex-col items-start gap-1">
                      <p className="font-semibold text-gray-900 truncate text-[15px] leading-tight w-full">
                        {customer.name}
                      </p>
                      {customer.lastContactedAt ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                          {lastContactedOn(customer.lastContactedAt)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                          Never Contacted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-col gap-1.5 w-full md:w-1/4 min-w-0 shrink-0">
                    {customer.email ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                        <Mail size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                        <Mail size={13} className="shrink-0 opacity-50" />
                        <span>No email</span>
                      </div>
                    )}
                    {customer.phone ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span className="truncate">{customer.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                        <Phone size={13} className="shrink-0 opacity-50" />
                        <span>No phone</span>
                      </div>
                    )}
                  </div>

                  {/* Groups */}
                  <div className="flex gap-1.5 flex-wrap flex-1">
                    {customer.groups.map((g) => (
                      <span
                        key={g._id}
                        className="px-2 py-1 rounded-lg bg-indigo-50/50 text-indigo-700 text-[11px] font-medium border border-indigo-100/50"
                      >
                        {g.name}
                      </span>
                    ))}
                    {customer.groups.length === 0 && (
                      <span className="text-[13px] text-gray-400 italic">
                        No groups
                      </span>
                    )}
                  </div>

                  {/* Edit/Delete Buttons */}
                  <div className="flex items-center shrink-0 bg-gray-50/80 rounded-xl p-0.5 border border-gray-100 md:ml-auto self-end md:self-auto mt-2 md:mt-0">
                    <CustomerModal
                      editing={true}
                      businessId={business._id}
                      allGroups={allGroups ?? []}
                      editCustomer={editCustomer}
                      customer={customer}
                    />
                    <button
                      // onClick={() => setDeletingCustomer(customer)}
                      className="hover:cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm transition"
                      title="Delete Customer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {results ? (
                <>
                  {results.map((customer, idx) => (
                    <div
                      key={customer._id}
                      className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
                    >
                      <div className="flex items-center gap-4 w-full md:w-1/3 min-w-0 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-inner">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex flex-col items-start gap-1">
                          <p className="font-semibold text-gray-900 truncate text-[15px] leading-tight w-full">
                            {customer.name}
                          </p>
                          {customer.lastContactedAt ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                              {lastContactedOn(customer.lastContactedAt)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                              Never Contacted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 w-full md:w-1/4 min-w-0 shrink-0">
                        {customer.email ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                            <Mail
                              size={13}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                            <Mail size={13} className="shrink-0 opacity-50" />
                            <span>No email</span>
                          </div>
                        )}
                        {customer.phone ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 truncate">
                            <Phone
                              size={13}
                              className="text-gray-400 shrink-0"
                            />
                            <span className="truncate">{customer.phone}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-400 italic">
                            <Phone size={13} className="shrink-0 opacity-50" />
                            <span>No phone</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 flex-wrap flex-1">
                        {customer.groups.map((g) => (
                          <span
                            key={g._id}
                            className="px-2 py-1 rounded-lg bg-indigo-50/50 text-indigo-700 text-[11px] font-medium border border-indigo-100/50"
                          >
                            {g.name}
                          </span>
                        ))}
                        {customer.groups.length === 0 && (
                          <span className="text-[13px] text-gray-400 italic">
                            No groups
                          </span>
                        )}
                      </div>

                      <div className="flex items-center shrink-0 bg-gray-50/80 rounded-xl p-0.5 border border-gray-100 md:ml-auto self-end md:self-auto mt-2 md:mt-0">
                        <CustomerModal
                          editing={true}
                          businessId={business._id}
                          allGroups={allGroups ?? []}
                          editCustomer={editCustomer}
                          customer={customer}
                        />
                        <button
                          // onClick={() => setDeletingCustomer(customer)}
                          className="hover:cursor-pointer p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm transition"
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex justify-center items-center flex-col col-span-2 text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users size={28} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    {search
                      ? "No customers match your search."
                      : "No customers yet. Add your first one!"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center my-8">
            <p className="text-gray-600 text-sm">Loading...</p>
          </div>
        )}

        {/* Load More */}
        {canLoadMore && (
          <div className="flex justify-center my-8">
            <Button
              onClick={() => loadMore(CUSTOMERS_TO_FETCH)}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 font-medium text-sm hover:bg-gray-50 transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoadingMore ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ChevronDown size={15} />
              )}
              {isLoadingMore ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}

        {!canLoadMore && !isLoadingMore && (
          <div className="flex justify-center my-8">
            <p className="text-gray-600 text-sm">
              {results.length === 0
                ? "No customer(s) found. Please add customer(s) to see them here."
                : "All customers loaded"}
            </p>
          </div>
        )}
      </div>
      {/* Excel bulk create */}
      {showExcelImport && (
        <ImportModal
          onClose={() => setShowExcelImport(false)}
          onImport={async (rows) => {
            if (!business) return;
            try {
              await bulkCreateCustomers({
                businessId: business._id,
                customers: rows,
              });
              toast.success(
                `${rows.length} customer${rows.length !== 1 ? "s" : ""} imported successfully.`,
              );
            } catch {
              toast.error("Import failed. Please try again.");
            }
          }}
        />
      )}
    </div>
  );
}
