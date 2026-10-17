"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import type { SampleData } from "@/lib/eval/report-data";
import { ReportPage } from "./report/ui/report-page";
import { useDynamicMeasure } from "./report/hooks/use-dynamic-measure";
import { usePagination } from "./report/hooks/use-pagination";
import { createReportEdits } from "@/lib/eval/report-editing";
export function ReportCanvas({
  data,
  onReady,
  onChange,
  readOnly = false,
}: {
  data: SampleData;
  onReady?: () => void;
  onChange: (data: SampleData) => void;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const layoutSnapshot = useRef(data);
  // Keep page membership stable while typing; all displayed values remain live.
  if (!editing || readOnly) layoutSnapshot.current = data;
  const layoutData = layoutSnapshot.current;
  const edits = createReportEdits(data, onChange);
  const ready = useCallback(() => onReady?.(), [onReady]);
  const { measurements, refs } = useDynamicMeasure({
    data: layoutData,
    onReady: ready,
  });
  const pages = usePagination({ data: layoutData, readOnly, measurements });
  const measureIndex = useMemo(
    () =>
      Math.max(
        0,
        pages.findIndex((p) => p.showCourseSection),
      ),
    [pages],
  );
  return (
    <div
      className="eval-paper-canvas"
      aria-label={readOnly ? "Report print preview" : "Editable report"}
      onFocusCapture={(event) => {
        if (event.target.matches("input, textarea")) setEditing(true);
      }}
      onBlurCapture={() => setEditing(false)}
    >
      <div className="page-stack eval-document">
        {pages.map((page, index) => (
          <ReportPage
            key={index}
            {...page}
            documents={page.documents
              .map((entry) => ({
                ...entry,
                document: data.documents[entry.index],
              }))
              .filter((entry) => !!entry.document)}
            pageCourses={page.courses
              .map((course) =>
                data.credentials[page.credentialIndex ?? 0]?.courses.find(
                  (current) => current.id === course.id,
                ),
              )
              .filter(
                (course): course is NonNullable<typeof course> => !!course,
              )}
            data={data}
            pageIndex={index}
            totalPages={pages.length}
            readOnly={readOnly}
            {...edits}
            deleteCourse={(credentialIndex, courseId) => {
              if (confirm("Remove this course from the draft?"))
                edits.deleteCourse(credentialIndex, courseId);
            }}
            deleteDocument={(index) => {
              if (confirm("Remove this document from the draft?"))
                edits.deleteDocument(index);
            }}
            introContentRef={index === 0 ? refs.introContentRef : undefined}
            courseContentRef={
              index === measureIndex ? refs.courseContentRef : undefined
            }
            tableStartRef={
              index === measureIndex ? refs.tableStartRef : undefined
            }
            tableHeaderRef={
              index === measureIndex ? refs.tableHeaderRef : undefined
            }
            rowRef={index === measureIndex ? refs.rowRef : undefined}
            documentsListRef={index === 0 ? refs.documentsListRef : undefined}
            documentItemRef={index === 0 ? refs.documentItemRef : undefined}
            tailRef={page.showSignatures ? refs.tailRef : undefined}
          />
        ))}
      </div>
    </div>
  );
}
