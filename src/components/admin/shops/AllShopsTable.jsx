import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import Modal from '../../Modal';
import EditShopInventory from './EditShopInventory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AllShopsTable = () => {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, type: '', shop: null });
    const [editingInventory, setEditingInventory] = useState(null);

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/shop/all`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShops(response.data.shops || []);
        } catch (err) {
            console.error("Failed to fetch shops:", err);
            setError("Could not load shop data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = (shop) => {
        setModal({
            isOpen: true,
            type: 'deactivate',
            shop,
            title: 'Deactivate Shop',
            message: `Are you sure you want to deactivate "${shop.name}"? This will mark it as inactive but can be reactivated later.`,
            confirmText: 'Deactivate',
            confirmColor: 'bg-yellow-600 hover:bg-yellow-700'
        });
    };

    const handleActivate = (shop) => {
        setModal({
            isOpen: true,
            type: 'activate',
            shop,
            title: 'Activate Shop',
            message: `Are you sure you want to activate "${shop.name}"? This will make the shop active and available for operations.`,
            confirmText: 'Activate',
            confirmColor: 'bg-green-600 hover:bg-green-700'
        });
    };

    const handleDelete = (shop) => {
        setModal({
            isOpen: true,
            type: 'delete',
            shop,
            title: 'Permanently Delete Shop',
            message: `Are you sure you want to permanently delete "${shop.name}"? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            confirmColor: 'bg-red-600 hover:bg-red-700'
        });
    };

    const handleConfirmAction = async () => {
        const { type, shop } = modal;
        try {
            if (type === 'deactivate') {
                await axios.delete(`${API_URL}/shop/delete/${shop._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (type === 'activate') {
                await axios.patch(`${API_URL}/shop/activate/${shop._id}`, {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            } else if (type === 'delete') {
                await axios.delete(`${API_URL}/shop/hard-delete/${shop._id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }
            fetchShops(); // Refresh the list
            setModal({ isOpen: false, type: '', shop: null });
        } catch (err) {
            console.error(`Failed to ${type} shop:`, err);
            setModal({
                ...modal,
                message: `Failed to ${type} shop. Please try again.`,
                confirmText: 'Retry',
                onConfirm: () => handleConfirmAction()
            });
        }
    };

    const handleEditInventory = (shop) => {
        setEditingInventory(shop);
    };

    const handleCloseEditInventory = () => {
        setEditingInventory(null);
    };

    const handleCloseModal = () => {
        setModal({ isOpen: false, type: '', shop: null });
    };

    if (loading) {
        return (
            <div className="p-6 bg-background rounded-xl border border-gray-200">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
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
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-background rounded-xl border border-gray-200">
            {editingInventory ? (
                <EditShopInventory
                    shopId={editingInventory._id}
                    shopName={editingInventory.name}
                    onClose={handleCloseEditInventory}
                />
            ) : (
                <>
                    <h2 className="text-xl font-semibold text-text-dark mb-6">All Shops</h2>

                    {shops.length === 0 ? (
                        <p className="text-text-light">No shops found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {shops.map((shop) => (
                                        <tr key={shop._id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{shop.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{shop.code}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{shop.address}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {shop.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEditInventory(shop)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit Inventory"
                                                    >
                                                        <FiEdit className="w-4 h-4" />
                                                    </button>
                                                    {shop.isActive ? (
                                                        <button
                                                            onClick={() => handleDeactivate(shop)}
                                                            className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-2xl hover:bg-yellow-700 transition-colors"
                                                            title="Deactivate Shop"
                                                        >
                                                            Deactivate
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleActivate(shop)}
                                                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors"
                                                            title="Activate Shop"
                                                        >
                                                            Activate
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(shop)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Permanently Delete Shop"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Modal
                        isOpen={modal.isOpen}
                        onClose={handleCloseModal}
                        title={modal.title}
                        size="sm"
                    >
                        <div className="p-4">
                            <p className="text-gray-700 mb-6">{modal.message}</p>
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
                </>
            )}
        </div>
    );
};

export default AllShopsTable;