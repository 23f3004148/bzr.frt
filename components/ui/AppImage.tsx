import React, { useState } from 'react';

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
}

export default function AppImage({
  src,
  alt,
  fallbackSrc = '/assets/images/no_image.png',
  className = '',
  ...props
}: AppImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!hasError && currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
          setHasError(true);
        }
      }}
      {...props}
    />
  );
}
