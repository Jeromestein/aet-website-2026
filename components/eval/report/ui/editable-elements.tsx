import { useRef, useLayoutEffect, createContext, useContext } from "react";
import { signatureUrl } from "@/lib/eval/assets";

export const FieldLabel = createContext<string | undefined>(undefined);

export type EditableInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  ariaLabel?: string;
};

export const EditableInput = ({
  value,
  onChange,
  className = "",
  placeholder = "",
  readOnly = false,
  ariaLabel,
}: EditableInputProps) => (
  <EditableTextarea
    value={value}
    onChange={onChange}
    className={`p-1 ${className}`}
    readOnly={readOnly}
    ariaLabel={ariaLabel || placeholder || undefined}
  />
);

export type EditableTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  rows?: number;
  readOnly?: boolean;
  ariaLabel?: string;
};

export const EditableTextarea = ({
  value,
  onChange,
  className = "",
  rows = 1,
  readOnly = false,
  ariaLabel,
}: EditableTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contextLabel = useContext(FieldLabel);

  useLayoutEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
  }, [value]);

  if (readOnly)
    return (
      <div
        className={`whitespace-pre-wrap break-words py-0.5 px-2 ${className}`}
      >
        {value || "\u00a0"}
      </div>
    );
  return (
    <textarea
      ref={textareaRef}
      aria-label={ariaLabel || contextLabel || "Report text"}
      value={value ?? ""}
      onChange={(event) => {
        if (readOnly) return;
        onChange(event.target.value);
      }}
      rows={rows}
      readOnly={readOnly}
      className={`bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:bg-blue-50 transition-colors w-full py-0.5 px-2 resize-none leading-snug ${className}`}
    />
  );
};

export type EditableImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  onChange: (value: string) => void;
  readOnly?: boolean;
  className?: string;
};

export const EditableImage = ({
  src,
  alt,
  width,
  height,
  onChange,
  readOnly = false,
  className = "",
}: EditableImageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        !["image/png", "image/jpeg"].includes(file.type) ||
        file.size > 280000
      ) {
        alert("Choose a PNG or JPEG signature under 280 KB.");
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!src && readOnly) return null;

  return (
    <>
      <div
        onClick={handleImageClick}
        role={!readOnly ? "button" : undefined}
        tabIndex={!readOnly ? 0 : undefined}
        aria-label={!readOnly ? `Upload ${alt}` : undefined}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleImageClick();
          }
        }}
        className={`${className} ${!readOnly ? "cursor-pointer" : ""}`}
        title={!readOnly ? "Click to upload signature" : undefined}
      >
        {src ? (
          <img
            src={signatureUrl(src)}
            alt={alt}
            width={width}
            height={height}
            className="w-full h-auto"
          />
        ) : (
          <div className="w-full h-12 border border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400 bg-gray-50/50 hover:bg-gray-100/50 transition-colors rounded">
            Upload Signature
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png,image/jpeg"
      />
    </>
  );
};
