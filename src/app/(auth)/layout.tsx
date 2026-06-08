export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[#0a0a14] to-[#1a1a2e]">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
