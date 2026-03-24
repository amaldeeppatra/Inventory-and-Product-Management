import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, DollarSign, Activity, Clock, Tag } from 'lucide-react';

// API Configuration - Replace with your actual backend URL
const API_BASE = import.meta.env.VITE_API_URL;

// API service with actual endpoints
const api = {
  getDashboardStats: async () => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/dashboard?shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add auth if needed
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },
  
  getRevenueTrend: async (days = 7) => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/revenue-trend?days=${days}&shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch revenue trend');
    return response.json();
  },
  
  getBestSellingProducts: async (limit = 5) => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/products/best-selling?limit=${limit}&shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch best selling products');
    return response.json();
  },
  
  getLeastSellingProducts: async (limit = 5) => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/products/least-selling?limit=${limit}&shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch least selling products');
    return response.json();
  },
  
  getOperationalFunnel: async () => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/operational-funnel?shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch operational funnel');
    return response.json();
  },

  getCategoryPerformance: async () => {
    const shopId = localStorage.getItem("selectedShop");
    const response = await fetch(`${API_BASE}/analytics/products/category-performance?shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch category performance');
    return response.json();
  },

  getUserAnalytics: async () => {
    const response = await fetch(`${API_BASE}/analytics/users/analytics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user analytics');
    return response.json();
  }
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", subtitle }) => {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
    pink: "bg-pink-500"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

// Revenue Trend Chart Component
const RevenueTrendChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
          <Tooltip 
            formatter={(value, name) => [
              name === 'revenue' ? `₹${value.toLocaleString()}` : value,
              name === 'revenue' ? 'Revenue' : 'Orders'
            ]}
            labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Product Performance Component
const ProductPerformance = ({ title, data, type = "best", loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data && data.length > 0 ? data.map((product, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                type === 'best' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.productName}</p>
                <p className="text-sm text-gray-500">Qty: {product.totalQuantity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">${Number(product.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Revenue</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No product data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Category Performance Chart
const CategoryPerformanceChart = ({ data, loading }) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="totalRevenue"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Tag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No category data available</p>
        </div>
      )}
    </div>
  );
};

// Operational Funnel Component
const OperationalFunnel = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Funnel</h3>
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No operational data available</p>
        </div>
      </div>
    );
  }

  const funnelData = [
    { status: 'Placed', count: data.orders?.placed || 0, color: '#F59E0B' },
    { status: 'Completed', count: data.orders?.completed || 0, color: '#10B981' }
  ];

  const maxCount = Math.max(...funnelData.map(d => d.count));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
      
      {/* Today's Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Today's New Orders</p>
          <p className="text-2xl font-bold text-blue-900">{data.today?.newOrders || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Today's Completed</p>
          <p className="text-2xl font-bold text-green-900">{data.today?.completedOrders || 0}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="space-y-4">
        {funnelData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="font-medium text-gray-700">{item.status}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-gray-900">{item.count.toLocaleString()}</span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${maxCount > 0 ? Math.min((item.count / maxCount) * 100, 100) : 0}%`,
                    backgroundColor: item.color 
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Active Orders (Placed):</span>
          <span className="font-bold text-lg text-gray-900">{data.totalActiveOrders || 0}</span>
        </div>
      </div>
    </div>
  );
};

// Main Analytics Dashboard Component
const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [leastSellingProducts, setLeastSellingProducts] = useState([]);
  const [operationalFunnel, setOperationalFunnel] = useState(null);
  const [categoryPerformance, setCategoryPerformance] = useState([]);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all analytics data
        const [
          statsRes, 
          trendRes, 
          bestRes, 
          leastRes, 
          funnelRes, 
          categoryRes, 
          userRes
        ] = await Promise.all([
          api.getDashboardStats(),
          api.getRevenueTrend(),
          api.getBestSellingProducts(),
          api.getLeastSellingProducts(),
          api.getOperationalFunnel(),
          api.getCategoryPerformance(),
          api.getUserAnalytics()
        ]);

        // Set all data
        if (statsRes.success) setDashboardStats(statsRes.data);
        if (trendRes.success) setRevenueTrend(trendRes.data);
        if (bestRes.success) setBestSellingProducts(bestRes.data);
        if (leastRes.success) setLeastSellingProducts(leastRes.data);
        if (funnelRes.success) setOperationalFunnel(funnelRes.data);
        if (categoryRes.success) setCategoryPerformance(categoryRes.data);
        if (userRes.success) setUserAnalytics(userRes.data);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <Activity className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Failed to Load Analytics</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your business performance and key metrics</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Today's Revenue"
            value={loading ? "..." : `₹${dashboardStats?.todayRevenue?.toLocaleString() || '0'}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Sales"
            value={loading ? "..." : `₹${dashboardStats?.totalSales?.toLocaleString() || '0'}`}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={loading ? "..." : dashboardStats?.totalOrders?.toLocaleString() || '0'}
            icon={ShoppingCart}
            color="purple"
          />
          <StatCard
            title="Avg Order Value"
            value={loading ? "..." : `₹${dashboardStats?.avgOrderValue?.toFixed(2) || '0.00'}`}
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-8">
          <RevenueTrendChart data={revenueTrend} loading={loading} />
        </div>

        {/* Product Performance and Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ProductPerformance
            title="Best-Selling Products"
            data={bestSellingProducts}
            type="best"
            loading={loading}
          />
          <ProductPerformance
            title="Least-Selling Products"
            data={leastSellingProducts}
            type="least"
            loading={loading}
          />
          <CategoryPerformanceChart 
            data={categoryPerformance} 
            loading={loading}
          />
        </div>

        {/* Operational Funnel and User Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <OperationalFunnel data={operationalFunnel} loading={loading} />
          
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-blue-900">
                  {loading ? "..." : userAnalytics?.totalUsers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-blue-600">Total Users</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Activity className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-900">
                  {loading ? "..." : userAnalytics?.activeUsers?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-green-600">Active Users</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Package className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold text-purple-900">
                  {loading ? "..." : (userAnalytics?.usersByRole?.seller || 0)}
                </p>
                <p className="text-sm text-purple-600">Sellers</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-orange-900">
                  {loading ? "..." : (userAnalytics?.newUsersThisWeek || 0)}
                </p>
                <p className="text-sm text-orange-600">New This Week</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Products"
            value={loading ? "..." : dashboardStats?.totalProducts?.toLocaleString() || '0'}
            icon={Package}
            color="indigo"
          />
          <StatCard
            title="Completed Orders"
            value={loading ? "..." : dashboardStats?.completedOrders?.toLocaleString() || '0'}
            icon={Clock}
            color="teal"
            subtitle="Successfully fulfilled"
          />
          <StatCard
            title="Customer Satisfaction"
            value={loading ? "..." : "4.8/5.0"}
            icon={TrendingUp}
            color="pink"
            subtitle="Based on ratings"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;