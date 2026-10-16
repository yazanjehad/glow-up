"use client";

import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import SideBar from "@/components/shared/sideBar";
import { bookingsMenuItems } from "./sidebar-items";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";

export default function BookingsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-72px)] bg-gray-50 pb-10">
        <div className="mb-6">
          <TopBar
            titleKey="bookings.title"
            iconHref="/home"
            iconAriaLabelKey="reviewsPage.backAria"
            icon={<ChevronArrow />}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-[329px_1fr] items-start">
            <aside className="w-full lg:w-[329px]">
              <SideBar items={bookingsMenuItems as any} />
            </aside>

            <main className="min-w-0 min-h-0 pb-8">{children}</main>
          </div>
        </div>
      </div>
    </Layout>
  );
}
