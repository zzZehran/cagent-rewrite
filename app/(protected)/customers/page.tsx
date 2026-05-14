"use client";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { ReactMutation, useMutation, useQuery } from "convex/react";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import * as XLSX from "xlsx";
import { downloadTemplate } from "@/lib/utils";

type Group = {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  businessId: Id<"business">;
};

type ParsedRow = {
  name: string;
  email?: string;
  phone: string;
  groupNames: string[];
};

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().optional(),
  phone: z.string().min(1, "Phone is required."),
  groupIds: z.array(z.custom<Id<"groups">>()).optional(),
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
    reset,
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

  async function onSubmit(data: CustomerFormData) {
    try {
      const customerId = await createCustomer({ ...data, businessId });
      if (customerId) {
        reset();
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
          className="hover:cursor-pointer flex items-center gap-2 px-4 py-4 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={20} />
          </button>
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

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );
  const groups = useQuery(
    api.groups.listByBusiness,
    business ? { businessId: business._id } : "skip",
  );
  const createCustomer = useMutation(api.customers.createCustomer);
  const bulkCreateCustomers = useMutation(api.customers.bulkCreateCustomers);

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
          </div>

          {/* Add single customer modal */}
          <CustomerModal
            businessId={business._id}
            groups={groups ?? []}
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
