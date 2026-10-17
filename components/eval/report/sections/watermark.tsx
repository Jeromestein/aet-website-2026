
export const Watermark = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
            <img
                src="/brand/aet-icon-512.png"
                alt=""
                width={512}
                height={512}
                className="w-2/3 opacity-[0.03] h-auto"
            />
        </div>
    )
}
