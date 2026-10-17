import { useState, useEffect } from "react"
import { StickyNote } from "lucide-react"
import { EditableTextarea } from "../ui/editable-elements"

type CourseNotesProps = {
    notes?: string
    onUpdateNotes?: (value: string) => void
    readOnly?: boolean
}

const CourseNotes = ({ notes = "", onUpdateNotes, readOnly }: CourseNotesProps) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const hasNotes = notes.trim().length > 0

    // Auto-expand if there are notes
    useEffect(() => {
        if (hasNotes) {
            setIsExpanded(true)
        }
    }, [hasNotes])

    if (!isExpanded && !hasNotes && !readOnly) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="no-print mt-2 flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 transition-colors"
            >
                <StickyNote size={12} /> Add Notes
            </button>
        )
    }

    if (!isExpanded && !hasNotes && readOnly) {
        return null
    }

    return (
        <div className="mt-2 w-full">
            <EditableTextarea
                value={notes}
                onChange={onUpdateNotes || (() => { })}
                className="text-xs w-full text-left px-2 border border-gray-200 hover:border-gray-300 min-h-[40px]"
                readOnly={readOnly}
            />
        </div>
    )
}

export default CourseNotes
