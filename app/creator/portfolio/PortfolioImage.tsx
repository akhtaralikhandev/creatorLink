"use client";

interface PortfolioImageProps {
  src: string;
  alt: string;
}

export function PortfolioImage({ src, alt }: PortfolioImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
