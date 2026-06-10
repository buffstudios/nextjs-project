import { BrandProvider } from "@/lib/brand";
import { BrandThemeProvider } from "@/components/brand-theme-provider";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BrandProvider>
      <BrandThemeProvider>{children}</BrandThemeProvider>
    </BrandProvider>
  );
}
