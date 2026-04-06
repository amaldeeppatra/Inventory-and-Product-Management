import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import Table from '../../Table';
import Modal from '../../Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatDecimal = (decimalValue) => {
    if (!decimalValue) return 0;
    if (typeof decimalValue === 'object' && decimalValue.$numberDecimal) {
        return parseFloat(decimalValue.$numberDecimal);
    }
    const num = parseFloat(decimalValue);
    return isNaN(num) ? 0 : num;
};

const EditShopInventory = ({ shopId, shopName, onClose }) => {
    const [inventory, setInventory] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: '', data: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [productLoading, setProductLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [shopId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch current inventory
            const inventoryResponse = await axios.get(`${API_URL}/inventory/${shopId}/all`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Fetch all products
            const productsResponse = await axios.get(`${API_URL}/products`);

            const currentInventory = inventoryResponse.data || [];
            const allProds = (productsResponse.data.products || productsResponse.data || []).map(product => ({
                ...product,
                price: formatDecimal(product.price)
            }));

            // Transform inventory data to include product details
            const transformedInventory = currentInventory.map(item => ({
                _id: item._id,
                prodId: item.productId?.prodId || item.prodId,
                prodName: item.productId?.prodName || item.prodName,
                category: item.productId?.category || item.category,
                price: formatDecimal(item.productId?.price || item.price),
                stock: item.onHand || item.stock || 0
            }));

            setInventory(transformedInventory);
            setAllProducts(allProds);

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load inventory data. Please try again.');
        } finally {
            setLoading(false);
            setProductLoading(false);
        }
    };

    const handleAddProduct = (product) => {
        setModal({
            isOpen: true,
            type: 'add_product',
            data: product,
            title: 'Add Product to Inventory',
            message: `Add "${product.prodName}" to ${shopName}'s inventory?`,
            confirmText: 'Add Product',
            confirmColor: 'bg-green-600 hover:bg-green-700'
        });
    };

    const handleUpdateStock = (inventoryItem) => {
        setModal({
            isOpen: true,
            type: 'update_stock',
            data: inventoryItem,
            title: 'Update Stock Quantity',
            initialQuantity: inventoryItem.stock,
            confirmText: 'Update Stock',
            confirmColor: 'bg-blue-600 hover:bg-blue-700'
        });
    };

    const handleRemoveProduct = (inventoryItem) => {
        setModal({
            isOpen: true,
            type: 'remove_product',
            data: inventoryItem,
            title: 'Remove Product from Inventory',
            message: `Are you sure you want to completely remove "${inventoryItem.prodName}" from ${shopName}'s inventory? This action cannot be undone.`,
            confirmText: 'Remove Product',
            confirmColor: 'bg-red-600 hover:bg-red-700'
        });
    };

    const handleConfirmAction = async () => {
        const { type, data } = modal;
        try {
            if (type === 'add_product') {
                await axios.post(`${API_URL}/inventory/add`, {
                    shopId,
                    prodId: data.prodId,
                    stock: 0 // Start with 0 stock
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (type === 'update_stock') {
                const newStock = parseInt(modal.newQuantity);
                if (isNaN(newStock) || newStock < 0) {
                    throw new Error('Invalid stock quantity');
                }
                await axios.put(`${API_URL}/inventory/update/${data._id}`, {
                    stock: newStock
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (type === 'remove_product') {
                await axios.delete(`${API_URL}/inventory/remove/${data._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }

            fetchData(); // Refresh data
            setModal({ isOpen: false, type: '', data: null });
        } catch (err) {
            console.error(`Failed to ${type}:`, err);
            setModal({
                ...modal,
                message: `Failed to ${type.replace('_', ' ')}. Please try again.`,
                confirmText: 'Retry',
                onConfirm: () => handleConfirmAction()
            });
        }
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false, type: '', data: null });
    };

    const filteredProducts = allProducts.filter(product =>
        product.prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.prodId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isProductInInventory = (prodId) => {
        return inventory.some(item => item.prodId === prodId);
    };

    const inventoryColumns = [
        {
            key: 'prodId',
            header: 'Product ID',
            render: (item) => <span className="font-mono text-sm">{item.prodId}</span>
        },
        {
            key: 'prodName',
            header: 'Product Name',
            render: (item) => <span className="font-medium">{item.prodName}</span>
        },
        {
            key: 'category',
            header: 'Category',
            render: (item) => <span className="text-gray-600">{item.category}</span>
        },
        {
            key: 'stock',
            header: 'Current Stock',
            render: (item) => (
                <span className={`font-semibold ${item.stock <= 10 ? 'text-red-600' : item.stock <= 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {item.stock}
                </span>
            )
        },
        {
            key: 'price',
            header: 'Price',
            render: (item) => <span className="font-semibold text-primary">₹{formatDecimal(item.price).toFixed(2)}</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (item) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleUpdateStock(item)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Update Stock"
                    >
                        <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleRemoveProduct(item)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove Product"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
            sortable: false
        }
    ];

    const availableColumns = [
        {
            key: 'prodId',
            header: 'Product ID',
            render: (product) => <span className="font-mono text-sm">{product.prodId}</span>
        },
        {
            key: 'prodName',
            header: 'Product Name',
            render: (product) => <span className="font-medium">{product.prodName}</span>
        },
        {
            key: 'category',
            header: 'Category',
            render: (product) => <span className="text-gray-600">{product.category}</span>
        },
        {
            key: 'price',
            header: 'Price',
            render: (product) => <span className="font-semibold text-primary">₹{formatDecimal(product.price).toFixed(2)}</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (product) => {
                const inInventory = isProductInInventory(product.prodId);
                return (
                    <button
                        onClick={() => inInventory ? handleRemoveProduct(inventory.find(item => item.prodId === product.prodId)) : handleAddProduct(product)}
                        className={`p-1 ${inInventory ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        title={inInventory ? 'Remove from Inventory' : 'Add to Inventory'}
                    >
                        {inInventory ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                    </button>
                );
            },
            sortable: false
        }
    ];

    if (loading) {
        return (
            <div className="p-6 bg-background rounded-xl border border-gray-200">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-background rounded-xl border border-gray-200">
                <div className="text-red-500 text-center py-8">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-background rounded-xl border border-gray-200 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-text-dark">Edit Inventory - {shopName}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 p-2"
                    title="Close"
                >
                    ✕
                </button>
            </div>

            {/* Current Inventory Section */}
            <div className="mb-8">
                <h3 className="text-lg font-medium text-text-dark mb-4">Current Inventory ({inventory.length} products)</h3>
                {inventory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No products in inventory yet.</p>
                ) : (
                    <Table
                        data={inventory}
                        columns={inventoryColumns}
                        onSort={() => {}} // No sorting needed
                        sortConfig={{ key: null, direction: 'ascending' }}
                    />
                )}
            </div>

            {/* Add Products Section */}
            <div>
                <h3 className="text-lg font-medium text-text-dark mb-4">Add Products to Inventory</h3>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder={productLoading ? 'Loading products...' : 'Search products...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={productLoading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-light bg-[#FAF7E7] disabled:cursor-not-allowed disabled:opacity-60"
                    />
                </div>

                {productLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No products found matching your search.
                    </p>
                ) : (
                    <Table
                        data={filteredProducts}
                        columns={availableColumns}
                        onSort={() => {}} // No sorting needed
                        sortConfig={{ key: null, direction: 'ascending' }}
                    />
                )}
            </div>

            {/* Modal for confirmations and stock updates */}
            <Modal
                isOpen={modal.isOpen}
                onClose={handleCloseModal}
                title={modal.title}
                size={modal.type === 'update_stock' ? 'sm' : 'md'}
            >
                <div className="p-4">
                    {modal.type === 'update_stock' ? (
                        <div>
                            <p className="text-gray-700 mb-4">
                                Update stock quantity for "{modal.data?.prodName}":
                            </p>
                            <input
                                type="number"
                                min="0"
                                defaultValue={modal.initialQuantity}
                                onChange={(e) => setModal(prev => ({ ...prev, newQuantity: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                                placeholder="Enter new stock quantity"
                            />
                        </div>
                    ) : (
                        <p className="text-gray-700 mb-6">{modal.message}</p>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmAction}
                            className={`px-4 py-2 text-white rounded-lg transition-colors ${modal.confirmColor || 'bg-primary hover:bg-opacity-90'}`}
                        >
                            {modal.confirmText || 'Confirm'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EditShopInventory;