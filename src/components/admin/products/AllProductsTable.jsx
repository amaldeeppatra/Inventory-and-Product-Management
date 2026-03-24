import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { FiSearch, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import Table from '../../Table';
import Pagination from '../../Pagination';
import Skeleton from '@mui/material/Skeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ITEMS_PER_PAGE = 8;

const TableSkeleton = () => (
    <div className="p-6">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} className="mb-2" />
        ))}
    </div>
);

const formatDecimal = (decimalValue) => {
    if (!decimalValue) return 0;
    if (typeof decimalValue === 'object' && decimalValue.$numberDecimal) {
        return parseFloat(decimalValue.$numberDecimal);
    }
    const num = parseFloat(decimalValue);
    return isNaN(num) ? 0 : num;
};

const AllProductsTable = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'prodId', direction: 'ascending' });
    const [searchTerm, setSearchTerm] = useState('');

    const [editingRowId, setEditingRowId] = useState(null);
    const [editedData, setEditedData] = useState({});
    
    const nameInputRef = useRef(null);

    const fetchProducts = useCallback(async () => { 
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/products`);
            setProducts(response.data.products || response.data || []);
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError("Could not load product data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { if (editingRowId && nameInputRef.current) { nameInputRef.current.focus(); } }, [editingRowId]);

    const handleEditClick = (product) => {
        setEditingRowId(product.prodId);
        setEditedData({ ...product, price: formatDecimal(product.price), rating: formatDecimal(product.rating) });
     };
    const handleCancelEdit = () => { setEditingRowId(null); setEditedData({}); };
    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const parsedValue = type === 'number' ? parseFloat(value) : value;
        setEditedData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleUpdate = async (productId) => {
        const payload = { ...editedData };
        delete payload._id;
        delete payload.prodId; 
        
        try {
            await axios.patch(`${API_URL}/product/${productId}`, payload);
            setEditingRowId(null);
            fetchProducts();
        } catch (err) {
            console.error(`Failed to update product ${productId}:`, err);
            alert("Failed to update product. Please check the console for details.");
        }
    };

    const handleDelete = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            try {
                await axios.delete(`${API_URL}/product/delete/${productId}`);
                fetchProducts();
            } catch (err) {
                console.error(`Failed to delete product ${productId}:`, err);
                alert("Failed to delete product. Please try again.");
            }
        }
     };
    const handleSort = (key) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
     };
    const processedProducts = useMemo(() => {
        let filteredItems = [...products];
        if (searchTerm) {
             const lowercasedFilter = searchTerm.toLowerCase();
            filteredItems = filteredItems.filter(product =>
                product.prodName.toLowerCase().includes(lowercasedFilter) ||
                product.prodId.toLowerCase().includes(lowercasedFilter) ||
                (product.category && product.category.toLowerCase().includes(lowercasedFilter))
            );
        }
        if (sortConfig.key) {
            filteredItems.sort((a, b) => {
                 const aValue = a[sortConfig.key], bValue = b[sortConfig.key], direction = sortConfig.direction === 'ascending' ? 1 : -1;
                 if (sortConfig.key === 'price' || sortConfig.key === 'rating' || sortConfig.key === 'stock') { const numA = formatDecimal(aValue), numB = formatDecimal(bValue); return (numA - numB) * direction; }
                 if (aValue && bValue) { return aValue.toString().localeCompare(bValue.toString(), undefined, { numeric: true }) * direction; }
                 return 0;
            });
        }
        setPagination(prev => ({ ...prev, totalItems: filteredItems.length, totalPages: Math.ceil(filteredItems.length / ITEMS_PER_PAGE) }));
        const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [products, searchTerm, sortConfig, pagination.currentPage]);

    // Reusable class for editing inputs with the new background color
    const inputClass = "w-full px-2 py-1 border border-gray-300 rounded-md bg-[#FAF7E7] focus:outline-none focus:ring-2 focus:ring-accent text-sm";

    const columns = useMemo(() => [
        {
            header: 'Image', key: 'prodImg', width: '15%',
            render: (row) => editingRowId === row.prodId
                ? <input type="text" name="prodImg" value={editedData.prodImg || ''} onChange={handleInputChange} className={inputClass} placeholder="Image URL" />
                : <img src={row.prodImg || 'https://via.placeholder.com/40'} alt={row.prodName} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
        },
        { header: 'Product ID', key: 'prodId', width: '15%', isSortable: true },
        {
            header: 'Name', key: 'prodName', width: '20%', isSortable: true,
            render: (row) => editingRowId === row.prodId
                ? <input type="text" name="prodName" value={editedData.prodName || ''} onChange={handleInputChange} className={inputClass} ref={nameInputRef} />
                : row.prodName
        },
        {
            header: 'Category', key: 'category', width: '15%', isSortable: true,
            render: (row) => editingRowId === row.prodId ? <input type="text" name="category" value={editedData.category || ''} onChange={handleInputChange} className={inputClass} /> : row.category
        },
        {
            header: 'Price', key: 'price', width: '10%', isSortable: true,
            render: (row) => editingRowId === row.prodId ? <input type="number" name="price" value={editedData.price || ''} onChange={handleInputChange} className={inputClass} /> : `₹${formatDecimal(row.price).toFixed(2)}`
        },
        // {
        //     header: 'Stock', key: 'stock', width: '10%', isSortable: true,
        //     render: (row) => editingRowId === row.prodId ? <input type="number" name="stock" value={editedData.stock || ''} onChange={handleInputChange} className={inputClass} /> : <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.stock}</span>
        // },
        { header: 'Rating', key: 'rating', width: '10%', isSortable: true, render: (row) => <span className="flex items-center">{formatDecimal(row.rating).toFixed(1)} <span className="ml-1 text-yellow-500">★</span></span> },
        {
            header: 'Actions', key: 'actions', width: '10%',
            render: (row) => (
                <div className="flex space-x-3">
                    {editingRowId === row.prodId ? (
                        <> <button onClick={() => handleUpdate(row.prodId)} className="text-green-600 hover:text-green-800"><FiCheck size={18} /></button> <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-800"><FiX size={18} /></button> </>
                    ) : (
                        <> <button onClick={() => handleEditClick(row)} className="text-gray-600 hover:text-accent"><FiEdit size={18} /></button> <button onClick={() => handleDelete(row.prodId, row.prodName)} className="text-red-600 hover:text-red-800"><FiTrash2 size={18} /></button> </>
                    )}
                </div>
            ),
        },
    ], [editingRowId, editedData, handleDelete]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="relative w-full md:w-2/5">
                    <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-text-light" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search for id, name, category" className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none" />
                </div>
            </div>
            {/* ======================= COLOR CHANGE HERE ======================= */}
            <div className="bg-[#FAF7E7] rounded-xl shadow-md flex flex-col" style={{ height: 'calc(100vh - 20rem)' }}>
                <div className="flex-grow">
                    {loading ? <TableSkeleton /> : error ? <div className="text-center py-10 text-red-500">{error}</div> :
                        <Table data={processedProducts} columns={columns} onSort={handleSort} sortConfig={sortConfig} />
                    }
                </div>
                {!loading && !error && products.length > 0 && (
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} totalItems={pagination.totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={(page) => setPagination(p => ({ ...p, currentPage: page }))} />
                )}
            </div>
        </div>
    );
};

export default AllProductsTable;