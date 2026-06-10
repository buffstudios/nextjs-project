import { BrandProvider } from "@/lib/brand";
import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <BrandThemeProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">{children}</main>
        </div>
      </BrandThemeProvider>
    </BrandProvider>
  );
}
