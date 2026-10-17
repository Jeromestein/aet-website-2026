import { RefObject, useState } from "react";
import { Trash2, Plus, StickyNote } from "lucide-react";
import CourseNotes from "./course-table-notes";
import { EditableInput, EditableTextarea } from "../ui/editable-elements";
import { Course, UpdateCourseRow } from "../types";
import { toCourseTitleCase } from "@/lib/eval/title-case";

type CourseTableProps = {
  courses: Course[];
  updateCourse: UpdateCourseRow;
  deleteCourse: (id: number) => void;
  readOnly?: boolean;
  headerRef?: RefObject<HTMLTableSectionElement | null>;
  rowRef?: RefObject<HTMLTableRowElement | null>;
  showEmptyState?: boolean;
  showTotals?: boolean;
  totalCredits?: string;
  gpa?: string;
  onUpdateTotalCredits?: (value: string) => void;
  onUpdateGpa?: (value: string) => void;
  onAddCourse?: () => void;
  notes?: string;
  onUpdateNotes?: (value: string) => void;
  showNotes?: boolean;
};

export const CourseTable = ({
  courses,
  updateCourse,
  deleteCourse,
  readOnly = false,
  headerRef,
  rowRef,
  showEmptyState = true,
  showTotals = false,
  totalCredits = "",
  gpa = "",
  onUpdateTotalCredits,
  onUpdateGpa,
  onAddCourse,
  notes,
  onUpdateNotes,
  showNotes = false,
}: CourseTableProps) => {
  if (!courses || courses.length === 0) {
    if (!showEmptyState) return null;
    return (
      <div className="text-sm text-gray-400 italic p-2 text-center">
        No courses listed on this page.
      </div>
    );
  }

  const showActions = !readOnly;

  return (
    <>
      <table className="course-table w-full text-xs text-center border-collapse border border-gray-300 table-fixed">
        <thead className="bg-gray-100 print:bg-gray-50" ref={headerRef}>
          <tr>
            <th className="border border-gray-300 p-1 w-32 text-center">
              Year
            </th>
            <th className="border border-gray-300 p-1 text-center">
              Course Title
            </th>
            <th className="border border-gray-300 p-1 w-20 text-center">
              U.S. Credits
            </th>
            <th className="border border-gray-300 p-1 w-20 text-center">
              U.S. Grade
            </th>
            {showActions && (
              <th className="border border-gray-300 p-1 w-6 no-print"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {courses.map((course, index) => {
            const courseTitle = readOnly
              ? toCourseTitleCase(course.name)
              : course.name;
            return (
              <tr
                key={course.id}
                className="group hover:bg-blue-50"
                ref={index === 0 ? rowRef : undefined}
              >
                <td className="border border-gray-300 p-0 editable-cell">
                  <EditableInput
                    value={course.year}
                    onChange={(value) => updateCourse(course.id, "year", value)}
                    ariaLabel={`Course ${index + 1} year`}
                    className="text-center h-full"
                    readOnly={readOnly}
                  />
                </td>
                <td className="border border-gray-300 p-0 editable-cell">
                  <EditableTextarea
                    value={courseTitle}
                    onChange={(value) => updateCourse(course.id, "name", value)}
                    ariaLabel={`Course ${index + 1} name`}
                    className="text-left px-2 text-xs leading-snug"
                    readOnly={readOnly}
                  />
                </td>
                <td className="border border-gray-300 p-0 editable-cell">
                  <EditableInput
                    value={course.usCredits || ""}
                    onChange={(value) =>
                      updateCourse(course.id, "usCredits", value)
                    }
                    ariaLabel={`Course ${index + 1} US credits`}
                    className="text-left px-2 h-full font-mono"
                    readOnly={readOnly}
                  />
                </td>
                <td className="border border-gray-300 p-0 editable-cell">
                  <EditableInput
                    value={
                      readOnly && course.usGrade === "P"
                        ? "PASS"
                        : course.usGrade || ""
                    }
                    onChange={(value) =>
                      updateCourse(course.id, "usGrade", value)
                    }
                    ariaLabel={`Course ${index + 1} US grade`}
                    className="text-left px-2 h-full"
                    readOnly={readOnly}
                  />
                </td>
                {showActions && (
                  <td className="border border-gray-300 p-0 no-print">
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="w-full h-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete Row"
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
        {showTotals && (
          <tfoot className="font-bold bg-white">
            <tr className="border-t-2 border-gray-300">
              <td className="border border-gray-300 p-1 text-center pl-2">
                TOTALS
              </td>
              <td
                className="border border-gray-300 p-1 text-right pr-2"
                colSpan={1}
              ></td>
              <td className="border border-gray-300 p-0 editable-cell">
                <EditableInput
                  ariaLabel="Course total US credits"
                  value={totalCredits}
                  onChange={onUpdateTotalCredits || (() => {})}
                  className="text-left px-2 h-full font-mono"
                  readOnly={readOnly}
                />
              </td>
              <td className="border border-gray-300 p-0 editable-cell">
                <div className="flex items-center justify-between px-1 h-full">
                  <EditableInput
                    ariaLabel="Course GPA"
                    value={gpa}
                    onChange={onUpdateGpa || (() => {})}
                    className="text-left px-2 h-full"
                    readOnly={readOnly}
                  />
                </div>
              </td>
              {showActions && (
                <td className="border border-gray-300 bg-gray-50 no-print"></td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
      {showActions && onAddCourse && (
        <button
          onClick={onAddCourse}
          className="no-print mt-2 flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 transition-colors"
        >
          <Plus size={12} /> Add Course
        </button>
      )}
      {showNotes && (
        <CourseNotes
          notes={notes}
          onUpdateNotes={onUpdateNotes}
          readOnly={readOnly}
        />
      )}
    </>
  );
};
