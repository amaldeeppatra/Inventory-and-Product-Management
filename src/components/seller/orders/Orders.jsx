import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FiSearch, FiFilter, FiDownload, FiX } from 'react-icons/fi';
import Tabs from './Tabs';
import Pagination from '../../Pagination';
import Skeleton from '@mui/material/Skeleton';
import Table from '../../Table';

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 10;

const TableSkeleton = () => (
    <div className="p-6">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} className="mb-2" />
        ))}
    </div>
);

const formatCurrency = (amount) => { 
    const n = Number(amount); 
    if (isNaN(n)) return '₹0.00'; 
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n); 
};

const StatusBadge = ({ status }) => { 
    if (status === 'COMPLETED') return <span className="text-xs font-semibold text-green-700 italic">Completed</span>; 
    if (status === 'CANCELLED') return <span className="text-xs font-semibold text-red-700 italic">Cancelled</span>; 
    return <span className="text-xs font-semibold text-gray-500 italic">No actions</span>; 
};

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recent');
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filter states
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        dateRange: 'all', // all, today, last7days, last30days, custom
        customDateStart: '',
        customDateEnd: '',
        priceMin: '',
        priceMax: '',
        selectedProducts: [],
        selectedCategories: []
    });
    
    // State for products and categories from API
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    const tabs = [
        { name: 'Recent Orders', key: 'recent' },
        { name: 'All Orders', key: 'all' },
        { name: 'Placed', key: 'placed' },
        { name: 'Completed', key: 'completed' },
    ];

    const tabEndpointMap = {
        recent: '/orders',
        all: '/orders',
        placed: '/order/get-placed',
        completed: '/order/get-completed',
    };

    // Fetch products from API
    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/products`);
                const productsData = response.data.products || response.data || [];
                setProducts(productsData);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Extract unique products and categories from API products
    const { uniqueProducts, uniqueCategories } = useMemo(() => {
        const productNames = new Set();
        const categories = new Set();
        
        products.forEach(product => {
            if (product.prodName) productNames.add(product.prodName);
            if (product.category) categories.add(product.category);
        });
        
        return {
            uniqueProducts: Array.from(productNames).sort(),
            uniqueCategories: Array.from(categories).sort()
        };
    }, [products]);

    const columns = useMemo(() => [
        {
            header: <input type="checkbox" className="rounded" />,
            key: 'checkbox',
            width: '5%',
            render: (row) => <input type="checkbox" className="rounded" />,
        },
        {
            header: 'Orders',
            key: 'productName',
            width: '35%',
            isSortable: true,
            render: (row) => {
                const items = row.items || [];
                if (items.length === 0) return 'No items';

                const firstItem = items[0]?.prodName ?? 'Unknown';

                return (
                    <div className="relative group">
                        <div className="flex items-center gap-2">
                            <span className="truncate">{firstItem}</span>
                            {items.length > 1 && (
                                <span className="text-xs text-gray-500 whitespace-nowrap cursor-pointer">
                                    +{items.length - 1} more
                                </span>
                            )}
                        </div>

                        {items.length > 1 && (
                            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 mt-2 left-0 w-80">
                                <div className="font-semibold text-sm mb-2 text-gray-700">
                                    All Items ({items.length})
                                </div>
                                <ul className="space-y-2 max-h-60 overflow-y-auto">
                                    {items.map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex justify-between">
                                            <span className="flex-1">• {item.prodName}</span>
                                            {item.quantity && (
                                                <span className="text-xs text-gray-500 ml-2">
                                                    Qty: {item.quantity}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Customer',
            key: 'customerName',
            width: '15%',
            isSortable: true,
            render: (row) => row.userId?.name ?? 'Guest User',
        },
        {
            header: 'Amount',
            key: 'amount',
            width: '15%',
            isSortable: true,
            render: (row) => formatCurrency(row.totalPrice?.$numberDecimal ?? row.totalPrice ?? 0),
        },
        {
            header: 'Date',
            key: 'date',
            width: '15%',
            isSortable: true,
            render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A',
        },
        {
            header: 'Action',
            key: 'action',
            width: '15%',
            render: (row) => (
                row.orderStatus === 'PLACED' ? (
                    <>
                        <button onClick={() => handleAccept(row.orderId)} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-1 rounded-md text-xs font-semibold mr-2">Accept</button>
                        <button onClick={() => handleReject(row.orderId)} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-1 rounded-md text-xs">Reject</button>
                    </>
                ) : (
                    <StatusBadge status={row.orderStatus} />
                )
            ),
        },
    ], []);

    const shopId = localStorage.getItem('selectedShop');
    
    const fetchOrders = useCallback(async () => { 
        setLoading(true); 
        setError(null); 
        try { 
            const endpoint = tabEndpointMap[activeTab]; 
            const response = await axios.get(`${API_URL}${endpoint}/${shopId}`); 
            const ordersData = response.data.orders || response.data || []; 
            setOrders(ordersData); 
        } catch (err) { 
            console.error(`Failed to fetch orders from ${activeTab} tab:`, err); 
            setError("Could not load order data. Please try again."); 
        } finally { 
            setLoading(false); 
        } 
    }, [activeTab]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleAccept = async (orderId) => { 
        try { 
            await axios.patch(`${API_URL}/order/complete/${shopId}/${orderId}`); 
            fetchOrders(); 
        } catch (err) { 
            console.error(`Error accepting order ${orderId}:`, err); 
        } 
    };

    const handleReject = (orderId) => { 
        console.log(`Rejecting order ${orderId}`); 
    };

    const handleSort = (key) => { 
        setSortConfig(prev => ({ 
            key, 
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' 
        })); 
    };

    // Apply filters to orders
    const applyFilters = (ordersList) => {
        return ordersList.filter(order => {
            // Date range filter
            if (filters.dateRange !== 'all' && order.createdAt) {
                const orderDate = new Date(order.createdAt);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (filters.dateRange) {
                    case 'today':
                        if (orderDate < today) return false;
                        break;
                    case 'last7days':
                        const last7Days = new Date(today);
                        last7Days.setDate(last7Days.getDate() - 7);
                        if (orderDate < last7Days) return false;
                        break;
                    case 'last30days':
                        const last30Days = new Date(today);
                        last30Days.setDate(last30Days.getDate() - 30);
                        if (orderDate < last30Days) return false;
                        break;
                    case 'custom':
                        if (filters.customDateStart) {
                            const startDate = new Date(filters.customDateStart);
                            if (orderDate < startDate) return false;
                        }
                        if (filters.customDateEnd) {
                            const endDate = new Date(filters.customDateEnd);
                            endDate.setHours(23, 59, 59, 999);
                            if (orderDate > endDate) return false;
                        }
                        break;
                }
            }

            // Price range filter
            const orderPrice = parseFloat(order.totalPrice?.$numberDecimal ?? order.totalPrice ?? 0);
            if (filters.priceMin && orderPrice < parseFloat(filters.priceMin)) return false;
            if (filters.priceMax && orderPrice > parseFloat(filters.priceMax)) return false;

            // Product filter
            if (filters.selectedProducts.length > 0) {
                const orderProducts = order.items?.map(item => item.prodName) || [];
                const hasMatchingProduct = filters.selectedProducts.some(product => 
                    orderProducts.includes(product)
                );
                if (!hasMatchingProduct) return false;
            }

            // Category filter - match by product name first, then find its category
            if (filters.selectedCategories.length > 0) {
                const orderProductNames = order.items?.map(item => item.prodName) || [];
                const hasMatchingCategory = orderProductNames.some(prodName => {
                    const product = products.find(p => p.prodName === prodName);
                    return product && filters.selectedCategories.includes(product.category);
                });
                if (!hasMatchingCategory) return false;
            }

            return true;
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleProductToggle = (product) => {
        setFilters(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.includes(product)
                ? prev.selectedProducts.filter(p => p !== product)
                : [...prev.selectedProducts, product]
        }));
    };

    const handleCategoryToggle = (category) => {
        setFilters(prev => ({
            ...prev,
            selectedCategories: prev.selectedCategories.includes(category)
                ? prev.selectedCategories.filter(c => c !== category)
                : [...prev.selectedCategories, category]
        }));
    };

    const clearFilters = () => {
        setFilters({
            dateRange: 'all',
            customDateStart: '',
            customDateEnd: '',
            priceMin: '',
            priceMax: '',
            selectedProducts: [],
            selectedCategories: []
        });
    };

    const handleExport = () => {
        // Get the filtered and sorted orders (not paginated)
        let exportData = [...orders];
        
        // Apply filters
        exportData = applyFilters(exportData);
        
        // Apply search
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            exportData = exportData.filter(order =>
                (order.userId?.name?.toLowerCase().includes(lowercasedFilter)) ||
                (order.items?.some(item => item.prodName?.toLowerCase().includes(lowercasedFilter))) ||
                (order.orderId?.toLowerCase().includes(lowercasedFilter))
            );
        }

        // Create CSV content
        const headers = ['Order ID', 'Customer Name', 'Products', 'Total Amount', 'Order Date', 'Status'];
        const csvRows = [headers.join(',')];

        exportData.forEach(order => {
            const orderId = order.orderId || 'N/A';
            const customerName = order.userId?.name || 'Guest User';
            const products = order.items?.map(item => `${item.prodName}${item.quantity ? ` (x${item.quantity})` : ''}`).join('; ') || 'No items';
            const amount = order.totalPrice?.$numberDecimal ?? order.totalPrice ?? 0;
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
            const status = order.orderStatus || 'N/A';

            // Escape commas and quotes in data
            const row = [
                `"${orderId}"`,
                `"${customerName}"`,
                `"${products}"`,
                amount,
                `"${date}"`,
                `"${status}"`
            ];
            csvRows.push(row.join(','));
        });

        // Create blob and download
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const hasActiveFilters = () => {
        return filters.dateRange !== 'all' || 
               filters.priceMin || 
               filters.priceMax || 
               filters.selectedProducts.length > 0 || 
               filters.selectedCategories.length > 0;
    };

    const processedOrders = useMemo(() => { 
        let filteredItems = [...orders];
        
        // Apply filters first
        filteredItems = applyFilters(filteredItems);
        
        // Then apply search
        if (searchTerm) { 
            const lowercasedFilter = searchTerm.toLowerCase(); 
            filteredItems = filteredItems.filter(order => 
                (order.userId?.name?.toLowerCase().includes(lowercasedFilter)) || 
                (order.items?.some(item => item.prodName?.toLowerCase().includes(lowercasedFilter))) ||
                (order.orderId?.toLowerCase().includes(lowercasedFilter))
            ); 
        } 
        
        // Then apply sorting
        if (sortConfig.key) { 
            filteredItems.sort((a, b) => { 
                let aValue, bValue; 
                switch (sortConfig.key) { 
                    case 'customerName': 
                        aValue = a.userId?.name?.toLowerCase() ?? ''; 
                        bValue = b.userId?.name?.toLowerCase() ?? ''; 
                        break; 
                    case 'productName': 
                        aValue = a.items?.[0]?.prodName?.toLowerCase() ?? ''; 
                        bValue = b.items?.[0]?.prodName?.toLowerCase() ?? ''; 
                        break; 
                    case 'amount': 
                        aValue = parseFloat(a.totalPrice?.$numberDecimal ?? a.totalPrice ?? 0); 
                        bValue = parseFloat(b.totalPrice?.$numberDecimal ?? b.totalPrice ?? 0); 
                        break; 
                    case 'date': 
                        aValue = a.createdAt ?? ''; 
                        bValue = b.createdAt ?? ''; 
                        break; 
                    default: 
                        return 0; 
                } 
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1; 
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1; 
                return 0; 
            }); 
        } 
        
        setPagination(prev => ({ 
            ...prev, 
            totalItems: filteredItems.length, 
            totalPages: Math.ceil(filteredItems.length / ITEMS_PER_PAGE), 
        })); 
        
        const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE; 
        const endIndex = startIndex + ITEMS_PER_PAGE; 
        return filteredItems.slice(startIndex, endIndex); 
    }, [orders, searchTerm, sortConfig, pagination.currentPage, filters]);

    return (
        <div className="space-y-4 bg-background">
            <div>
                <h1 className="text-3xl font-bold text-text-dark mt-1">Orders</h1>
            </div>

            <div className="rounded-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="relative w-full md:w-1/3">
                        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-text-light" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for id, name, product"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50 ${hasActiveFilters() ? 'bg-blue-50 border-blue-500 text-blue-700' : ''}`}
                        >
                            <FiFilter /> 
                            Filter
                            {hasActiveFilters() && (
                                <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {[
                                        filters.dateRange !== 'all' ? 1 : 0,
                                        filters.priceMin || filters.priceMax ? 1 : 0,
                                        filters.selectedProducts.length,
                                        filters.selectedCategories.length
                                    ].reduce((a, b) => a + b, 0)}
                                </span>
                            )}
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-gray-50">
                            <FiDownload /> Export
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilterPanel && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                            <div className="flex gap-2">
                                {hasActiveFilters() && (
                                    <button 
                                        onClick={clearFilters}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button onClick={() => setShowFilterPanel(false)}>
                                    <FiX className="text-gray-500 hover:text-gray-700" size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                                <select
                                    value={filters.dateRange}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="last7days">Last 7 Days</option>
                                    <option value="last30days">Last 30 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>

                                {filters.dateRange === 'custom' && (
                                    <div className="mt-3 space-y-2">
                                        <input
                                            type="date"
                                            value={filters.customDateStart}
                                            onChange={(e) => handleFilterChange('customDateStart', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="Start Date"
                                        />
                                        <input
                                            type="date"
                                            value={filters.customDateEnd}
                                            onChange={(e) => handleFilterChange('customDateEnd', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                            placeholder="End Date"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Price Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                                <div className="space-y-2">
                                    <input
                                        type="number"
                                        value={filters.priceMin}
                                        onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                                        placeholder="Min Price"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <input
                                        type="number"
                                        value={filters.priceMax}
                                        onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                                        placeholder="Max Price"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {/* Product Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Products {filters.selectedProducts.length > 0 && `(${filters.selectedProducts.length})`}
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {productsLoading ? (
                                        <p className="text-sm text-gray-500">Loading products...</p>
                                    ) : uniqueProducts.length === 0 ? (
                                        <p className="text-sm text-gray-500">No products available</p>
                                    ) : (
                                        uniqueProducts.map(product => (
                                            <label key={product} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.selectedProducts.includes(product)}
                                                    onChange={() => handleProductToggle(product)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-gray-700">{product}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categories {filters.selectedCategories.length > 0 && `(${filters.selectedCategories.length})`}
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {productsLoading ? (
                                        <p className="text-sm text-gray-500">Loading categories...</p>
                                    ) : uniqueCategories.length === 0 ? (
                                        <p className="text-sm text-gray-500">No categories available</p>
                                    ) : (
                                        uniqueCategories.map(category => (
                                            <label key={category} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.selectedCategories.includes(category)}
                                                    onChange={() => handleCategoryToggle(category)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-gray-700">{category}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
            </div>

            <div className="bg-background rounded-xl shadow-md flex flex-col" style={{ height: 'calc(100vh - 20rem)' }}>
                <div className="flex-grow">
                    {loading ? (
                        <TableSkeleton />
                    ) : error ? (
                        <div className="text-center py-10 text-danger">{error}</div>
                    ) : (
                        <Table
                            data={processedOrders}
                            columns={columns}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                    )}
                </div>

                {!loading && !error && orders.length > 0 && (
                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={(page) => setPagination(p => ({ ...p, currentPage: page }))}
                    />
                )}
            </div>
        </div>
    );
};

export default Orders;