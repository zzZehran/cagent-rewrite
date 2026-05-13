"use client";

import { useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Tag,
  Users,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type ParsedCustomer = {
  name: string;
  email: string;
  phone: string;
  groups: string[];
};

const businessSchema = z.object({
  businessName: z.string().trim().min(3, "Business Name is too short."),
  businessDescription: z.string().trim().optional(),
});
type BusinessFormData = z.infer<typeof businessSchema>;

const customerRowSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Invalid email").trim(),
  phone: z.string().trim().min(5, "Phone too short").max(20, "Phone too long"),
});

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: "Business Details", icon: Building2 },
    { label: "Import Customers", icon: Users },
    { label: "Review & Submit", icon: Tag },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const activeStep = i === currentStep;
        const onboardingDone = i < currentStep;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-sm
                  ${onboardingDone ? "bg-emerald-500 text-white" : activeStep ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-gray-100 text-gray-400"}`}
              >
                {onboardingDone ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium whitespace-nowrap transition-colors
                  ${activeStep ? "text-indigo-600" : onboardingDone ? "text-emerald-500" : "text-gray-400"}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 mx-2 mb-5 rounded transition-colors duration-300
                  ${onboardingDone ? "bg-emerald-400" : "bg-gray-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function downloadTemplate() {
  const templateData = [
    {
      Name: "John Doe",
      Email: "john@example.com",
      Phone: "1234567890",
      Groups: "Group A",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "Customer_Import_Template.xlsx");
}

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [customers, setCustomers] = useState<ParsedCustomer[]>([]);
  const [dragging, setDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: register,
    handleSubmit: handleBusinessSubmit,
    getValues: getBusinessValues,
    formState: { errors: businessErrors, isValid: isBusinessValid },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: { businessName: "", businessDescription: "" },
    mode: "onChange",
  });

  // Customer Import
  const dropRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const registerBusiness = useMutation(api.business.registerBusiness)

  // File parsing
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

        const parsed: ParsedCustomer[] = rows
          .filter((row) => {
            const name =
              row["Name"] ||
              row["name"] ||
              row["Full Name"] ||
              row["full name"];
            return Boolean(name?.trim());
          })
          .map((row) => {
            const name = (
              row["Name"] ||
              row["name"] ||
              row["Full Name"] ||
              row["full name"] ||
              ""
            ).trim();
            const email = (
              row["Email"] ||
              row["email"] ||
              row["Email Address"] ||
              ""
            ).trim();
            const phone = (
              row["Phone"] ||
              row["phone"] ||
              row["Phone Number"] ||
              row["phone number"] ||
              ""
            )
              .toString()
              .trim();
            const groupStr: string = (
              row["Groups"] ||
              row["groups"] ||
              row["Group"] ||
              row["group"] ||
              ""
            ).trim();
            const groups = groupStr
              ? groupStr
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
              : [];

            const validation = customerRowSchema.safeParse({
              name,
              email,
              phone,
            });
            if (!validation.success) return null;

            return {
              name: validation.data.name,
              email: validation.data.email,
              phone: validation.data.phone,
              groups,
            } satisfies ParsedCustomer;
          })
          .filter((c): c is ParsedCustomer => c !== null);

        const validCount = parsed.length;
        const totalRows = rows.filter((row) => {
          const name =
            row["Name"] || row["name"] || row["Full Name"] || row["full name"];
          return Boolean(name?.trim());
        }).length;
        const skipped = totalRows - validCount;

        if (validCount === 0) {
          setParseError(
            "No valid customers found. Make sure rows have Name, a valid Email, and Phone (5-20 chars).",
          );
          return;
        }

        if (skipped > 0) {
          setParseError(
            `Parsed ${validCount} valid rows. Skipped ${skipped} row(s) with missing/invalid email or phone.`,
          );
        }

        setCustomers(parsed);
        setFileName(file.name);
      } catch (e: any) {
        console.log("Error: ", e);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // Derived groups (collected from Excel Groups column), also removed boolean values
  const allGroups = Array.from(
    new Set(customers.flatMap((c) => c.groups)),
  ).filter(Boolean);

  const handleSubmit = async () => {
    if (!user) return;
    const businessData = getBusinessValues();
    setSubmitting(true);
    setError(null);
    try {
      await registerBusiness({
        ownerId: user.id,
        businessName: businessData.businessName,
        businessDescription: businessData.businessDescription || undefined,
        groups: allGroups,
        customers,
      });
      toast.success("Business registered successfully");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black shadow-xl shadow-indigo-200 mb-4">
            <Building2 className="text-white" size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Register Your Business
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Set up your workspace in a few quick steps.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <StepIndicator currentStep={step} />
          {/* STEP 0: Business Details */}
          {step === 0 && (
            <form
              className="space-y-6 animate-fadeIn"
              onSubmit={handleBusinessSubmit(() => setStep(1))}
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  {...register("businessName")}
                  placeholder="e.g. Acme Corp"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    businessErrors.businessName
                      ? "border-red-400 focus:ring-red-400"
                      : "border-gray-200 focus:ring-gray-300"
                  } focus:outline-none focus:ring-2 focus:border-transparent transition text-gray-800 placeholder-gray-400`}
                />
                {businessErrors.businessName && (
                  <p className="text-red-500 text-xs mt-1">
                    {businessErrors.businessName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="businessDescription"
                  {...register("businessDescription")}
                  placeholder="Tell us a bit about your business…"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition text-gray-800 placeholder-gray-400 resize-none"
                />
              </div>
              <button
                id="step0-next"
                type="submit"
                disabled={!isBusinessValid}
                className="w-full py-3 rounded-xl bg-black text-white font-semibold hover:cursor-pointer hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={18} />
              </button>
            </form>
          )}

          {/* STEP 1: Import Customers */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Upload an Excel (.xlsx) or CSV file. Expected columns:{" "}
                  <span className="font-medium text-gray-700">
                    Name, Email, Phone, Groups.
                  </span>
                </p>
                <button
                  onClick={downloadTemplate}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                >
                  <Download size={14} />
                  Download Template
                </button>
              </div>

              {/* Drop zone */}
              <div
                ref={dropRef}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-all
                  ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40"}`}
              >
                <input
                  ref={fileRef}
                  id="excelUpload"
                  type="file"
                  accept=".xlsx,.csv,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <FileSpreadsheet className="text-indigo-500" size={28} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-700">
                    {fileName
                      ? fileName
                      : "Drop your file here or click to browse"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports .xlsx, .xls, .csv
                  </p>
                </div>
                {fileName && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomers([]);
                      setFileName(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {parseError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle size={16} />
                  {parseError}
                </div>
              )}

              {/* Preview */}
              {customers.length > 0 && (
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600">
                      {customers.length} customers found
                    </span>
                    <span className="text-xs text-gray-400">
                      {allGroups.length} group
                      {allGroups.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
                    {customers.slice(0, 50).map((c, i) => (
                      <div
                        key={i}
                        className="px-4 py-2.5 flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          <p className="text-gray-400 text-xs">
                            {c.email || c.phone || "—"}
                          </p>
                        </div>
                        {c.groups.length > 0 && (
                          <div className="flex gap-1 flex-wrap justify-end max-w-45">
                            {c.groups.map((g) => (
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
                    {customers.length > 50 && (
                      <div className="px-4 py-2 text-center text-xs text-gray-400">
                        …and {customers.length - 50} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  id="step1-back"
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  id="step1-next"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-black text-white font-semibold hover:cursor-pointer hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  {customers.length > 0 ? "Continue" : "Skip for now"}{" "}
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Business summary */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-3">
                  <Building2 size={16} /> Business Details
                </div>
                <p className="text-gray-800 font-bold text-lg">
                  {getBusinessValues("businessName")}
                </p>
                {getBusinessValues("businessDescription") && (
                  <p className="text-gray-500 text-sm">
                    {getBusinessValues("businessDescription")}
                  </p>
                )}
              </div>

              {/* Customers summary */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-3">
                  <Users size={16} /> Customers
                </div>
                {customers.length > 0 ? (
                  <p className="text-gray-700 text-sm">
                    <span className="font-bold text-gray-900">
                      {customers.length}
                    </span>{" "}
                    customers ready to be imported.
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No customers uploaded — you can add them later.
                  </p>
                )}
              </div>

              {/* Groups summary */}
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-3">
                  <Tag size={16} /> Customer Groups
                </div>
                {allGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allGroups.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No groups defined — groups are auto-detected from the Excel
                    file.
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  id="step2-back"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  id="step2-submit"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-linear-to-r bg-black text-white font-semibold hover:cursor-pointer hover:bg-gray-800 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Register Business
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Logged in as{" "}
          <span className="font-medium text-gray-600">
            {user?.primaryEmailAddress?.emailAddress}
          </span>
        </p>
      </div>
    </div>
  );
}
