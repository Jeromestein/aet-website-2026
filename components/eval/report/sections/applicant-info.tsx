import { SampleData, UpdateDataField } from "../types";
import { EditableInput } from "../ui/editable-elements";
import { InfoRow } from "../ui/shared";

type ApplicantInfoProps = {
  data: SampleData;
  updateDataField: UpdateDataField;
  readOnly?: boolean;
};

export const ApplicantInfo = ({
  data,
  updateDataField,
  readOnly = false,
}: ApplicantInfoProps) => (
  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-6 text-sm">
    <InfoRow label="Name of Applicant" labelClassName="uppercase tracking-wide">
      <EditableInput
        value={data.name}
        onChange={(value) => updateDataField("name", value)}
        className="font-semibold"
        readOnly={readOnly}
      />
    </InfoRow>
    <InfoRow
      label="Date of Evaluation"
      labelClassName="uppercase tracking-wide"
    >
      <EditableInput
        value={data.date}
        onChange={(value) => updateDataField("date", value)}
        className="font-semibold"
        readOnly={readOnly}
      />
    </InfoRow>
    <InfoRow label="Date of Birth" labelClassName="uppercase tracking-wide">
      <EditableInput
        value={data.dob}
        onChange={(value) => updateDataField("dob", value)}
        className="font-semibold"
        readOnly={readOnly}
      />
    </InfoRow>
    <InfoRow label="Evaluation ID" labelClassName="uppercase tracking-wide">
      <EditableInput
        value={data.refNo}
        onChange={(value) => updateDataField("refNo", value)}
        className="font-semibold"
        readOnly={readOnly}
      />
    </InfoRow>
    <div className="col-span-2">
      <InfoRow
        label="Purpose of evaluation"
        labelClassName="uppercase tracking-wide"
      >
        <EditableInput
          value={data.purpose}
          onChange={(value) => updateDataField("purpose", value)}
          className="font-semibold"
          readOnly={readOnly}
        />
      </InfoRow>
    </div>
    <div className="col-span-2">
      <InfoRow
        label="Country of Education"
        labelClassName="uppercase tracking-wide"
      >
        <EditableInput
          value={data.country}
          onChange={(value) => updateDataField("country", value)}
          className="font-semibold"
          readOnly={readOnly}
        />
      </InfoRow>
    </div>
  </div>
);
