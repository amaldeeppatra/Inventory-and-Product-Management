import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import ParseJwt from '../utils/ParseJWT';
import { CgProfile } from "react-icons/cg";
import { FaChevronLeft } from "react-icons/fa6";
import Skeleton from '@mui/material/Skeleton';
import banner1 from '../resources/homepage/banner1.png';
import banner2 from '../resources/homepage/ShaktiSaathi.png';
import ProductsByCat from '../components/homepage/ProductsByCat';
import Footer from '../components/footer/Footer';
import CartPane from '../components/homepage/CartPane';
import MissionShaktiCard from '../components/homepage/MissionShaktiCard';
import { AiOutlineClose } from 'react-icons/ai';
import ShopLocationSelector from '../components/homepage/ShopLocationSelector';
import { checkStock } from '../utils/inventoryCheck';

const API_URL = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query parameters and store it in cookies
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    if (tokenFromUrl) {
      Cookies.set('token', tokenFromUrl, { secure: true, sameSite: 'none', expires: 1 / 48 }); // 30 minutes expiration
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const token = Cookies.get('token');
  console.log('Token:', token);

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);

  // Simulate data fetching delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Retrieve cart items from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('cartItems');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  // Update localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // State for recent searches (initialize from localStorage)
  const [recentSearches, setRecentSearches] = useState(() => {
    const stored = localStorage.getItem('recentSearches');
    return stored ? JSON.parse(stored) : [];
  });

  // State and logic for search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const popularSearches = ["Samosa", "Coffee", "Kodo Momo", "Sandwich"];

  const handleSearch = () => {
    if (searchTerm.trim() !== "") {
      // Update recent searches, ensuring no duplicates and limit to 4
      const updatedSearches = [searchTerm, ...recentSearches.filter(item => item !== searchTerm)];
      if (updatedSearches.length > 4) {
        updatedSearches.pop(); // remove the oldest search if more than 4
      }
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

      // Navigate to search results page
      navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
      setSearchOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Other state and handlers...
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = ParseJwt(token);
        setUserInfo(decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  // Carousel auto-change effect and other UI states
  const slides = [
    { image: banner1, alt: 'Banner 1', title: 'Welcome to Millet Hub Cafe', subtitle: '' },
    { image: banner2, alt: 'Banner 2', title: 'Title for Banner 2', subtitle: 'Subtitle for Banner 2' },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    const validateCart = async () => {
      const shopId = localStorage.getItem("selectedShop");
      if (!shopId) return;

      const updatedCart = [];

      for (const item of cartItems) {
        try {
          const res = await axios.get(`${API_URL}/inventory/${shopId}/product/${item.prodId}`);
          const stock = res?.data?.stock ?? 0;

          if (stock >= item.quantity) {
            updatedCart.push(item);
          } else if (stock > 0) {
            updatedCart.push({ ...item, quantity: stock });
            alert(`${item.prodName} stock reduced to ${stock} for this shop`);
          } else {
            alert(`${item.prodName} is not available in this shop`);
          }
        } catch {
          alert(`${item.prodName} is not available in this shop`);
        }
      }

      setCartItems(updatedCart);
    };

    if (cartItems.length > 0) validateCart();
  }, [localStorage.getItem("selectedShop")]);

  const getProductId = (product) => product._id || product.prodId;

  const handleAddToCart = async (product) => {
    const stock = await checkStock(product.prodId);
    if (stock === null) return;

    const existingItem = cartItems.find(item => item.prodId === product.prodId);
    const newQty = existingItem ? existingItem.quantity + 1 : 1;

    if (newQty > stock) {
      alert(`Not enough stock for ${product.prodName} in this shop.`);
      return;
    }

    setCartItems((prevItems) => {
      if (existingItem) {
        return prevItems.map(item =>
          item.prodId === product.prodId
            ? { ...item, quantity: newQty }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            prodId: product.prodId,
            prodImg: product.prodImg,
            prodName: product.prodName,
            price: product.price,
            quantity: 1,
          }
        ];
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
    setCartItems((prevItems) =>
      prevItems
        .map(item =>
          getProductId(item) === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const handleRemove = (product) => {
    const productId = getProductId(product);
    setCartItems((prevItems) =>
      prevItems.filter(item => getProductId(item) !== productId)
    );
  };

  // Render profile picture logic remains the same
  const renderProfilePicture = () => {
    if (userInfo?.user?.avatar) {
      return (
        <img
          src={userInfo.user.avatar}
          alt="Profile"
          className="size-8 rounded-full object-cover"
        />
      );
    } else if (userInfo?.user?.name) {
      const initials = userInfo.user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();

      return (
        <div className="size-8 rounded-full object-cover">
          {initials}
        </div>
      );
    } else {
      return (
        <div className="bg-tertiary p-2 rounded-full shadow-md">
          <CgProfile className="text-4xl text-white" />
        </div>
      );
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem("selectedShop");
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" width="100%" height={400} />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Navbar */}
      <header className="bg-opacity-90 p-4 relative z-50">
        <nav className="flex items-center justify-between relative">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center focus:outline-none bg-tertiary p-2 rounded-md z-50 relative"
            >
              {menuOpen ? (
                <AiOutlineClose className="text-white h-3.5" />
              ) : (
                <div className="flex flex-col space-y-1">
                  <span className="block w-4 h-0.5 bg-white"></span>
                  <span className="block w-4 h-0.5 bg-white"></span>
                  <span className="block w-4 h-0.5 bg-white"></span>
                </div>
              )}
            </button>

            {menuOpen && (
              <div className="absolute top-12 left-0 w-48 bg-white/30 backdrop-blur-lg border border-white/40 rounded-lg shadow-lg z-50">
                <ul className="text-black text-sm">
                  <li
                    className="px-4 py-2 hover:bg-white/50 cursor-pointer rounded-t-lg transition-all"
                    onClick={() => navigate("/profile")}
                  >
                    My Profile
                  </li>
                  <li className="px-4 py-2 hover:bg-white/50 cursor-pointer transition-all"
                    onClick={() => navigate("/orders")}>
                    Previous Orders
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-white/50 cursor-pointer rounded-b-lg transition-all"
                    onClick={handleLogout}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="flex-1 mx-4">
            <input
              type="text"
              placeholder="🔍"
              onFocus={() => setSearchOpen(true)}
              className="w-full px-3 py-1 bg-white/30 backdrop-blur-md border border-white/40 text-black placeholder-black rounded-[70px] focus:outline-none focus:ring-2 focus:ring-[#291C08]"
            />
          </div>

          <div className="z-50">{renderProfilePicture()}</div>
        </nav>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[999] flex flex-col bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center"
          style={{ backgroundColor: '#F8EDD6' }}
        >
          <div className="flex items-center p-4">
            <button
              onClick={() => setSearchOpen(false)}
              className="text-xl font-semibold mr-2"
            >
              <FaChevronLeft />
            </button>
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-3/4 px-3 py-2 border border-gray-300 rounded-full focus:outline-none"
            />
            <button
              onClick={handleSearch}
              className="ml-2 bg-tertiary text-white px-4 py-2 rounded-full"
            >
              Search
            </button>
          </div>
          <div className="p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Recent Searches</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {recentSearches.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-tertiary text-white text-sm cursor-pointer"
                  onClick={() => {
                    setSearchTerm(item);
                    navigate(`/search?query=${encodeURIComponent(item)}`);
                    setSearchOpen(false);
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
            <h2 className="text-lg font-semibold mb-2">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-tertiary text-white text-sm cursor-pointer"
                  onClick={() => {
                    setSearchTerm(item);
                    navigate(`/search?query=${encodeURIComponent(item)}`);
                    setSearchOpen(false);
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Carousel */}
      <div className="relative h-96 mt-[-65px] overflow-hidden z-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute top-0 left-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            style={{ backgroundImage: `url(${slide.image})`, borderRadius: '0 0 50px 50px' }}
            aria-label={slide.alt}
          />
        ))}
        <div className="absolute inset-0 bg-[#666666] opacity-50 z-5 rounded-b-[50px]"></div>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, dotIndex) => (
            <span
              key={dotIndex}
              onClick={() => setCurrentSlide(dotIndex)}
              className={`block w-3 h-3 rounded-full cursor-pointer ${dotIndex === currentSlide ? 'bg-white' : 'bg-gray-400'
                }`}
            />
          ))}
        </div>
        <div className="absolute bottom-10 left-4 z-10">
          <h2 className="text-white text-[2rem] font-bold drop-shadow-lg">
            {slides[currentSlide].title}
          </h2>
          <p className="text-white text-sm drop-shadow-lg">
            {slides[currentSlide].subtitle}
          </p>
        </div>
      </div>

      <ShopLocationSelector />

      {/* Offers Scrollable Carousel */}
      <div className="mt-10 px-4">
        <div className="flex space-x-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {[{ id: 1, title: "Order Now!!!", image: banner1 },
          { id: 2, title: "Flat ₹50 Off", image: banner2 }].map((offer) => (
            <div
              key={offer.id}
              className="min-w-[220px] snap-start bg-tertiary rounded-3xl shadow-md pl-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">{offer.title}</h4>
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-[7rem] h-28 rounded-3xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Sections */}
      <ProductsByCat title="Millet Specific" cat="Millet" onAddToCart={handleAddToCart} />
      <ProductsByCat title="Beverages" cat="Beverage" onAddToCart={handleAddToCart} />
      <ProductsByCat title="Snacks" cat="Snacks" onAddToCart={handleAddToCart} />
      <ProductsByCat title="Dessert" cat="Dessert" onAddToCart={handleAddToCart} />
      <ProductsByCat title="Fast Food" cat="Fast Food" onAddToCart={handleAddToCart} />

      {/* Render the cart pane fixed at the bottom */}
      <CartPane
        cartItems={cartItems}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onRemove={handleRemove}
      />

      {/* Millet Shakti Program */}
      <MissionShaktiCard />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;