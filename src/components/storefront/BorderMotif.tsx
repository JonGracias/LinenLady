export default function BorderMotif() {
  return (
    <div
      id="border-motif"
      className="h-3 w-full opacity-60"
      style={{
        background: `repeating-linear-gradient(
          90deg,
          #b07878 0px, #b07878 8px,
          transparent 8px, transparent 16px,
          #8fad94 16px, #8fad94 24px,
          transparent 24px, transparent 32px,
          #ecdcdc 32px, #ecdcdc 40px,
          transparent 40px, transparent 48px
        )`,
      }}
    />
  );
}