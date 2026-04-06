/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FiSearch, FiFilter, FiDownload, FiX } from 'react-icons/fi';
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

const RestockStatusBadge = ({ status }) => {
    switch (status?.toUpperCase()) {
        case 'PENDING':
            return <span className="px-2 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">Pending</span>;
        case 'ACCEPTED':
            return <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Accepted</span>;
        case 'REJECTED':
            return <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Rejected</span>;
        default:
            return <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">{status}</span>;
    }
};

const Restocks = () => {
    const [restockRequests, setRestockRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
    const [searchTerm, setSearchTerm] = useState('');
    const [sellerId, setSellerId] = useState(null);
    
    // Filter states
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [filters, setFilters] = useState({
        selectedCategories: [],
        selectedStatuses: [],
        quantityMin: '',
        quantityMax: ''
    });

    useEffect(() => {
        const token = Cookies.get('token');
        const decoded = token ? ParseJwt(token) : null;
        if (decoded?.user?._id) {
            setSellerId(decoded.user._id);
        }
    }, []);

    const fetchRestockRequests = useCallback(async () => {
        if (!sellerId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/request/getAllRequests/${sellerId}`);
            console.log("Fetched restock requests:", response.data.requests);
            const data = response.data.requests || [];
            const restockOnly = data.filter(request => request.requestType === 'restock');
            setRestockRequests(restockOnly);
        } catch (err) {
            console.error("Failed to fetch restock requests:", err);
            setError("Could not load restock data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [sellerId]);

    useEffect(() => {
        fetchRestockRequests();
    }, [fetchRestockRequests]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
        }));
    };

    // Get unique categories from restock requests
    const uniqueCategories = useMemo(() => {
        const categories = new Set();
        restockRequests.forEach(request => {
            const category = request.prodId?.category || request.product?.category;
            if (category) categories.add(category);
        });
        return Array.from(categories).sort();
    }, [restockRequests]);

    // Status options
    const statusOptions = [
        { label: 'Pending', value: 'PENDING' },
        { label: 'Accepted', value: 'ACCEPTED' },
        { label: 'Rejected', value: 'REJECTED' }
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
            quantityMin: '',
            quantityMax: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.selectedCategories.length > 0 || 
               filters.selectedStatuses.length > 0 || 
               filters.quantityMin || 
               filters.quantityMax;
    };

    // Apply filters to restock requests
    const applyFilters = (requestsList) => {
        return requestsList.filter(request => {
            // Category filter
            if (filters.selectedCategories.length > 0) {
                const category = request.prodId?.category || request.product?.category;
                if (!filters.selectedCategories.includes(category)) {
                    return false;
                }
            }

            // Status filter
            if (filters.selectedStatuses.length > 0) {
                if (!filters.selectedStatuses.includes(request.status?.toUpperCase())) {
                    return false;
                }
            }

            // Quantity filter
            const quantity = request.quantity || request.qty || 0;
            if (filters.quantityMin && quantity < parseInt(filters.quantityMin)) return false;
            if (filters.quantityMax && quantity > parseInt(filters.quantityMax)) return false;

            return true;
        });
    };

    const handleExport = () => {
        // Get the filtered and sorted restock requests
        let exportData = [...restockRequests];
        
        // Apply filters
        exportData = applyFilters(exportData);
        
        // Apply search
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            exportData = exportData.filter(r => {
                const productName = r.prodId?.prodName || r.product?.prodName || '';
                const requestId = r.requestId?.toString() || r._id?.toString() || '';
                const category = r.prodId?.category || r.product?.category || '';
                
                return (
                    productName.toLowerCase().includes(lowercasedFilter) ||
                    requestId.includes(lowercasedFilter) ||
                    category.toLowerCase().includes(lowercasedFilter)
                );
            });
        }

        // Create CSV content
        const headers = ['Request ID', 'Product Name', 'Category', 'Quantity', 'Status'];
        const csvRows = [headers.join(',')];

        exportData.forEach(request => {
            const requestId = request.requestId || request._id || 'N/A';
            const productName = request.prodId?.prodName || request.product?.prodName || 'N/A';
            const category = request.prodId?.category || request.product?.category || 'N/A';
            const quantity = request.quantity || request.qty || 0;
            const status = request.status || 'N/A';

            const row = [
                `"${requestId}"`,
                `"${productName}"`,
                `"${category}"`,
                quantity,
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
        link.setAttribute('download', `restocks_export_${new Date().toISOString().split('T')[0]}.csv`);
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
            header: 'Product',
            key: 'productName',
            width: '30%',
            isSortable: true,
            render: (row) => {
                const productName = row.prodId?.prodName || row.product?.prodName || 'N/A';
                return productName;
            },
        },
        {
            header: 'Request ID',
            key: 'requestId',
            width: '15%',
            isSortable: true,
            render: (row) => `#${row.requestId || row._id}`,
        },
        {
            header: 'Category',
            key: 'category',
            width: '20%',
            isSortable: true,
            render: (row) => {
                const category = row.prodId?.category || row.product?.category || 'N/A';
                return category;
            },
        },
        {
            header: 'No. of Items',
            key: 'quantity',
            width: '15%',
            isSortable: true,
            render: (row) => row.quantity || 'N/A',
        },
        {
            header: 'Status',
            key: 'status',
            width: '15%',
            isSortable: true,
            render: (row) => <RestockStatusBadge status={row.status} />,
        },
    ], []);

    const processedData = useMemo(() => {
        let filteredItems = [...restockRequests];
        
        // Apply filters first
        filteredItems = applyFilters(filteredItems);
        
        // Apply search
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredItems = filteredItems.filter(r => {
                const productName = r.prodId?.prodName || r.product?.prodName || '';
                const requestId = r.requestId?.toString() || r._id?.toString() || '';
                const category = r.prodId?.category || r.product?.category || '';
                
                return (
                    productName.toLowerCase().includes(lowercasedFilter) ||
                    requestId.includes(lowercasedFilter) ||
                    category.toLowerCase().includes(lowercasedFilter)
                );
            });
        }
        
        // Apply sorting
        if (sortConfig.key) {
            filteredItems.sort((a, b) => {
                let aValue, bValue;
                
                switch (sortConfig.key) {
                    case 'productName':
                        aValue = a.prodId?.prodName || a.product?.prodName || '';
                        bValue = b.prodId?.prodName || b.product?.prodName || '';
                        break;
                    case 'category':
                        aValue = a.prodId?.category || a.product?.category || '';
                        bValue = b.prodId?.category || b.product?.category || '';
                        break;
                    case 'quantity':
                        aValue = a.quantity || a.qty || 0;
                        bValue = b.quantity || b.qty || 0;
                        break;
                    default:
                        aValue = a[sortConfig.key];
                        bValue = b[sortConfig.key];
                }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return filteredItems;
    }, [restockRequests, searchTerm, sortConfig, filters]);

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
                <h1 className="text-3xl font-bold text-text-dark mt-1">Restocks</h1>
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
                                    filters.quantityMin || filters.quantityMax ? 1 : 0
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
                                Status {filters.selectedStatuses.length > 0 && `(${filters.selectedStatuses.length})`}
                            </label>
                            <div className="border border-gray-300 rounded-lg p-3">
                                {statusOptions.map(status => (
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

                        {/* Items Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Items Range</label>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={filters.quantityMin}
                                    onChange={(e) => handleFilterChange('quantityMin', e.target.value)}
                                    placeholder="Min Items"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <input
                                    type="number"
                                    value={filters.quantityMax}
                                    onChange={(e) => handleFilterChange('quantityMax', e.target.value)}
                                    placeholder="Max Items"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-background rounded-xl shadow-md flex flex-col" style={{ height: 'calc(100vh - 15rem)' }}>
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

                {!loading && !error && restockRequests.length > 0 && (
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

export default Restocks;