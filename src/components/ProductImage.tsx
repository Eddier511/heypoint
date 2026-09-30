import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";

type ProductImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  detail?: boolean;
};

const LEGACY_PLACEHOLDER = "https://placehold.co/600x400?text=Hey!Point";

export function ProductImage({ src, alt, className, style, detail = false, onError, ...rest }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = src?.trim() ?? "";
  const isUnavailable = !imageSrc || imageSrc === LEGACY_PLACEHOLDER || failedSrc === imageSrc;

  if (isUnavailable) {
    return (
      <div
        className={`flex items-center justify-center bg-white text-[#9CA3AF] ${className ?? ""}`}
        style={{ ...style, display: "flex" }}
        role="img"
        aria-label={alt ? `${alt}: imagen no disponible` : "Imagen no disponible"}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <ImageOff className={detail ? "h-11 w-11" : "h-8 w-8"} strokeWidth={1.5} aria-hidden="true" />
          {detail && <span className="text-sm font-medium">Imagen no disponible</span>}
        </div>
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={(event) => {
        onError?.(event);
        setFailedSrc(imageSrc);
      }}
    />
  );
}
