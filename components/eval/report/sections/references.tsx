import { EditableTextarea } from "../ui/editable-elements";
import { UpdateDataField } from "../types";

type ReferencesProps = {
  references: string;
  updateDataField: UpdateDataField;
  readOnly?: boolean;
};

export const References = ({
  references,
  updateDataField,
  readOnly,
}: ReferencesProps) => (
  <div className="text-xs mb-4 mt-2">
    <EditableTextarea
      ariaLabel="References"
      value={references || ""}
      onChange={(value) => updateDataField("references", value)}
      className="w-full text-gray-600 whitespace-pre-wrap leading-relaxed"
      readOnly={readOnly}
    />
  </div>
);
