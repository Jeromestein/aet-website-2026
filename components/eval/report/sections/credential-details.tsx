import { EditableInput, EditableTextarea } from "../ui/editable-elements"
import { DetailRow } from "../ui/shared"
import { SampleData, CredentialField, UpdateCredentialField } from "../types"

type CredentialDetailsProps = {
    credential?: SampleData["credentials"][number]
    credentialIndex?: number
    showCredentialTable: boolean
    updateCredentialField: UpdateCredentialField
    readOnly?: boolean
}

export const CredentialDetails = ({
    credential,
    credentialIndex,

    showCredentialTable,
    updateCredentialField,
    readOnly = false,
}: CredentialDetailsProps) => {
    const canShowCredentialTable = Boolean(showCredentialTable && credential && credentialIndex !== undefined)
    const handleCredentialFieldChange = (field: CredentialField, value: string) => {
        if (credentialIndex === undefined) return
        updateCredentialField(credentialIndex, field, value)
    }

    return (
        <div className="text-sm">
            {canShowCredentialTable && (
                <table className="w-full text-sm border-collapse mb-3 table-fixed">
                    <tbody>
                        <DetailRow label="Name of Awarding Institution">
                            <EditableTextarea
                                value={credential!.awardingInstitution}
                                onChange={(value) => handleCredentialFieldChange("awardingInstitution", value)}
                                rows={1}
                                className="font-semibold leading-snug"
                                readOnly={readOnly}
                            />
                        </DetailRow>

                        <DetailRow label="Country">
                            <EditableInput
                                value={credential!.country}
                                onChange={(value) => handleCredentialFieldChange("country", value)}
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Admission Requirements">
                            <EditableTextarea
                                value={credential!.admissionRequirements}
                                onChange={(value) => handleCredentialFieldChange("admissionRequirements", value)}
                                rows={1}
                                className="leading-snug"
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Program">
                            <EditableTextarea
                                value={credential!.program}
                                onChange={(value) => handleCredentialFieldChange("program", value)}
                                rows={1}
                                className="leading-snug"
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Grants Access to">
                            <EditableInput
                                value={credential!.grantsAccessTo}
                                onChange={(value) => handleCredentialFieldChange("grantsAccessTo", value)}
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Standard Program Length">
                            <EditableInput
                                value={credential!.standardProgramLength}
                                onChange={(value) => handleCredentialFieldChange("standardProgramLength", value)}
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Years Attended">
                            <EditableInput
                                value={credential!.yearsAttended}
                                onChange={(value) => handleCredentialFieldChange("yearsAttended", value)}
                                readOnly={readOnly}
                            />
                        </DetailRow>
                        <DetailRow label="Year of Graduation">
                            <EditableInput
                                value={credential!.yearOfGraduation}
                                onChange={(value) => handleCredentialFieldChange("yearOfGraduation", value)}
                                readOnly={readOnly}
                            />
                        </DetailRow>
                    </tbody>
                </table>
            )}


        </div>
    )
}
