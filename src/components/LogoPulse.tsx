type LogoPulseProps = {
  src?: string;
  alt?: string;
  className?: string;
  opacity?: number; // 0..1
};

export default function LogoPulse({
  src = "/JALSOL1.gif",
  alt = "JAL/SOL",
  className,
  opacity = 0.14,
}: LogoPulseProps) {
  return (
    <div className={`logo-pulse ${className ?? ""}`} aria-hidden="true">
      <img
        src={src}
        alt={alt}
        className="logo-pulse__img"
        style={{ opacity }}
        draggable={false}
      />
    </div>
  );
}