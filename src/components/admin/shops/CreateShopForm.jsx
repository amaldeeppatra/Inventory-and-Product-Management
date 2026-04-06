import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateShopForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        initialProducts: []
    });

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [productLoading, setProductLoading] = useState(true);
    const [serverMessage, setServerMessage] = useState({ type: '', content: '' });

    const fetchProducts = useCallback(async () => {
        setProductLoading(true);
        try {
            const response = await axios.get(`${API_URL}/products`);
            const productList = response.data.products || response.data || [];
            setProducts(productList);
            setFilteredProducts(productList);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setProductLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearch = (term) => {
        setSearchTerm(term);
        if (term.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product =>
                product.prodName.toLowerCase().includes(term.toLowerCase()) ||
                product.category.toLowerCase().includes(term.toLowerCase()) ||
                product.prodId.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    const handleProductToggle = (prodId) => {
        setFormData(prev => ({
            ...prev,
            initialProducts: prev.initialProducts.includes(prodId)
                ? prev.initialProducts.filter(id => id !== prodId)
                : [...prev.initialProducts, prodId]
        }));
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = 'Shop Name is required.';
        if (!formData.code) newErrors.code = 'Shop Code is required.';
        if (!formData.address) newErrors.address = 'Address is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerMessage({ type: '', content: '' });
        if (!validateForm()) { return; }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/shop/new`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setServerMessage({ type: 'success', content: `Shop "${response.data.shop.name}" created successfully!` });
            setFormData({ name: '', code: '', address: '', initialProducts: [] });
            setErrors({});
            setSearchTerm('');
            setFilteredProducts(products);
        } catch (error) {
            const message = error.response?.data?.message || "An error occurred. Please try again.";
            setServerMessage({ type: 'error', content: message });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = `w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-light bg-[#FAF7E7]`;
    const errorInputClass = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-[#FAF7E7] border-red-500 focus:ring-red-400`;

    return (
        <div className="p-6 bg-background rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-text-dark mb-6">Add New Shop</h2>

            {serverMessage.content && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${serverMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {serverMessage.content}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-dark mb-1">Shop Name*</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} className={errors.name ? errorInputClass : inputClass} placeholder="Shop Name" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="code" className="block text-sm font-medium text-text-dark mb-1">Shop Code*</label>
                    <input type="text" id="code" value={formData.code} onChange={handleChange} className={errors.code ? errorInputClass : inputClass} placeholder="e.g. KORAPUT01" />
                    {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-text-dark mb-1">Address*</label>
                    <textarea id="address" rows="4" value={formData.address} onChange={handleChange} className={`${errors.address ? errorInputClass : inputClass} resize-y`} placeholder="Shop address"></textarea>
                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-dark mb-1">Initialize Inventory (Optional)</label>
                    <p className="text-xs text-gray-600 mb-4">Select products to add to this shop's inventory with zero stock. Sellers can request restocks later.</p>
                    
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder={productLoading ? 'Loading products...' : 'Search products by name, category, or ID...'}
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            disabled={productLoading}
                            className={`${inputClass} mb-2 ${productLoading ? 'cursor-not-allowed opacity-60' : ''}`}
                        />
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            {productLoading ? (
                                <div className="p-8 text-center text-gray-500">Loading products...</div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts.map(product => {
                                        const isSelected = formData.initialProducts.includes(product.prodId);
                                        return (
                                            <tr key={product._id} className={isSelected ? 'bg-blue-50' : ''}>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{product.prodName}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{product.category}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">{product.prodId}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProductToggle(product.prodId)}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            isSelected
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Remove' : 'Add'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        </div>
                    </div>

                    {!productLoading && filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No products found matching your search.
                        </div>
                    )}

                    {formData.initialProducts.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 font-medium">
                                {formData.initialProducts.length} product(s) selected for initial inventory
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {formData.initialProducts.map(prodId => {
                                    const product = products.find(p => p.prodId === prodId);
                                    return (
                                        <span key={prodId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                            {product?.prodName || prodId}
                                            <button
                                                type="button"
                                                onClick={() => handleProductToggle(prodId)}
                                                className="ml-1 text-blue-600 hover:text-blue-800"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2 flex justify-end mt-4">
                    <button type="submit" disabled={loading} className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Adding Shop...' : 'Add Shop'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateShopForm;