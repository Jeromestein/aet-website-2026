import { SampleData } from "@/lib/eval/report-data"

type FooterProps = {
    pageIndex: number
    totalPages: number
    refNo: string
}

export const Footer = ({ pageIndex, totalPages, refNo }: FooterProps) => (
    <footer className="report-footer border-t border-gray-300 pt-2 flex justify-between text-[10px] text-gray-400 mt-auto shrink-0">
        <span>
            Page {pageIndex + 1} of {totalPages}
        </span>
    </footer>
)
