import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Skeleton from "@mui/material/Skeleton";
import ParseJwt from "../utils/ParseJWT";

// --- ICONS & COMPONENTS ---
import { FaChevronLeft, FaStar } from "react-icons/fa";
import { FiChevronLeft, FiArrowRight } from "react-icons/fi";
import CartPane from "../components/homepage/CartPane";
import nutritionImg from "../resources/productpage/nutrition facts.png";
import Footer from "../components/footer/Footer";
import { checkStock } from "../utils/inventoryCheck";

const API_URL = import.meta.env.VITE_API_URL;

const ProductPage = () => {
  // --- STATE MANAGEMENT ---
  const { prodId: productId } = useParams();
  const navigate = useNavigate();

  // States for product, cart, rating, suggestions
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [allSuggestedItems, setAllSuggestedItems] = useState([]);
  const [randomSuggestions, setRandomSuggestions] = useState([]);

  const getProductId = (p) => p._id || p.prodId;

  const handleAddToCart = async (productToAdd) => {
    const productId = getProductId(productToAdd);

    const stock = await checkStock(productId);
    if (stock === null) return; // No shop selected or fetch failed

    const existingItem = cartItems.find(item => getProductId(item) === productId);
    const newQty = existingItem ? existingItem.quantity + 1 : 1;

    if (newQty > stock) {
      alert(`Not enough stock for ${product.prodName} in this shop.`);
      return;
    }

    setCartItems((prevItems) => {
      if (existingItem) {
        return prevItems.map(item =>
          getProductId(item) === productId
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [
        ...prevItems,
        {
          prodId: productId,
          prodImg: productToAdd.prodImg,
          prodName: productToAdd.prodName,
          price: productToAdd.price,
          quantity: 1,
        }
      ];
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
  const handleDecrease = (p) => setCartItems((prev) => prev.map((item) => getProductId(item) === getProductId(p) ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item).filter((item) => item.quantity > 0));
  const handleRemove = (p) => setCartItems((prev) => prev.filter((item) => getProductId(item) !== getProductId(p)));

  const handleRating = async (rating) => {
    try {
      await axios.post(`${API_URL}/rate/${productId}`, { rating, userId: userInfo?.user?.userId });
      setUserRating(rating);
      const response = await axios.get(`${API_URL}/products/id/${productId}`);
      setProduct(response.data[0]);
    } catch (err) {
      console.error("Error submitting rating:", err);
    }
  };

  const renderStarRating = () => (
    <div className="flex items-center justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar key={star} size={32} className={`cursor-pointer transition-colors duration-200 ${(hoveredRating || userRating) >= star ? "text-yellow-400" : "text-gray-300"}`} onMouseEnter={() => setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} onClick={() => handleRating(star)} />
      ))}
    </div>
  );

  // --- DATA FETCHING & LOCALSTORAGE ---
  useEffect(() => {
    const token = Cookies.get("token");
    if (token) setUserInfo(ParseJwt(token));
    const storedCart = localStorage.getItem("cartItems");
    if (storedCart) setCartItems(JSON.parse(storedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadingProduct(true);
      try {
        const res = await axios.get(`${API_URL}/products/id/${productId}`);
        setProduct(res.data[0]);
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await axios.get(`${API_URL}/products`);
        setAllSuggestedItems(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (allSuggestedItems.length < 3) return;
    const getRandomSuggestions = () => {
      const shuffled = [...allSuggestedItems].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    };
    setRandomSuggestions(getRandomSuggestions());
    const interval = setInterval(() => {
      setRandomSuggestions(getRandomSuggestions());
    }, 10000);
    return () => clearInterval(interval);
  }, [allSuggestedItems]);

  // --- RENDER LOGIC ---
  if (loadingProduct) return <div> {/* Your Skeleton Code... */} </div>;
  if (error) return <div className="text-center p-10">Error: {error}</div>;
  if (!product) return <div className="text-center p-10">Product not found.</div>;

  const currentProduct = product;

  const getDisplayPrice = (item) => {
    if (item.price.$numberDecimal) {
      return parseFloat(item.price.$numberDecimal);
    }
    return item.price;
  };

  // --- FIX APPLIED HERE: Removed the `pb-32` class from this div ---
  return (
    <div className="bg-[var(--background-color)] min-h-screen">
      <header className="relative w-full h-[40vh]">
        <img src={currentProduct.prodImg} alt={currentProduct.prodName} className="w-full h-full object-cover rounded-b-[50px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-opacity-20 rounded-b-[50px]"></div>
        {/* <button onClick={() => navigate(-1)} className="absolute top-5 left-4 z-20 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
          <FiChevronLeft size={24} className="text-gray-800" />
        </button> */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-background bg-opacity-75 rounded-full shadow-md"
        >
          <FaChevronLeft className="text-tertiary" />
        </button>
      </header>

      <main className="px-5 pt-24 -mt-16 z-10 relative">
        <section className="flex justify-between items-start">
          <h1 className="text-4xl font-bold text-primary leading-tight" dangerouslySetInnerHTML={{ __html: currentProduct.prodName.replace(" ", "<br />") }} />
          <div className="flex flex-col items-end gap-2">
            <div className="bg-accent text-primary border-primary border-2 font-bold py-1 px-5 rounded-full text-lg">₹{currentProduct.price}</div>
            <button onClick={() => handleAddToCart(currentProduct)} className="bg-accent text-primary border-primary border-2 font-bold py-1 px-6 rounded-full text-lg">Add</button>
          </div>
        </section>

        <p className="mt-4">{currentProduct.prodDesc}</p>

        <section className="text-center my-8 p-4 bg-[var(--accent-color)] rounded-2xl shadow-sm">
          <h3 className="text-2xl font-bold text-primary mb-3">Rate this Product</h3>
          {renderStarRating()}
          {userRating > 0 && (<p className="text-sm mt-3">You rated this {userRating} star{userRating !== 1 ? "s" : ""}. Thank you!</p>)}
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-primary">Ingredients</h2>
            <hr className="flex-grow border-t-[3px] border-primatext-primary" />
          </div>
          <p className="mt-2">{currentProduct.ingredients || "Ingredients are not available for this product."}</p>
        </section>

        <section className="mt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-primary">Nutrition Facts</h2>
            <hr className="flex-grow border-t-[3px] border-primatext-primary" />
          </div>
          <img src={nutritionImg} alt="Nutrition Facts" className="w-full mt-2 rounded-lg border border-gray-200" />
        </section>

        <div className="my-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-primary">More Products</h2>
            <hr className="flex-grow border-t-[3px] border-primatext-primary" />
          </div>
          {loadingSuggestions ? (
            <div className="flex justify-between px-4">{[1, 2, 3].map((index) => (<div key={index} className="relative w-24 h-24 bg-gray-200 rounded-[15px] animate-pulse"></div>))}</div>
          ) : (
            <div className="flex justify-between px-4">
              {randomSuggestions.map((item) => (
                <div key={getProductId(item)} className="relative w-24 h-24">
                  <img src={item.prodImg} alt={item.prodName} className="w-full h-full rounded-[15px] object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 rounded-b-[15px]">
                    <p className="text-white text-xs font-medium truncate">{item.prodName}</p>
                    <p className="text-white text-xs">₹{getDisplayPrice(item)}</p>
                  </div>
                  <button onClick={() => handleAddToCart(item)} className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg text-sm">+</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12 mb-10">
          <button onClick={() => navigate("/cart")} className="w-full flex items-center justify-center gap-4 bg-primary text-background font-semibold py-4 rounded-2xl text-xl shadow-lg">
            Go to Cart <FiArrowRight size={24} />
          </button>
        </div>
      </main>

      <CartPane cartItems={cartItems} onIncrease={handleIncrease} onDecrease={handleDecrease} onRemove={handleRemove} onCheckout={() => navigate("/cart")} />

      <Footer />
    </div>
  );
};

export default ProductPage;