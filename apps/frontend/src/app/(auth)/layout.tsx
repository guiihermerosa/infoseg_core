export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle px-4 py-8">
      <div className="w-full max-w-md animate-in">
        {children}
      </div>
    </div>
  );
}
