import type { Metadata } from "next";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import AppThemeProvider from "./app-theme-provider";

export const metadata: Metadata = {
  title: "Boudokhane Doors",
  description:
    "Get your perfect door with Boudokhane Doors. We offer a wide range of high-quality doors to suit your style and needs. Explore our collection and find the perfect door for your home or office.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <AppThemeProvider>
            <SiteHeader />
            <main style={{ flex: 1, paddingTop: "64px" }}>{children}</main>
            <SiteFooter />
          </AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
