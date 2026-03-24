import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaChevronLeft, FaSearch, FaBoxOpen } from 'react-icons/fa';
import Skeleton from '@mui/material/Skeleton';
import CartPane from '../components/homepage/CartPane';

const API_URL = import.meta.env.VITE_API_URL;

// --- Mock Data (from your reference, used as fallback) ---
const predefinedProducts = {
    'Millet': [{ prodId: 1, prodName: 'Millet Flour', price: 50, prodImg: 'https://images.unsplash.com/photo-1627485718909-503c7a0e5b12?q=80&w=2940&auto=format&fit=crop' }, { prodId: 2, prodName: 'Millet Bread', price: 30, prodImg: 'https://images.unsplash.com/photo-1598373182133-5b681a2517b7?q=80&w=2940&auto=format&fit=crop' }],
    'Beverages': [{ prodId: 3, prodName: 'Millet Smoothie', price: 45, prodImg: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?q=80&w=2836&auto=format&fit=crop' }, { prodId: 4, prodName: 'Herbal Tea', price: 25, prodImg: 'https://images.unsplash.com/photo-1576092762791-ddc29a265e58?q=80&w=2940&auto=format&fit=crop' }],
    'Snacks': [{ prodId: 5, prodName: 'Millet Chips', price: 35, prodImg: 'https://images.unsplash.com/photo-1599232581043-40019e078234?q=80&w=2803&auto=format&fit=crop' }, { prodId: 6, prodName: 'Roasted Nuts', price: 40, prodImg: 'https://images.unsplash.com/photo-1608772388049-55e433a72a17?q=80&w=2940&auto=format&fit=crop' }],
    'Dessert': [{ prodId: 7, prodName: 'Millet Cake', price: 60, prodImg: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=2850&auto=format&fit=crop' }, { prodId: 8, prodName: 'Fruit Tart', price: 55, prodImg: 'https://images.unsplash.com/photo-1562440102-395a4a4022a2?q=80&w=2864&auto=format&fit=crop' }],
    'Fast Food': [{ prodId: 9, prodName: 'Millet Burger', price: 70, prodImg: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2942&auto=format&fit=crop' }, { prodId: 10, prodName: 'Veggie Pizza', price: 80, prodImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881&auto=format&fit=crop' }]
};

// --- Sub-component for Skeleton Loading Card ---
const ProductCardSkeleton = () => (
    <div className="bg-white/30 backdrop-blur-lg rounded-2xl p-4 shadow-lg">
        <Skeleton variant="rectangular" width="100%" height={128} className="rounded-xl" />
        <Skeleton variant="text" width="80%" height={28} className="mt-4" />
        <Skeleton variant="text" width="50%" height={20} className="mt-1" />
        <div className="flex justify-between items-center mt-4">
            <Skeleton variant="text" width="30%" height={32} />
            <Skeleton variant="rectangular" width={90} height={36} className="rounded-full" />
        </div>
    </div>
);


const ProductsByCat = () => {
    const navigate = useNavigate();

    // Using the category data structure from your code
    const categories = [
        { name: 'Millet', icon: '/src/resources/categories/millet.png', apiPath: 'Millet' },
        { name: 'Beverages', icon: '/src/resources/categories/beverages.png', apiPath: 'Beverage' },
        { name: 'Snacks', icon: '/src/resources/categories/snacks.png', apiPath: 'Snacks' },
        { name: 'Dessert', icon: '/src/resources/categories/baked.png', apiPath: 'Dessert' },
        { name: 'Fast Food', icon: '/src/resources/categories/fast food.jpg', apiPath: 'Fast Food' }
    ];

    const [selectedCategory, setSelectedCategory] = useState('Millet');
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem('cartItems');
            return storedCart ? JSON.parse(storedCart) : [];
        } catch {
            return [];
        }
    });

    // Sync cart to localStorage
    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    // Fetch products when category changes
    useEffect(() => {
        let isMounted = true;
        const fetchProducts = async () => {
            setLoading(true);
            const currentCategory = categories.find(cat => cat.name === selectedCategory);
            // Default to mock data
            let productsToSet = predefinedProducts[selectedCategory.replace(' ', '')] || [];

            if (currentCategory && API_URL) {
                try {
                    const response = await axios.get(`${API_URL}/products/cat/${currentCategory.apiPath}`, { timeout: 5000 });
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        productsToSet = response.data.map(p => ({ ...p, prodImg: p.prodImg || 'https://via.placeholder.com/150' }));
                    }
                } catch (apiError) {
                    console.warn(`API fetch failed for ${currentCategory.apiPath}, using fallback.`, apiError);
                }
            }

            if (isMounted) {
                setProducts(productsToSet);
                setLoading(false);
            }
        };
        fetchProducts();
        return () => { isMounted = false; };
    }, [selectedCategory]);

    const getProductId = (product) => product._id || product.prodId;

    const handleAddToCart = (product) => {
        setCartItems(prev => {
            const productId = getProductId(product);
            const existing = prev.find(item => getProductId(item) === productId);
            if (existing) {
                return prev.map(item => getProductId(item) === productId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const handleIncrease = (product) => handleAddToCart(product); // Logic is the same
    
    const handleDecrease = (product) => {
        const productId = getProductId(product);
        setCartItems(prev => prev.map(item =>
            getProductId(item) === productId ? { ...item, quantity: item.quantity - 1 } : item
        ).filter(item => item.quantity > 0));
    };

    const handleRemove = (product) => {
        const productId = getProductId(product);
        setCartItems(prev => prev.filter(item => getProductId(item) !== productId));
    };

    const filteredProducts = Array.isArray(products)
        ? products.filter(p => p && p.prodName && p.prodName.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <div className="flex flex-col h-screen bg-[#F8EDD6]">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-3 z-20 bg-[#F8EDD6]/80 backdrop-blur-sm sticky top-0">
                <button onClick={() => navigate(-1)} className="p-3 bg-[#291C08] rounded-full text-white shadow-md">
                    <FaChevronLeft />
                </button>
                <div className="relative flex-1">
                    <FaSearch className="absolute top-1/2 left-4 -translate-y-1/2 text-[#291C08]/60" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for items..."
                        className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-md border border-white/40 text-[#291C08] placeholder-[#291C08]/60 rounded-full focus:outline-none focus:ring-2 focus:ring-[#291C08]"
                    />
                </div>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
                {/* Vertical Category Navigation (Aside) */}
                <aside className="w-24 flex-shrink-0 overflow-y-auto bg-transparent pt-2">
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            className={`w-full p-2 flex flex-col items-center justify-center h-24 cursor-pointer transition-all duration-300 border-r-4 ${selectedCategory === category.name ? 'border-[#291C08] bg-white/30' : 'border-transparent hover:bg-white/20'}`}
                            onClick={() => setSelectedCategory(category.name)}
                        >
                            <div className="h-12 w-12 rounded-lg mb-1 flex items-center justify-center overflow-hidden shadow-sm">
                                <img src={category.icon} alt={category.name} className="w-full h-full object-cover" />
                            </div>
                            <span className={`text-xs font-semibold text-center transition-colors ${selectedCategory === category.name ? 'text-[#291C08]' : 'text-[#291C08]/70'}`}>
                                {category.name}
                            </span>
                        </button>
                    ))}
                </aside>
                
                {/* Main Product Display Area */}
                <main className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center h-full">
                            <div className="w-20 h-20 mx-auto bg-[#291C08]/10 rounded-full flex items-center justify-center mb-4">
                                <FaBoxOpen className="text-[#291C08]/50 text-4xl" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#291C08]">No Products Found</h3>
                            <p className="text-[#291C08]/70 mt-2">Try changing the category or search term.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.map((item) => {
                                const cartItem = cartItems.find(ci => getProductId(ci) === getProductId(item));
                                return (
                                    <div key={getProductId(item)} className="bg-white/30 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 duration-300">
                                        <img src={item.prodImg} alt={item.prodName} className="w-full h-40 object-cover" />
                                        <div className="p-4 flex flex-col flex-grow">
                                            <h3 className="text-base font-bold text-[#291C08]">{item.prodName}</h3>
                                            <div className="flex justify-between items-center mt-auto pt-4">
                                                <span className="text-lg font-semibold text-[#291C08]">₹{item.price}</span>
                                                {cartItem ? (
                                                    <div className="flex items-center gap-2 bg-[#291C08] text-white rounded-full shadow-lg">
                                                        <button onClick={() => handleDecrease(item)} className="px-3 py-1 text-lg font-bold">-</button>
                                                        <span className="font-semibold">{cartItem.quantity}</span>
                                                        <button onClick={() => handleIncrease(item)} className="px-3 py-1 text-lg font-bold">+</button>
                                                    </div>
                                                ) : (
                                                    <button className="bg-[#291C08] text-white text-sm font-bold px-5 py-2 rounded-full shadow-lg hover:bg-opacity-90 transition-all" onClick={() => handleAddToCart(item)}>
                                                        ADD
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            <CartPane cartItems={cartItems} onIncrease={handleIncrease} onDecrease={handleDecrease} onRemove={handleRemove} />
        </div>
    );
};

export default ProductsByCat;