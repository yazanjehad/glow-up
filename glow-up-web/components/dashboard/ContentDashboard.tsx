"use client";

import React, { useState } from "react";
import TopBarDashbord from "./TopBarDashbord";
import OrdersDashboard from "./OrdersDashbord";
import WeeklyCalendar from "./WeeklyCalendar";

function ContentDashboard() {
  const [activeView, setActiveView] = useState<"orders" | "calendar">("orders");

  return (
    <div className="py-8">
      <TopBarDashbord
        title="dashboardTitle"
        className="mb-4 w-full mx-auto"
        activeView={activeView}
        onShowCalendar={() => setActiveView("calendar")}
        onShowOrders={() => setActiveView("orders")}
      />

      {activeView === "orders" && <OrdersDashboard />}
      {activeView === "calendar" && <WeeklyCalendar  />}
    </div>
  );
}

export default ContentDashboard;
