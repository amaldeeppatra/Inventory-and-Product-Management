import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FiSearch, FiFilter, FiDownload, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import Table from '../../Table';
import Pagination from '../../Pagination';
import Skeleton from '@mui/material/Skeleton';
import Cookies from 'js-cookie';
import ParseJwt from '../../../utils/ParseJWT';

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 8;

const TableSkeleton = () => (
    <div className="p-6">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} className="mb-2" />
        ))}
    </div>
);

const StockStatusBadge = ({ stock }) => {
    if (stock <= 0) {
        return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Out of Stock</span>;
    }
    if (stock <= 10) {
        return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Low Stock</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">In Stock</span>;
};

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'stock', direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({});
    const [userInfo, setUserInfo] = useState(null);
    const [sellerId, setSellerId] = useState(null);
    const [quantity, setQuantity] = useState({});
    const [requestStatus, setRequestStatus] = useState({});

    // Filter states
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        selectedCategories: [],
        selectedStatuses: [],
        stockMin: '',
        stockMax: ''
    });

    const handleQuantityChange = (prodId, quantity) => {
        setQuantity(prev => ({
            ...prev,
            [prodId]: quantity
        }));
    }

    const handleMessageChange = (prodId, message) => {
        setMessage(prev => ({
            ...prev,
            [prodId]: message
        }));
    };

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const shopId = localStorage.getItem("selectedShop");
            if (!shopId) {
                setError("Please select a shop first");
                setLoading(false);
                return;
            }
            const response = await axios.get(`${API_URL}/inventory/${shopId}/all`);
            const inventoryData = response.data;
            const mapped = inventoryData.map(item => ({
                ...item,
                prodId: item.productId?.prodId,
                prodName: item.productId?.prodName,
                prodImg: item.productId?.prodImg,
                category: item.productId?.category,
                price: item.productId?.price?.$numberDecimal
                    ? Number(item.productId.price.$numberDecimal)
                    : item.productId?.price,
                stock: item.onHand,
            }));

            setProducts(mapped);
        } catch (err) {
            console.error("Failed to fetch inventory:", err);
            setError("Could not load inventory data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    useEffect(() => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded = ParseJwt(token);
                setUserInfo(decoded);
                const idFromToken = decoded?.user?._id || decoded?.id;
                setSellerId(idFromToken);
            } catch (error) {
                console.error("Error decoding token:", error);
            }
        }
    }, []);

    const sendRequest = async (prodId) => {
        const shopId = localStorage.getItem("selectedShop");
        try {
            setRequestStatus(prev => ({
                ...prev,
                [prodId]: 'sending'
            }));

            const response = await axios.post(`${API_URL}/request/${sellerId}`, {
                prodId,
                shopId,
                message: message[prodId] || '',
                quantity: parseInt(quantity[prodId]) || 1
            });

            setRequestStatus(prev => ({
                ...prev,
                [prodId]: 'sent'
            }));

            setMessage(prev => ({
                ...prev,
                [prodId]: ''
            }));
            setQuantity(prev => ({
                ...prev,
                [prodId]: ''
            }));

        } catch (error) {
            console.error("Error sending request:", error);

            setRequestStatus(prev => ({
                ...prev,
                [prodId]: 'error'
            }));

            setTimeout(() => {
                setRequestStatus(prev => ({
                    ...prev,
                    [prodId]: null
                }));
            }, 3000);
        }
    }

    // Get unique categories from products
    const uniqueCategories = useMemo(() => {
        const categories = new Set();
        products.forEach(product => {
            if (product.category) categories.add(product.category);
        });
        return Array.from(categories).sort();
    }, [products]);

    // Stock status options
    const stockStatuses = [
        { label: 'In Stock', value: 'in-stock', check: (stock) => stock > 10 },
        { label: 'Low Stock', value: 'low-stock', check: (stock) => stock > 0 && stock <= 10 },
        { label: 'Out of Stock', value: 'out-of-stock', check: (stock) => stock <= 0 }
    ];

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleCategoryToggle = (category) => {
        setFilters(prev => ({
            ...prev,
            selectedCategories: prev.selectedCategories.includes(category)
                ? prev.selectedCategories.filter(c => c !== category)
                : [...prev.selectedCategories, category]
        }));
    };

    const handleStatusToggle = (status) => {
        setFilters(prev => ({
            ...prev,
            selectedStatuses: prev.selectedStatuses.includes(status)
                ? prev.selectedStatuses.filter(s => s !== status)
                : [...prev.selectedStatuses, status]
        }));
    };

    const clearFilters = () => {
        setFilters({
            selectedCategories: [],
            selectedStatuses: [],
            stockMin: '',
            stockMax: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.selectedCategories.length > 0 ||
            filters.selectedStatuses.length > 0 ||
            filters.stockMin ||
            filters.stockMax;
    };

    // Apply filters to products
    const applyFilters = (productsList) => {
        return productsList.filter(product => {
            // Category filter
            if (filters.selectedCategories.length > 0) {
                if (!filters.selectedCategories.includes(product.category)) {
                    return false;
                }
            }

            // Status filter
            if (filters.selectedStatuses.length > 0) {
                const matchesStatus = filters.selectedStatuses.some(statusValue => {
                    const status = stockStatuses.find(s => s.value === statusValue);
                    return status && status.check(product.stock);
                });
                if (!matchesStatus) return false;
            }

            // Stock quantity filter
            const stock = product.stock || 0;
            if (filters.stockMin && stock < parseInt(filters.stockMin)) return false;
            if (filters.stockMax && stock > parseInt(filters.stockMax)) return false;

            return true;
        });
    };

    const handleExport = () => {
        // Get the filtered and sorted products
        let exportData = [...products];

        // Apply filters
        exportData = applyFilters(exportData);

        // Apply search
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            exportData = exportData.filter(p =>
                (p.prodName?.toLowerCase().includes(lowercasedFilter)) ||
                (p.category?.toLowerCase().includes(lowercasedFilter)) ||
                (p.prodId?.toLowerCase().includes(lowercasedFilter))
            );
        }

        // Create CSV content
        const headers = ['Product ID', 'Product Name', 'Category', 'Stock Quantity', 'Status'];
        const csvRows = [headers.join(',')];

        exportData.forEach(product => {
            const prodId = product.prodId || 'N/A';
            const prodName = product.prodName || 'N/A';
            const category = product.category || 'N/A';
            const stock = product.stock || 0;
            let status = 'In Stock';
            if (stock <= 0) status = 'Out of Stock';
            else if (stock <= 10) status = 'Low Stock';

            const row = [
                `"${prodId}"`,
                `"${prodName}"`,
                `"${category}"`,
                stock,
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
        link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = useMemo(() => [
        {
            header: <input type="checkbox" className="rounded" />,
            key: 'checkbox',
            width: '5%',
            render: (row) => <input type="checkbox" className="rounded" />,
        },
        {
            header: 'Items',
            key: 'prodName',
            width: '25%',
            isSortable: true,
            render: (row) => (
                <div className="flex items-center gap-3">
                    <img src={row.prodImg} alt={row.prodName} className="w-10 h-10 object-cover rounded-md" />
                    <span className="font-medium">{row.prodName}</span>
                </div>
            ),
        },
        {
            header: 'Category',
            key: 'category',
            width: '10%',
            isSortable: true,
            render: (row) => row.category,
        },
        {
            header: 'Status',
            key: 'status',
            width: '10%',
            isSortable: true,
            render: (row) => <StockStatusBadge stock={row.stock} />,
        },
        {
            header: 'Qty in Stock',
            key: 'stock',
            width: '10%',
            isSortable: true,
            render: (row) => row.stock,
        },
        {
            header: 'Qty to Request',
            key: 'quantity',
            width: '15%',
            render: (row) => (
                <input
                    type="number"
                    placeholder='Enter quantity'
                    value={quantity[row.prodId] || ''}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    onChange={(e) => handleQuantityChange(row.prodId, e.target.value)}
                    disabled={requestStatus[row.prodId] === 'sent'}
                />
            ),
        },
        {
            header: 'Message',
            key: 'message',
            width: '15%',
            render: (row) => (<textarea
                rows="2"
                placeholder='Write a message...'
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                value={message[row.prodId] || ''}
                onChange={(e) => handleMessageChange(row.prodId, e.target.value)}
                disabled={requestStatus[row.prodId] === 'sent'}
            />),
        },
        {
            header: 'Action',
            key: 'action',
            width: '15%',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        className={`px-4 py-2 rounded-md transition-colors ${requestStatus[row.prodId] === 'sent'
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : requestStatus[row.prodId] === 'sending'
                                    ? 'bg-blue-300 text-blue-800 cursor-wait'
                                    : requestStatus[row.prodId] === 'error'
                                        ? 'bg-red-300 text-red-800'
                                        : 'bg-accent hover:bg-secondary'
                            }`}
                        onClick={() => sendRequest(row.prodId)}
                        disabled={requestStatus[row.prodId] === 'sent' || requestStatus[row.prodId] === 'sending'}
                    >
                        {requestStatus[row.prodId] === 'sent'
                            ? 'Request Sent'
                            : requestStatus[row.prodId] === 'sending'
                                ? 'Sending...'
                                : requestStatus[row.prodId] === 'error'
                                    ? 'Failed - Retry'
                                    : 'Send Request'}
                    </button>
                </div>
            ),
        },
    ], [message, quantity, requestStatus]);

    const processedData = useMemo(() => {
        let filteredItems = [...products];

        // Apply filters first
        filteredItems = applyFilters(filteredItems);

        // Filter by search term
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredItems = filteredItems.filter(p =>
                (p.prodName?.toLowerCase().includes(lowercasedFilter)) ||
                (p.category?.toLowerCase().includes(lowercasedFilter)) ||
                (p.prodId?.toLowerCase().includes(lowercasedFilter))
            );
        }

        // Sort items
        if (sortConfig.key) {
            filteredItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredItems;
    }, [products, searchTerm, sortConfig, filters]);

    useEffect(() => {
        setTotalItems(processedData.length);
        setTotalPages(Math.ceil(processedData.length / ITEMS_PER_PAGE));
        if (currentPage > Math.ceil(processedData.length / ITEMS_PER_PAGE) && processedData.length > 0) {
            setCurrentPage(1);
        }
    }, [processedData.length, currentPage]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return processedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [processedData, currentPage]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold text-text-dark mt-1">Inventory</h1>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative w-1/3">
                    <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
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
                                    filters.selectedCategories.length,
                                    filters.selectedStatuses.length,
                                    filters.stockMin || filters.stockMax ? 1 : 0
                                ].reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categories {filters.selectedCategories.length > 0 && `(${filters.selectedCategories.length})`}
                            </label>
                            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                                {uniqueCategories.length === 0 ? (
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

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Stock Status {filters.selectedStatuses.length > 0 && `(${filters.selectedStatuses.length})`}
                            </label>
                            <div className="border border-gray-300 rounded-lg p-3">
                                {stockStatuses.map(status => (
                                    <label key={status.value} className="flex items-center gap-2 py-1 hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedStatuses.includes(status.value)}
                                            onChange={() => handleStatusToggle(status.value)}
                                            className="rounded"
                                        />
                                        <span className="text-sm text-gray-700">{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Stock Quantity Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity Range</label>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={filters.stockMin}
                                    onChange={(e) => handleFilterChange('stockMin', e.target.value)}
                                    placeholder="Min Quantity"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <input
                                    type="number"
                                    value={filters.stockMax}
                                    onChange={(e) => handleFilterChange('stockMax', e.target.value)}
                                    placeholder="Max Quantity"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-background rounded-xl shadow-md flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
                <div className="flex-grow">
                    {loading ? (
                        <TableSkeleton />
                    ) : error ? (
                        <div className="text-center py-10 text-danger">{error}</div>
                    ) : (
                        <Table
                            data={paginatedData}
                            columns={columns}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                        />
                    )}
                </div>

                {!loading && !error && products.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
};

export default Inventory;