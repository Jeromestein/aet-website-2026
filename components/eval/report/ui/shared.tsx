/**
 * Typography & Layout Primitives
 *
 * Reusable layout components for consistent styling across the report:
 * - SectionTitle: Section headings (e.g., "2. Documents")
 * - ReportTitle: Main report title with decorative underline
 * - InfoRow: Label-value pairs for applicant info
 * - SummaryRow: Label-value pairs for summary section
 * - DetailRow: Table row for credential details
 * - DocumentFieldRow: Grid layout for document fields
 */

import { ReactNode } from "react";
import { FieldLabel } from "./editable-elements";

export type SectionTitleProps = {
  children: ReactNode;
};

export const SectionTitle = ({ children }: SectionTitleProps) => (
  <h2 className="font-sans font-bold text-blue-900 uppercase text-[15px] border-b border-gray-200 mb-2 pb-1 mt-4">
    {children}
  </h2>
);

export const ReportTitle = ({ children }: { children: ReactNode }) => (
  <h1 className="text-center text-xl font-bold uppercase underline decoration-double decoration-1 underline-offset-4 text-blue-900 mb-6 mt-3 font-serif">
    {children}
  </h1>
);

export type InfoRowProps = {
  label: string;
  children: ReactNode;
  labelClassName?: string;
};

export const InfoRow = ({
  label,
  children,
  labelClassName = "",
}: InfoRowProps) => (
  <div className="flex items-start gap-2">
    <span
      className={`text-gray-600 font-bold w-32 shrink-0 pt-1 ${labelClassName}`}
    >
      {label}:
    </span>
    <div className="flex-1 min-w-0">
      <FieldLabel.Provider value={label}>{children}</FieldLabel.Provider>
    </div>
  </div>
);

export type SummaryRowProps = {
  label: string;
  children: ReactNode;
  labelClassName?: string;
};

export const SummaryRow = ({
  label,
  children,
  labelClassName = "",
}: SummaryRowProps) => (
  <div className="flex items-start gap-2">
    <span
      className={`text-gray-600 font-medium w-32 shrink-0 pt-1 ${labelClassName}`}
    >
      {label}:
    </span>
    <div className="flex-1 min-w-0">
      <FieldLabel.Provider value={label}>{children}</FieldLabel.Provider>
    </div>
  </div>
);

export type DetailRowProps = {
  label: string;
  children: ReactNode;
};

export const DetailRow = ({ label, children }: DetailRowProps) => (
  <tr>
    <td className="py-1 pr-2 align-top font-semibold text-gray-600 w-[18rem] border-b border-gray-200">
      {label}:
    </td>
    <td className="py-1 align-top border-b border-gray-200">
      <FieldLabel.Provider value={label}>{children}</FieldLabel.Provider>
    </td>
  </tr>
);

export type DocumentFieldRowProps = {
  label: string;
  children: ReactNode;
};

export const DocumentFieldRow = ({
  label,
  children,
}: DocumentFieldRowProps) => (
  <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
    <span className="font-semibold text-gray-600">{label}:</span>
    <div className="min-w-0">
      <FieldLabel.Provider value={label}>{children}</FieldLabel.Provider>
    </div>
  </div>
);
