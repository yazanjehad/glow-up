"use client";

import Header from "@/components/shared/Header";
import { ReactNode } from "react";
import SideBar from "@/components/shared/sideBar";
import { accountMenuItems } from "./sidebar-items";
import { TopBar } from "@/components/shared/TopBar";
import { Home } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function AccountLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-50 bg-gray-50 border-b">
        <Header />
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div className="flex flex-col py-4 sm:py-8">
          <div className="mb-6">
            <TopBar
              titleKey="accountPage.myAccount"
              iconHref="/home"
              iconAriaLabelKey="reviewsPage.backAria"
              icon={<Home />}
            />
          </div>

          <div className="grid flex-1 min-h-0 gap-6 lg:grid-cols-[329px_1fr] lg:grid-rows-[1fr]">
            <div className="h-fit lg:sticky lg:top-6 self-start lg:self-auto">
              <SideBar items={accountMenuItems} />
            </div>

            <main
              className="min-h-0 overflow-y-auto rounded-[20px] bg-white p-6 shadow-sm"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
