'use client';

import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchDashboard, fetchRevenue, fetchActivities } from '@/store/slices/analyticsSlice';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Users, DollarSign, Heart, Activity, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';

const COLORS = ['#52101b', '#D4A574', '#A3A3A3'];

export default function AnalyticsPage() {
    const dispatch = useAppDispatch();
    const { dashboard, revenue, activities, isLoading, error, selectedPeriod } = useAppSelector(state => state.analytics);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        dispatch(fetchDashboard(period));
        dispatch(fetchRevenue({ period: 'monthly', months: 12 }));
        dispatch(fetchActivities({ limit: 20, type: 'all' }));
    }, [dispatch, period]);

    const handlePeriodChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
        setPeriod(e.target.value);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    const revenueData = revenue.data.map(item => ({
        name: item.period,
        revenue: item.revenue,
        subscriptions: item.subscriptions
    }));

    const userGrowthData = dashboard.dailyGrowth.slice(-30).map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: item.users
    }));

    const genderData = dashboard.overview ? [
        { name: 'Male', value: dashboard.overview.genderDistribution.male },
        { name: 'Female', value: dashboard.overview.genderDistribution.female }
    ] : [];

    const subscriptionData = revenue.revenueByPlan.map(item => ({
        name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
        value: item.count
    }));

    if (isLoading && !dashboard.overview) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Period Selector */}
        <div className="flex justify-end">
          <div className="w-40">
            <Select
              value={period}
              onChange={handlePeriodChange}
              options={[
                { value: "7d", label: "Last 7 Days" },
                { value: "30d", label: "Last 30 Days" },
                { value: "90d", label: "Last 3 Months" },
              ]}
              className="mb-0"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Users</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {dashboard.overview
                    ? formatNumber(dashboard.overview.totalUsers)
                    : "-"}
                </p>
                {dashboard.overview && (
                  <div className="flex items-center gap-1 mt-1">
                    {dashboard.overview.growth.users >= 0 ? (
                      <TrendingUp size={12} className="text-green-500" />
                    ) : (
                      <TrendingDown size={12} className="text-red-500" />
                    )}
                    <span
                      className={`text-xs ${dashboard.overview.growth.users >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {dashboard.overview.growth.users >= 0 ? "+" : ""}
                      {dashboard.overview.growth.users}%
                    </span>
                    <span className="text-xs text-gray-400">this period</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-primary-50 rounded-full">
                <Users className="text-primary" size={20} />
              </div>
            </div>
          </Card>

          <Card className="rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {dashboard.overview
                    ? formatCurrency(dashboard.overview.revenue)
                    : "-"}
                </p>
                {dashboard.overview && (
                  <div className="flex items-center gap-1 mt-1">
                    {dashboard.overview.growth.revenue >= 0 ? (
                      <TrendingUp size={12} className="text-green-500" />
                    ) : (
                      <TrendingDown size={12} className="text-red-500" />
                    )}
                    <span
                      className={`text-xs ${dashboard.overview.growth.revenue >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {dashboard.overview.growth.revenue >= 0 ? "+" : ""}
                      {dashboard.overview.growth.revenue}%
                    </span>
                    <span className="text-xs text-gray-400">this period</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <DollarSign className="text-green-600" size={20} />
              </div>
            </div>
          </Card>

          <Card className="rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Users</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {dashboard.overview
                    ? formatNumber(dashboard.overview.activeUsers)
                    : "-"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {dashboard.overview
                    ? `${dashboard.overview.engagementRate}% engagement`
                    : "-"}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Activity className="text-blue-600" size={20} />
              </div>
            </div>
          </Card>

          <Card className="rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Premium Users</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {dashboard.overview
                    ? formatNumber(dashboard.overview.premiumUsers)
                    : "-"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {dashboard.overview && dashboard.overview.totalUsers > 0
                    ? `${Math.round((dashboard.overview.premiumUsers / dashboard.overview.totalUsers) * 100)}% of total`
                    : "-"}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-full">
                <Heart className="text-amber-600" size={20} />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[30px] p-6 h-87.5">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">
              Revenue Over Time
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#52101b" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#52101b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tickMargin={10}
                  stroke="#9ca3af"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ fontSize: "12px", color: "#111827" }}
                  formatter={(value) => [
                    formatCurrency(value as number),
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#52101b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="rounded-[30px] p-6 h-87.5">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">
              User Growth
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={userGrowthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tickMargin={10}
                  stroke="#9ca3af"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  stroke="#9ca3af"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "#f9fafb" }}
                  formatter={(value) => [
                    formatNumber(value as number),
                    "New Users",
                  ]}
                />
                <Bar
                  dataKey="users"
                  fill="#D4A574"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-[30px] p-6 h-87.5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Gender Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={genderData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {genderData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-xs text-gray-500">
                    {entry.name}: {formatNumber(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[30px] p-6 h-87.5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Subscription Distribution
            </h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {subscriptionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-500">
                    {entry.name}: {formatNumber(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[30px] p-6 h-87.5 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Latest Activities
            </h3>
            <div className="space-y-3 overflow-y-auto h-55 pr-2">
              {activities.items.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <Badge
                    variant={
                      activity.type === "user_registration"
                        ? "success"
                        : activity.type === "new_match"
                          ? "info"
                          : activity.type === "new_message"
                            ? "neutral"
                            : "info"
                    }
                    className="text-[10px] px-2 py-0.5"
                  >
                    {activity.type.split("_")[0]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {activities.items.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-[25px] p-4">
            <p className="text-xs text-gray-500">Total Matches</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {dashboard.overview
                ? formatNumber(dashboard.overview.totalMatches)
                : "-"}
            </p>
          </Card>
          <Card className="rounded-[25px] p-4">
            <p className="text-xs text-gray-500">Total Messages</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {dashboard.overview
                ? formatNumber(dashboard.overview.totalMessages)
                : "-"}
            </p>
          </Card>
          <Card className="rounded-[25px] p-4">
            <p className="text-xs text-gray-500">Total Swipes</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {dashboard.overview
                ? formatNumber(dashboard.overview.totalSwipes)
                : "-"}
            </p>
          </Card>
          <Card className="rounded-[25px] p-4">
            <p className="text-xs text-gray-500">New This Period</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {dashboard.overview
                ? formatNumber(dashboard.overview.newUsers)
                : "-"}
            </p>
          </Card>
        </div>
      </div>
    );
}
