"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  getProviderOverview,
  getBookingStats,
  getRevenue,
  ProviderOverview,
  BookingStats,
  RevenueData,
  RevenuePeriod,
  RevenuePerWeek,
} from "@/integration/services/provider/providerDashboard.service";
import { Button } from "@/components/ui/button";
import { SaudiRiyal } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-3 min-w-[100px]">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-2xl font-bold text-gray-800">{value}</span>
  </div>
);

export default function ProviderDashboardHome() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<ProviderOverview | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>("week");
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [bookingPeriod, setBookingPeriod] = useState<RevenuePeriod>("month");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      try {
        setLoading(true);

        const [overviewData, statsData, revenueDataRes] = await Promise.all([
          getProviderOverview(),
          getBookingStats(bookingPeriod),
          getRevenue(revenuePeriod),
        ]);

        if (!alive) return;
        setOverview(overviewData);
        setBookingStats(statsData);
        setRevenueData(revenueDataRes);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRevenuePeriodChange = async (period: RevenuePeriod) => {
    if (period === revenuePeriod) return;
    setRevenuePeriod(period);
    setRevenueLoading(true);
    try {
      const data = await getRevenue(period);
      setRevenueData(data);
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setRevenueLoading(false);
    }
  };

  const handleBookingPeriodChange = async (period: RevenuePeriod) => {
    if (period === bookingPeriod) return;
    setBookingPeriod(period);
    setBookingLoading(true);
    try {
      const data = await getBookingStats(period);
      setBookingStats(data);
    } catch (error) {
      console.error("Failed to fetch booking stats:", error);
    } finally {
      setBookingLoading(false);
    }
  };

  const getRevenueChartData = () => {
    if (!revenueData) return [];

    if (revenuePeriod === "week") {
      const weekData = revenueData as RevenuePerWeek;
      return [
        {
          label: t("providerDashboard.days.sunday"),
          revenue: weekData.Sunday ?? 0,
        },
        {
          label: t("providerDashboard.days.monday"),
          revenue: weekData.Monday ?? 0,
        },
        {
          label: t("providerDashboard.days.tuesday"),
          revenue: weekData.Tuesday ?? 0,
        },
        {
          label: t("providerDashboard.days.wednesday"),
          revenue: weekData.Wednesday ?? 0,
        },
        {
          label: t("providerDashboard.days.thursday"),
          revenue: weekData.Thursday ?? 0,
        },
        {
          label: t("providerDashboard.days.friday"),
          revenue: weekData.Friday ?? 0,
        },
        {
          label: t("providerDashboard.days.saturday"),
          revenue: weekData.Saturday ?? 0,
        },
      ];
    }

    if (revenuePeriod === "month") {
      const monthData = revenueData as Record<string, number>;
      return Object.entries(monthData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => {
          const [year, monthNum] = month.split("-");
          const monthKey = `providerDashboard.months.${monthNum}`;
          return { label: `${t(monthKey)} ${year}`, revenue: revenue ?? 0 };
        });
    }

    if (revenuePeriod === "year") {
      const yearData = revenueData as Record<string, number>;
      return Object.entries(yearData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, revenue]) => ({ label: year, revenue: revenue ?? 0 }));
    }

    return [];
  };

  const revenueChartData = getRevenueChartData();

  const chartData = bookingStats
    ? [
        {
          name: t("providerDashboard.completed"),
          value: bookingStats.completed,
          color: "#22C55E",
        },
        {
          name: t("providerDashboard.confirmed"),
          value: bookingStats.confirmed,
          color: "#3B82F6",
        },
        {
          name: t("providerDashboard.cancelled"),
          value: bookingStats.cancelled,
          color: "#EF4444",
        },
        {
          name: t("providerDashboard.pending"),
          value: bookingStats.pending,
          color: "#F59E0B",
        },
      ]
    : [];

  const total = bookingStats?.total ?? 0;

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("providerDashboard.pageTitle")}
      </h1>

      {/* General Statistics Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t("providerDashboard.generalStats")}
        </h2>

        <div className="flex flex-col gap-4">
          {/* First row - 2 cards */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label={t("providerDashboard.services")}
              value={overview?.totalServices ?? 0}
            />
            <StatCard
              label={t("providerDashboard.products")}
              value={overview?.totalPackages ?? 0}
            />
          </div>

          {/* Second row - 3 cards */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label={t("providerDashboard.customers")}
              value={overview?.totalCustomers ?? 0}
            />
            <StatCard
              label={t("providerDashboard.teamMembers")}
              value={overview?.totalEmployees ?? 0}
            />
            <StatCard
              label={t("providerDashboard.bookings")}
              value={overview?.totalBookings ?? 0}
            />
          </div>
        </div>
      </div>

      {/* Appointments Chart Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t("providerDashboard.appointmentsChart")}
        </h2>

        {/* Period Selector */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <Button
            onClick={() => handleBookingPeriodChange("week")}
            className={`rounded-lg px-4 py-2 ${bookingPeriod === "week" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={bookingLoading}
          >
            {t("providerDashboard.periods.week")}
          </Button>
          <Button
            onClick={() => handleBookingPeriodChange("month")}
            className={`rounded-lg px-4 py-2 ${bookingPeriod === "month" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={bookingLoading}
          >
            {t("providerDashboard.periods.month")}
          </Button>
          <Button
            onClick={() => handleBookingPeriodChange("year")}
            className={`rounded-lg px-4 py-2 ${bookingPeriod === "year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={bookingLoading}
          >
            {t("providerDashboard.periods.year")}
          </Button>
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center justify-center gap-6">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="h-[300px] w-full">
          {bookingLoading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t("loading")}
            </div>
          ) : total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t("noDataAvailable")}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t("providerDashboard.revenueChart")}
        </h2>
        <div className="mb-4 flex items-center justify-center gap-2">
          <Button
            onClick={() => handleRevenuePeriodChange("week")}
            className={`rounded-lg px-4 py-2 ${revenuePeriod === "week" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={revenueLoading}
          >
            {t("providerDashboard.periods.week")}
          </Button>
          <Button
            onClick={() => handleRevenuePeriodChange("month")}
            className={`rounded-lg px-4 py-2 ${revenuePeriod === "month" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={revenueLoading}
          >
            {t("providerDashboard.periods.month")}
          </Button>
          <Button
            onClick={() => handleRevenuePeriodChange("year")}
            className={`rounded-lg px-4 py-2 ${revenuePeriod === "year" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            disabled={revenueLoading}
          >
            {t("providerDashboard.periods.year")}
          </Button>
        </div>
        <div className="h-[300px] w-full">
          {revenueLoading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t("loading")}
            </div>
          ) : revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                  interval={0}
                  angle={revenuePeriod === "month" ? -45 : 0}
                  textAnchor={revenuePeriod === "month" ? "end" : "middle"}
                  height={revenuePeriod === "month" ? 80 : 30}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [
                    <span className="inline-flex items-center gap-1" key="sar">
                      {value ?? 0}
                      <SaudiRiyal size={14} />
                    </span>,
                    t("providerDashboard.revenue"),
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#79A66B"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              {t("noDataAvailable")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
