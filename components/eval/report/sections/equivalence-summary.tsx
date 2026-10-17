import { SampleData, UpdateCredentialField } from "../types"
import { SectionTitle, SummaryRow } from "../ui/shared"
import { EditableInput, EditableTextarea } from "../ui/editable-elements"
import React from "react"


type EquivalenceSummaryProps = {
    data: SampleData
    updateEquivalenceField: (credentialIndex: number, field: "equivalenceStatement" | "gpa" | "totalCredits", value: string) => void
    updateCredentialField: UpdateCredentialField
    readOnly?: boolean
}

export const EquivalenceSummary = ({ data, updateEquivalenceField, updateCredentialField, readOnly = false }: EquivalenceSummaryProps) => {
    return (
        <>
            <SectionTitle>1. U.S. Equivalence Summary</SectionTitle>
            <div className="mb-6 text-sm space-y-2">
                {data.credentials.map((cred, idx) => (
                    <div key={cred.id} className="border-b border-gray-100 pb-2 last:border-0">
                        <SummaryRow label={`Credential #${idx + 1}`} labelClassName="font-bold">
                            <EditableTextarea
                                value={cred.awardingInstitution}
                                onChange={(value) => updateCredentialField(idx, "awardingInstitution", value)}
                                className="font-bold text-gray-700 leading-snug"
                                rows={1}
                                readOnly={readOnly}
                            />
                        </SummaryRow>
                        <SummaryRow label="Equivalency">
                            <EditableTextarea
                                value={cred.equivalenceStatement}
                                onChange={(value) => updateEquivalenceField(idx, "equivalenceStatement", value)}
                                className="font-semibold leading-snug"
                                rows={1}
                                readOnly={readOnly}
                            />
                        </SummaryRow>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            <SummaryRow label="U.S. Credits">
                                <EditableInput
                                    value={cred.totalCredits}
                                    onChange={(value) => updateEquivalenceField(idx, "totalCredits", value)}
                                    className="font-semibold"
                                    readOnly={readOnly}
                                />
                            </SummaryRow>
                            <SummaryRow label="U.S. GPA">
                                <EditableInput
                                    value={cred.gpa}
                                    onChange={(value) => updateEquivalenceField(idx, "gpa", value)}
                                    className="font-semibold"
                                    readOnly={readOnly}
                                />
                            </SummaryRow>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
