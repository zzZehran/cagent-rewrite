import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from "xlsx"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet([
    { Name: "[Name]", Email: "[Email]", Phone: "[Phone]", Groups: "[Group1]" },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, "Customer_Import_Template.xlsx");
}