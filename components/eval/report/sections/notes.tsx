import { EditableTextarea } from "../ui/editable-elements";
import { SectionTitle } from "../ui/shared";
import { UpdateDataField } from "../types";

type NotesProps = {
  evaluationNotes: string | undefined;
  updateDataField: UpdateDataField;
  readOnly?: boolean;
  sectionNum: number;
};

const Remarks = () => (
  <div className="text-[11px] text-gray-500 text-justify mb-4 leading-tight">
    <strong>Remarks:</strong> This report is advisory in nature and is not
    binding upon any institution or agency. It is based on the analysis of
    documents submitted by the applicant. AET is an Endorsed Member of the
    Association of International Credential Evaluators (AICE).
  </div>
);

export const Notes = ({
  evaluationNotes,
  updateDataField,
  readOnly,
  sectionNum,
}: NotesProps) => (
  <>
    <SectionTitle>{sectionNum}. Evaluation Notes</SectionTitle>
    <EditableTextarea
      ariaLabel="Evaluation notes"
      value={evaluationNotes || ""}
      onChange={(value) => updateDataField("evaluationNotes", value)}
      className="text-xs text-gray-500 text-justify mb-4 leading-tight min-h-[3rem]"
      readOnly={readOnly}
    />
    {/* <Remarks /> */}
  </>
);
