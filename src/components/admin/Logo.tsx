// src/components/LinenLadyLogo.tsx

type LinenLadyLogoProps = {
  className?: string;
  color?: string;
  width?: number | string;
};

const adminName = process.env.NEXT_PUBLIC_ADMIN_NAME ?? "My Store";

export function LinenLadyLogo({
  className,
  color = "currentColor",
  width = "100%",
}: LinenLadyLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 35"
      width={width}
      className={className}
      aria-label="Linen Lady"
      role="img"
    >
      <text
        x="158"
        y="24"
        fontFamily="'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif"
        fontSize="30"
        fontWeight="200"
        letterSpacing="4"
        textAnchor="middle"
        fill={color}
      >
        {adminName}
      </text>
    </svg>
  );
}