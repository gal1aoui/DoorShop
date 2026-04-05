"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

type SiteFrameProps = {
  children: React.ReactNode;
};

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export default function SiteFrame({ children }: SiteFrameProps) {
  const pathname = usePathname();
  const hideFooter = isAdminRoute(pathname);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-16 overflow-x-hidden">{children}</main>
      {hideFooter ? null : <SiteFooter />}
    </>
  );
}
