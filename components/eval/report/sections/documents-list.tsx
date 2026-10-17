import { Trash2, Plus } from "lucide-react";
import { RefObject } from "react";
import { EditableInput, EditableTextarea } from "../ui/editable-elements";
import { SectionTitle, DocumentFieldRow } from "../ui/shared";
import { DocumentEntry, UpdateDocument, DeleteDocument } from "../types";

type DocumentsListProps = {
  documents: DocumentEntry[];
  documentsHeading?: string;
  showDocumentsHeading: boolean;
  showDocumentsActions: boolean;
  updateDocument: UpdateDocument;
  deleteDocument: DeleteDocument;
  addDocument: () => void;
  readOnly?: boolean;
  documentsListRef?: RefObject<HTMLUListElement | null>;
  documentItemRef?: RefObject<HTMLLIElement | null>;
};

export const DocumentsList = ({
  documents,
  documentsHeading,
  showDocumentsHeading,
  showDocumentsActions,
  updateDocument,
  deleteDocument,
  addDocument,
  readOnly = false,
  documentsListRef,
  documentItemRef,
}: DocumentsListProps) => {
  return (
    <>
      {showDocumentsHeading && (
        <>
          {documentsHeading && <SectionTitle>{documentsHeading}</SectionTitle>}

          {/* Documents Intro Text */}
          {documentsHeading === "2. Documents" && (
            <div className="text-xs text-gray-700 mb-2 italic">
              This evaluation is based on the following documents electronically
              submitted by the applicant:
            </div>
          )}

          <ul
            className="list-disc pl-4 space-y-2 text-sm"
            ref={documentsListRef}
          >
            {documents.map((entry, index) => (
              <li
                key={entry.index}
                className={`relative ${readOnly ? "" : "pr-5"}`}
                ref={index === 0 ? documentItemRef : undefined}
              >
                <EditableInput
                  value={entry.document.title}
                  ariaLabel={`Document ${entry.index + 1} title`}
                  onChange={(value) =>
                    updateDocument(entry.index, "title", value)
                  }
                  className="font-semibold"
                  readOnly={readOnly}
                />
                <div className="mt-0.5 space-y-0.5">
                  <DocumentFieldRow label="Issued By">
                    <EditableTextarea
                      value={entry.document.issuedBy}
                      onChange={(value) =>
                        updateDocument(entry.index, "issuedBy", value)
                      }
                      rows={1}
                      className="leading-snug"
                      readOnly={readOnly}
                    />
                  </DocumentFieldRow>
                  <div className="grid grid-cols-2 gap-x-6">
                    <DocumentFieldRow label="Date of Issue">
                      <EditableInput
                        value={entry.document.dateIssued}
                        onChange={(value) =>
                          updateDocument(entry.index, "dateIssued", value)
                        }
                        readOnly={readOnly}
                      />
                    </DocumentFieldRow>
                    <DocumentFieldRow label="Certificate No.">
                      <EditableInput
                        value={entry.document.certificateNo}
                        onChange={(value) =>
                          updateDocument(entry.index, "certificateNo", value)
                        }
                        readOnly={readOnly}
                      />
                    </DocumentFieldRow>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => deleteDocument(entry.index)}
                    className="no-print absolute top-1 right-0 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove document"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!readOnly && showDocumentsActions && (
            <button
              type="button"
              onClick={addDocument}
              className="no-print mt-2 flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 transition-colors"
            >
              <Plus size={12} /> Add Document
            </button>
          )}
        </>
      )}
    </>
  );
};
