import React, { useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export function ImageWithFallback(props: Props) {
  const [didError, setDidError] = useState(false);

  const {
    src,
    alt,
    style,
    className,
    onError,
    onLoad,
    fallbackSrc = ERROR_IMG_SRC,
    ...rest
  } = props;

  const handleError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    // respeta el onError del caller
    onError?.(e);
    setDidError(true);
  };

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    // respeta el onLoad del caller (clave para heroLoaded)
    onLoad?.(e);
  };

  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`}
        style={style}
        data-original-url={src}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={fallbackSrc}
            alt="Error loading image"
            className="max-w-full max-h-full"
            // NO le pasamos ...rest para no heredar handlers/props raras
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
