import { EditableInput, EditableTextarea } from "../ui/editable-elements";
import { GradeConversionRow, GradeConversionField } from "../types";

type GradeConversionProps = {
  rows: GradeConversionRow[];
  onUpdate: (
    rowIndex: number,
    field: GradeConversionField,
    value: string,
  ) => void;
  readOnly?: boolean;
};

// AICE 4.35 GPA Scale reference data
const GPA_POINTS_DATA = [
  { usGrade: "A+", points: "4.35" },
  { usGrade: "A", points: "4.00" },
  { usGrade: "A-", points: "3.65" },
  { usGrade: "B+", points: "3.35" },
  { usGrade: "B", points: "3.00" },
  { usGrade: "B-", points: "2.65" },
  { usGrade: "C+", points: "2.35" },
  { usGrade: "C", points: "2.00" },
  { usGrade: "C-", points: "1.65" },
  { usGrade: "D+", points: "1.35" },
  { usGrade: "D", points: "1.00" },
  { usGrade: "D-", points: "0.65" },
  { usGrade: "F/Withdrawal", points: "0.00" },
  { usGrade: "PASS/Credit", points: "N/A" },
];

// GPA Points reference table (right side)
const GpaPointsTable = () => (
  <table className="w-full text-xs text-center border-collapse border border-gray-300">
    <thead className="bg-gray-100 print:bg-gray-50">
      <tr>
        <th className="border border-gray-300 p-1">U.S. Grade</th>
        <th className="border border-gray-300 p-1">GPA Points</th>
      </tr>
    </thead>
    <tbody>
      {GPA_POINTS_DATA.map((row, index) => (
        <tr key={index}>
          <td className="border border-gray-300 p-1">{row.usGrade}</td>
          <td className="border border-gray-300 p-1">{row.points}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const GradeConversion = ({
  rows,
  onUpdate,
  readOnly = false,
}: GradeConversionProps) => (
  <div className="flex gap-4">
    {/* Left: Original Grade Conversion Table */}
    <table className="w-1/2 text-xs text-center border-collapse border border-gray-300">
      <thead className="bg-gray-100 print:bg-gray-50">
        <tr>
          <th className="border border-gray-300 p-1">Original Grade</th>
          <th className="border border-gray-300 p-1">U.S. Grade</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="hover:bg-blue-50">
            <td className="border border-gray-300 p-0 editable-cell">
              <EditableTextarea
                ariaLabel={`Conversion ${index + 1} original grade`}
                value={row.grade}
                onChange={(value) => onUpdate(index, "grade", value)}
                className="text-center leading-snug"
                readOnly={readOnly}
              />
            </td>
            <td className="border border-gray-300 p-0 editable-cell">
              <EditableInput
                ariaLabel={`Conversion ${index + 1} US grade`}
                value={row.usGrade}
                onChange={(value) => onUpdate(index, "usGrade", value)}
                className="text-center h-full"
                readOnly={readOnly}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Right: GPA Points Reference Table */}
    <div className="w-1/2">
      <GpaPointsTable />
    </div>
  </div>
);
