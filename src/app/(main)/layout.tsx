import { BottomNav } from "@/components/ui/BottomNav";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {children}
      <InstallPrompt />
      <BottomNav />
    </div>
  );
}
