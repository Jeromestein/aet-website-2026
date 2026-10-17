import Link from "next/link"
import { Globe } from "lucide-react"

export const Header = () => (
    <header className="report-header flex justify-between items-end border-b-2 border-blue-900 pb-2 shrink-0">
        <div className="flex items-center">
            <img src="/brand/aet-icon-512.png" alt="AET Logo" width={64} height={64} className="h-16 w-auto shrink-0" />
            <div>
                <div className="text-3xl font-black text-blue-900 tracking-wider font-serif leading-none">AET</div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 leading-none">
                    American Education & Translation Services
                </div>
            </div>
        </div>
        <div className="text-xs font-bold text-gray-500 mb-0.5">
            <Link
                href="https://www.americantranslationservice.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-900 transition-colors flex items-center gap-1 mb-1"
            >
                <Globe size={12} className="text-blue-900" />
                www.americantranslationservice.com
            </Link>
        </div>
    </header>
)
