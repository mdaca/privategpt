import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/features/providers";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import "./globals.css";
import '@progress/kendo-theme-bootstrap/dist/all.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MDACA PrivateGPT",
  description: "MDACA PrivateGPT",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className={cn(
          inter.className,
          "flex h-full bg-page-background"
        )}
      >
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
