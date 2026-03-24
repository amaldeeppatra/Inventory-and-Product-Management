import React, { useState } from 'react';
import axios from 'axios';

// Assume your API URL is stored in an environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateProductForm = () => {
    const [formData, setFormData] = useState({
        prodId: '',
        prodName: '',
        prodImg: '',
        prodDesc: '',
        category: '',
        price: '',
        // stock: '',
        ingredients: '',
        nutritionalValue: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverMessage, setServerMessage] = useState({ type: '', content: '' });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.prodId) newErrors.prodId = 'Product ID is required.';
        if (!formData.prodName) newErrors.prodName = 'Product Name is required.';
        if (!formData.prodImg) newErrors.prodImg = 'Product Image URL is required.';
        if (!formData.prodDesc) newErrors.prodDesc = 'Product Description is required.';
        if (!formData.price) newErrors.price = 'Price is required.';
        // if (!formData.stock) newErrors.stock = 'Stock Quantity is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerMessage({ type: '', content: '' });
        if (!validateForm()) { return; }
        setLoading(true);
        const payload = { ...formData, rating: 0 };
        try {
            const response = await axios.post(`${API_URL}/product/new`, payload);
            setServerMessage({ type: 'success', content: `Product "${response.data.prodName}" created successfully!` });
            // setFormData({ prodId: '', prodName: '', prodImg: '', prodDesc: '', category: '', price: '', stock: '', ingredients: '', nutritionalValue: '' });
            setFormData({ prodId: '', prodName: '', prodImg: '', prodDesc: '', category: '', price: '', ingredients: '', nutritionalValue: '' });
            setErrors({});
        } catch (error) {
            const message = error.response?.data?.message || "An error occurred. Please try again.";
            setServerMessage({ type: 'error', content: message });
        } finally {
            setLoading(false);
        }
    };

    // Common classes for form inputs with the new background color
    const inputClass = `w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-light bg-[#FAF7E7]`;
    const errorInputClass = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-[#FAF7E7] border-red-500 focus:ring-red-400`;

    return (
        // Replaced shadow-md with a line border
        <div className="p-6 bg-background rounded-xl border border-gray-200">
            <h2 className="text-xl font-semibold text-text-dark mb-6">Add New Product</h2>

            {serverMessage.content && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${serverMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {serverMessage.content}
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Row 1: Product ID and Name */}
                <div>
                    <label htmlFor="prodId" className="block text-sm font-medium text-text-dark mb-1">Product ID*</label>
                    <input type="text" id="prodId" value={formData.prodId} onChange={handleChange} className={errors.prodId ? errorInputClass : inputClass} placeholder="P00X" />
                    {errors.prodId && <p className="text-red-500 text-xs mt-1">{errors.prodId}</p>}
                </div>
                <div>
                    <label htmlFor="prodName" className="block text-sm font-medium text-text-dark mb-1">Product Name*</label>
                    <input type="text" id="prodName" value={formData.prodName} onChange={handleChange} className={errors.prodName ? errorInputClass : inputClass} placeholder="Product Name" />
                    {errors.prodName && <p className="text-red-500 text-xs mt-1">{errors.prodName}</p>}
                </div>

                {/* Row 2: Reordered Image/Category and Description */}
                <div className="flex flex-col space-y-8">
                    <div>
                        <label htmlFor="prodImg" className="block text-sm font-medium text-text-dark mb-1">Product Image URL*</label>
                        <input type="text" id="prodImg" value={formData.prodImg} onChange={handleChange} className={errors.prodImg ? errorInputClass : inputClass} placeholder="https://example.com/image.jpg" />
                        {errors.prodImg && <p className="text-red-500 text-xs mt-1">{errors.prodImg}</p>}
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-text-dark mb-1">Select Category</label>
                        <select id="category" value={formData.category} onChange={handleChange} className={inputClass}>
                            <option value="">Select Category</option>
                            <option value="Millet">Millet</option>
                            <option value="Snacks">Snacks</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Fast Food">Fast Food</option>
                            <option value="Dessert">Dessert</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="prodDesc" className="block text-sm font-medium text-text-dark mb-1">Product Description*</label>
                    <textarea id="prodDesc" rows="" value={formData.prodDesc} onChange={handleChange} className={`${errors.prodDesc ? errorInputClass : inputClass} resize-y h-28`} placeholder="Brief description of the product"></textarea>
                    {errors.prodDesc && <p className="text-red-500 text-xs mt-1">{errors.prodDesc}</p>}
                </div>

                {/* Row 3: Reordered Stock/Price and Ingredients */}
                <div className="flex flex-col space-y-6">
                    {/* <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-text-dark mb-1">Stock Quantity*</label>
                        <input type="number" id="stock" value={formData.stock} onChange={handleChange} className={errors.stock ? errorInputClass : inputClass} placeholder="0" />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                    </div> */}
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-text-dark mb-1">Price*</label>
                        <input type="number" id="price" value={formData.price} onChange={handleChange} className={errors.price ? errorInputClass : inputClass} placeholder="0.00" step="0.01" />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="ingredients" className="block text-sm font-medium text-text-dark mb-1">Ingredients</label>
                    <textarea id="ingredients" rows="6" value={formData.ingredients} onChange={handleChange} className={`${inputClass} resize-y h-full`} placeholder="List of ingredients"></textarea>
                </div>

                {/* Row 4: Nutritional Value */}
                <div className="md:col-span-2">
                    <label htmlFor="nutritionalValue" className="block text-sm font-medium text-text-dark mb-1">Nutritional Value</label>
                    <textarea id="nutritionalValue" rows="3" value={formData.nutritionalValue} onChange={handleChange} className={`${inputClass} resize-y`} placeholder="Detailed nutritional information"></textarea>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 flex justify-end mt-4">
                    <button type="submit" disabled={loading} className="bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Adding Product...' : 'Add Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProductForm;