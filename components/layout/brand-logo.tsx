interface BrandLogoProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function BrandLogo({
  src = "/logo-sekolah.png",
  alt = "Lambang SMPITDM",
  className = "h-9 w-9",
}: BrandLogoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
