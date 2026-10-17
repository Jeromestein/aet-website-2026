import Image from "next/image"

export const Seal = () => {
    return (
        <div className="flex justify-end mt-4">
            <div className="w-48 h-48">
                <img
                    src="/api/admin/eval/assets/AET-seal.jpg"
                    alt="AET Seal"
                    width={128}
                    height={128}
                    className="w-full h-full object-contain opacity-90"
                />
            </div>
        </div>
    )
}
