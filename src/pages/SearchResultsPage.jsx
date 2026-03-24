import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Skeleton from '@mui/material/Skeleton';

// --- ICONS & COMPONENTS---
import { FiChevronLeft, FiSearch } from 'react-icons/fi';
import CartPane from '../components/homepage/CartPane';
import { checkStock } from '../utils/inventoryCheck';

const API_URL = import.meta.env.VITE_API_URL;

// --- A Reusable Product Card Component for the new UI ---
const ProductCard = ({ item, onAddToCart, type = 'more' }) => {
    const navigate = useNavigate();
    const isMatchType = type === 'match';

    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-[130px] h-[134px] overflow-visible">
                <img
                    src={item.prodImg}
                    alt={item.prodName}
                    className="w-full h-full object-cover rounded-2xl shadow-md"
                />

                <button
                    onClick={() => onAddToCart(item)}
                    className="absolute top-[-12px] right-[-12px] w-10 h-10 bg-white text-[var(--tertiary-color)] rounded-full flex items-center justify-center shadow-lg border-[4px] border-[var(--tertiary-color)] text-4xl font-light"
                >
                    +
                </button>

                {isMatchType && (
                    <button
                        onClick={() => navigate(`/product/${item.prodId}`)}
                        className="absolute bottom-2 right-2 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-lg font-bold text-sm"
                    >
                        i
                    </button>
                )}
            </div>

            <div className="mt-2 w-[130px]">
                <h3 className="text-[var(--tertiary-color)] text-base font-bold truncate">{item.prodName}</h3>
                {/* --- FIX APPLIED HERE: The calorie <p> tag has been completely removed --- */}
            </div>
        </div>
    );
};

const SearchResultsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('query') || '';
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    const [allProducts, setAllProducts] = useState([]);
    const [randomMoreProducts, setRandomMoreProducts] = useState([]);
    const [loadingMore, setLoadingMore] = useState(true);

    // --- CART LOGIC ---
    useEffect(() => {
        const storedCart = localStorage.getItem('cartItems');
        if (storedCart) setCartItems(JSON.parse(storedCart));
    }, []);

    useEffect(() => {
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }, [cartItems]);

    const getProductId = (product) => product._id || product.prodId;

    const handleAddToCart = async (product) => {
        const stock = await checkStock(product.prodId);
        if (stock === null) return;
        const productId = product.prodId;

        const existingItem = cartItems.find(item => item.prodId === productId);
        const newQty = existingItem ? existingItem.quantity + 1 : 1;

        if (newQty > stock) {
            alert(`Not enough stock for ${product.prodName} in this shop.`);
            return;
        }

        setCartItems((prevItems) => {
            const existing = prevItems.find(item => item.prodId === productId);
            if (existing) {
                return prevItems.map(item =>
                    item.prodId === productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                const parsePrice = (price) => {
                    if (price && typeof price === "object" && "$numberDecimal" in price) {
                        return parseFloat(price.$numberDecimal);
                    }
                    return parseFloat(price) || 0;
                };

                const newItem = {
                    prodId: product.prodId,
                    prodImg: product.prodImg,
                    prodName: product.prodName,
                    price: parsePrice(product.price),
                    quantity: 1,
                };
                return [...prevItems, newItem];
            }
        });
    };

    const handleIncrease = async (product) => {
        const stock = await checkStock(product.prodId);
        if (stock === null) return;

        const currentQty = cartItems.find(i => i.prodId === product.prodId)?.quantity || 0;

        if (currentQty + 1 > stock) {
            alert(`Not enough stock for ${product.prodName} in this shop.`);
            return;
        }

        setCartItems(prev =>
            prev.map(item =>
                item.prodId === product.prodId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };
    const handleDecrease = (product) => {
        const productId = getProductId(product);
        setCartItems((prevItems) => prevItems.map(item => getProductId(item) === productId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
    };
    const handleRemove = (product) => {
        const productId = getProductId(product);
        setCartItems((prevItems) => prevItems.filter(item => getProductId(item) !== productId));
    };

    // --- DATA FETCHING (Unchanged) ---
    useEffect(() => {
        if (!query) { setLoading(false); return; }
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`);
                setResults(response.data);
            } catch (err) { setError(err.message || 'An error occurred'); }
            finally { setLoading(false); }
        };
        fetchSearchResults();
    }, [query]);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoadingMore(true);
            try {
                const response = await axios.get(`${API_URL}/products`);
                setAllProducts(response.data);
            } catch (err) { console.error("Failed to fetch all products:", err); }
            finally { setLoadingMore(false); }
        };
        fetchAllProducts();
    }, []);

    useEffect(() => {
        if (allProducts.length < 6) return;
        const getRandomProducts = () => {
            const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 6);
        };
        setRandomMoreProducts(getRandomProducts());
        const interval = setInterval(getRandomProducts, 10000);
        return () => clearInterval(interval);
    }, [allProducts]);

    const handleSearch = () => {
        if (searchTerm.trim()) { setSearchParams({ query: searchTerm }); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };



    const matches = results.slice(0, 2);

    return (
        <div className="min-h-screen bg-[var(--background-color)]">
            {/* Header */}
            <header className="flex items-center gap-4 p-4 sticky top-0 bg-[var(--background-color)] z-10">
                <button onClick={() => navigate(-1)} className="text-2xl text-[var(--tertiary-color)]">
                    <FiChevronLeft />
                </button>
                <div className="relative flex-grow">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-white rounded-full py-3 pl-12 pr-4 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 pb-32">
                {loading && (<div> {/* Your Main Skeleton Code Here */} </div>)}
                {error && (<div className="text-center py-10">Error: {error}</div>)}

                {!loading && !error && (
                    <>
                        {matches.length > 0 && (
                            <section>
                                <div className="my-4 px-2">
                                    <h2 className="text-2xl font-bold text-[var(--primary-color)]">Matches</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6 justify-items-center">
                                    {matches.map(item => (
                                        <ProductCard key={getProductId(item)} item={item} onAddToCart={handleAddToCart} type="match" />
                                    ))}
                                </div>
                            </section>
                        )}
                        <section className="mt-8">
                            <div className="flex items-center gap-3 my-4 px-2">
                                <h2 className="text-2xl font-bold text-[var(--primary-color)]">More Products</h2>
                                <hr className="flex-grow border-t-2 border-[var(--primary-color)]" />
                            </div>
                            {loadingMore ? (
                                <div> {/* Skeleton for More Products */} </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-6 justify-items-center">
                                    {randomMoreProducts.map(item => (
                                        <ProductCard key={getProductId(item)} item={item} onAddToCart={handleAddToCart} type="more" />
                                    ))}
                                </div>
                            )}
                        </section>
                        {results.length === 0 && !loading && (
                            <div className="text-center py-20">
                                <p className="text-lg font-semibold text-[var(--text-color)]">No results found for "{query}"</p>
                            </div>
                        )}
                    </>
                )}
            </main>
            <CartPane
                cartItems={cartItems}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onRemove={handleRemove}
                onCheckout={() => navigate('/cart')}
            />
        </div>
    );
};

export default SearchResultsPage;