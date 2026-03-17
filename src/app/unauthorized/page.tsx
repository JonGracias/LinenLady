export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4"
      style={{ background: "#1a1a1a", color: "#fff" }}>
      <h1 className="text-2xl font-light">Access Denied</h1>
      <p className="text-sm opacity-50">You are not authorized to access the admin panel.</p>
      <a href="/" className="text-sm underline opacity-40">Return to site</a>
    </div>
  );
}