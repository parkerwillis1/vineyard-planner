import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  Calendar,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export function CostAnalysis() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [timeframe, setTimeframe] = useState('ytd'); // ytd, month, quarter, year
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Load data
  useEffect(() => {
    if (user) {
      const loadedExpenses = JSON.parse(localStorage.getItem(`vineyard_expenses_${user.id}`) || '[]');
      const loadedRevenue = JSON.parse(localStorage.getItem(`vineyard_revenue_${user.id}`) || '[]');
      setExpenses(loadedExpenses);
      setRevenue(loadedRevenue);
    }
  }, [user]);

  // Save data
  const saveData = (type, data) => {
    if (user) {
      localStorage.setItem(`vineyard_${type}_${user.id}`, JSON.stringify(data));
      if (type === 'expenses') setExpenses(data);
      else setRevenue(data);
    }
  };

  // Calculate totals and analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31);

    const filterByDate = (items) => {
      return items.filter(item => {
        const date = new Date(item.date);
        if (timeframe === 'ytd') {
          return date >= startOfYear && date <= now;
        } else if (timeframe === 'year') {
          return date >= startOfYear && date <= endOfYear;
        } else if (timeframe === 'quarter') {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const itemQuarter = Math.floor(date.getMonth() / 3);
          return date.getFullYear() === now.getFullYear() && itemQuarter === currentQuarter;
        } else { // month
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }
      });
    };

    const filteredExpenses = filterByDate(expenses);
    const filteredRevenue = filterByDate(revenue);

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const totalRevenue = filteredRevenue.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Category breakdown
    const expensesByCategory = filteredExpenses.reduce((acc, e) => {
      const cat = e.category || 'Other';
      acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
      return acc;
    }, {});

    // Monthly breakdown
    const monthlyData = [];
    for (let i = 0; i < 12; i++) {
      const monthExpenses = filteredExpenses
        .filter(e => new Date(e.date).getMonth() === i)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const monthRevenue = filteredRevenue
        .filter(r => new Date(r.date).getMonth() === i)
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      monthlyData.push({
        month: i,
        expenses: monthExpenses,
        revenue: monthRevenue,
        profit: monthRevenue - monthExpenses
      });
    }

    return {
      totalExpenses,
      totalRevenue,
      netProfit,
      profitMargin,
      expensesByCategory,
      monthlyData,
      expenseCount: filteredExpenses.length,
      revenueCount: filteredRevenue.length
    };
  }, [expenses, revenue, timeframe, selectedYear]);

  const expenseCategories = [
    'Labor',
    'Materials',
    'Equipment',
    'Fuel',
    'Irrigation',
    'Pest Control',
    'Fertilizer',
    'Utilities',
    'Maintenance',
    'Other'
  ];

  const MetricCard = ({ icon: Icon, label, value, change, trend, color = 'blue' }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg bg-${color}-50 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change}%</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </CardContent>
    </Card>
  );

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'month', label: 'This Month' },
              { value: 'quarter', label: 'Quarter' },
              { value: 'ytd', label: 'YTD' },
              { value: 'year', label: 'Full Year' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  timeframe === option.value
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-vine-green-500"
          >
            {[2024, 2023, 2022, 2021, 2020].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-vine-green-500 hover:bg-vine-green-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          color="green"
        />
        <MetricCard
          icon={TrendingDown}
          label="Total Expenses"
          value={`$${analytics.totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          color="red"
        />
        <MetricCard
          icon={TrendingUp}
          label="Net Profit"
          value={`$${analytics.netProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          trend={analytics.netProfit >= 0 ? 'up' : 'down'}
          color={analytics.netProfit >= 0 ? 'emerald' : 'red'}
        />
        <MetricCard
          icon={PieChart}
          label="Profit Margin"
          value={`${analytics.profitMargin.toFixed(1)}%`}
          color="blue"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trend</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analytics.monthlyData
                .filter(m => m.revenue > 0 || m.expenses > 0)
                .map((month) => {
                  const maxValue = Math.max(
                    ...analytics.monthlyData.map(m => Math.max(m.revenue, m.expenses))
                  );
                  return (
                    <div key={month.month}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {monthNames[month.month]}
                        </span>
                        <span className={`text-sm font-semibold ${
                          month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${Math.abs(month.profit).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${(month.revenue / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${(month.expenses / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Expenses</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(analytics.expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount]) => {
                  const percentage = (amount / analytics.totalExpenses) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-vine-green-500 to-emerald-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...expenses.map(e => ({ ...e, type: 'expense' })), ...revenue.map(r => ({ ...r, type: 'revenue' }))]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 10)
                  .map((transaction, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'revenue'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.category || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.description || '-'}</td>
                      <td className={`py-3 px-4 text-sm font-semibold text-right ${
                        transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'revenue' ? '+' : '-'}${parseFloat(transaction.amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Trash2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
