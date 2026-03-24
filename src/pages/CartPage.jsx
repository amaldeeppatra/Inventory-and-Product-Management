import { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import ShreeAnnaAbhiyanLogo from '../resources/homepage/ShreeAnnaAbhiyanLogo.png';
import Cookies from 'js-cookie';
import ParseJwt from '../utils/ParseJWT';
import axios from 'axios';
import Footer from '../components/footer/Footer';
import { checkStock } from '../utils/inventoryCheck';

const API_URL = import.meta.env.VITE_API_URL;

const CartPage = () => {
  // ... all state and functions remain the same ...
  const [cartItems, setCartItems] = useState(() => {
    const storedCart = localStorage.getItem('cartItems');
    return storedCart ? JSON.parse(storedCart) : [];
  });

  const [allSuggestedItems, setAllSuggestedItems] = useState([]);
  const [randomSuggestions, setRandomSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingSuggestions(true);
      try {
        const response = await axios.get(`${API_URL}/products`);
        setAllSuggestedItems(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setAllSuggestedItems([
          { prodId: 1, prodName: 'Laddos', prodImg: 'https://i.imgur.com/eW3sP5H.jpeg', price: 15 },
          { prodId: 2, prodName: 'Cookies', prodImg: 'https://i.imgur.com/QyL7h2Q.jpeg', price: 20 },
          { prodId: 3, prodName: 'Papad', prodImg: 'https://i.imgur.com/2a1V22g.jpeg', price: 25 },
          { prodId: 4, prodName: 'Samosa', prodImg: 'https://i.imgur.com/5S8f2mU.jpeg', price: 15 },
          { prodId: 5, prodName: 'Mattri', prodImg: 'https://i.imgur.com/bX6f3yD.jpeg', price: 35 },
        ]);
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
    const interval = setInterval(getRandomSuggestions, 45000);
    return () => clearInterval(interval);
  }, [allSuggestedItems]);

  const getProductId = (product) => product._id || product.prodId;

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
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const addSuggestedItem = (item) => {
    const productId = getProductId(item);
    setCartItems(items => {
      const existingItem = items.find(i => getProductId(i) === productId);
      if (existingItem) {
        return items.map(i => getProductId(i) === productId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const price = item.price?.$numberDecimal ? parseFloat(item.price.$numberDecimal) : item.price;
      return [...items, { ...item, price, quantity: 1 }];
    });
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const navigate = useNavigate();
  const handleGoBack = () => navigate(-1);

  useEffect(() => { window.scrollTo(0, 0) }, []);

  const clearCart = () => setCartItems([]);

  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) { try { setUserInfo(ParseJwt(token)); } catch (e) { console.error('Token error:', e); } }
  }, []);

  const paymentHandler = async (e) => {
    e.preventDefault();

    const selectedShop = localStorage.getItem("selectedShop");
    if (!selectedShop) {
      alert("Please select a shop before placing an order!");
      return;
    }

    const amount = total * 100;

    const response = await fetch(`${API_URL}/order/${selectedShop}`, {
      method: 'POST',
      body: JSON.stringify({ amount, currency: 'INR', receipt: 'qwsaq1' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const order = await response.json();

    const options = {
      key: "rzp_test_FmFnhFzbQdnD1h",
      amount,
      currency: 'INR',
      name: "Shree Anna Abhiyan",
      description: "Millet Product Transaction",
      image: ShreeAnnaAbhiyanLogo,
      order_id: order.order.id,
      handler: async function (response) {
        const body = { ...response, cartItems, userId: userInfo?.user?._id, email: userInfo?.user?.email, name: userInfo?.user?.name, totalPrice: total };
        const validateRes = await fetch(`${API_URL}/order/validate/${selectedShop}`, {
          method: 'POST', body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
        });
        const jsonRes = await validateRes.json();
        if (jsonRes.message === 'success') {
          // await fetch(`${API_URL}/order/update-inventory`, {
          //   method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartItems }),
          // });
          clearCart();
          navigate('/order-success', { state: { orderNo: jsonRes.orderNo } });
        } else { console.error("Payment validation failed!"); }
      },
      prefill: { name: userInfo?.user?.name, email: userInfo?.user?.email, contact: "9000090000" },
      theme: { color: "#DE6B18" },
    };
    console.log(options);

    const rzp1 = new window.Razorpay(options);
    rzp1.on('payment.failed', (response) => alert(response.error.description));
    rzp1.open();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center space-x-3">
              <button onClick={handleGoBack}>
                <IoArrowBack className="text-2xl text-primary" />
              </button>
              <h1 className="text-xl font-bold text-primary">Your Cart</h1>
            </div>
            <button onClick={clearCart} className="bg-primary text-white px-5 py-2 rounded-full font-semibold text-sm shadow-lg">
              Clear Cart
            </button>
          </div>

          {/* --- MODIFIED: Added horizontal margin (mx-2) --- */}
          <div className="bg-accent rounded-3xl mb-10 shadow-xl overflow-hidden flex flex-col mx-2">
            <div className="p-5">
              <div className="flex justify-between items-center text-primary">
                <div className='font-bold'>
                  <h2 className="text-xl">Get more,</h2>
                  <p className="text-lg">For less!</p>
                </div>
                <div className="text-4xl font-extrabold text-right">40%<br />off!!!</div>
              </div>
            </div>
            <div className="bg-white">
              <button className="text-[#A24D10] w-full py-2.5 text-sm font-bold">
                View more coupons
              </button>
            </div>
          </div>

          {/* --- MODIFIED: Added horizontal margin (mx-2) --- */}
          <div className="bg-accent rounded-3xl p-5 mb-10 shadow-xl mx-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-primary">Review Your Order</h2>
              <span className="text-xs font-bold text-[#8C3F0B] bg-white px-3 py-1 rounded-md shadow-sm">{cartItems.length} Items</span>
            </div>
            {cartItems.length > 0 ? (
              cartItems.map(item => (
                <div key={getProductId(item)} className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <img src={item.prodImg} alt={item.prodName} className="w-12 h-12 rounded-lg object-cover mr-3" />
                    <span className="font-semibold text-base text-primary">{item.prodName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white text-[#123B33] rounded-full px-2 py-0.5 shadow-sm">
                      <button className="text-lg font-bold" onClick={() => handleDecrease(item)}>-</button>
                      <span className="font-bold text-base w-4 text-center">{item.quantity}</span>
                      <button className="text-lg font-bold" onClick={() => handleIncrease(item)}>+</button>
                    </div>
                    <span className="font-semibold text-base text-primary w-12 text-right">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              ))
            ) : <p className="text-center text-gray-500 py-4">Your cart is empty.</p>}
          </div>

          <div className="text-center mb-10">
            <p className="font-bold text-base text-[#A24D10]">Missing Something?</p>
            <p className="font-semibold text-sm text-[#A24D10] mb-4">Add more items!</p>
            <div className="flex justify-around">
              {loadingSuggestions ? (
                [...Array(3)].map((_, i) => <div key={i} className="w-24 h-32 bg-gray-200 rounded-2xl animate-pulse"></div>)
              ) : (
                randomSuggestions.map(item => (
                  <div key={getProductId(item)} className="w-24 text-center">
                    <div className="relative mb-1">
                      <img src={item.prodImg} alt={item.prodName} className="w-24 h-24 rounded-2xl object-cover shadow-md" />
                      <button onClick={() => addSuggestedItem(item)} className="absolute top-0 right-0 w-7 h-7 bg-[#291C08] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">+</button>
                    </div>
                    <p className="font-semibold text-sm text-[#291C08] truncate">{item.prodName}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <h2 className="text-xl font-bold text-[#291C08] mb-4 px-4">Bill Details</h2>
          {/* --- MODIFIED: Added horizontal margin (mx-2) --- */}
          <div className="bg-accent rounded-3xl p-5 mb-6 shadow-xl mx-2">
            <div className="space-y-3">
              {cartItems.map(item => (
                <div key={getProductId(item)} className="flex justify-between text-base">
                  <span className='font-medium text-primary'>{item.prodName}</span>
                  <span className="font-medium text-primary">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-primary/30 my-4"></div>
            <div className="flex justify-between font-bold text-lg">
              <span className="text-primary">Grand Total:</span>
              <span className='text-primary'>₹{total}</span>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={paymentHandler}
              disabled={cartItems.length === 0}
              className={`w-11/12 inline-block py-3.5 rounded-full text-lg font-bold text-white transition-colors shadow-lg ${cartItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#DE6B18] hover:bg-[#C1580D]'}`}
            >
              PLACE ORDER
            </button>
          </div>

          <div className="my-8">
            <h3 className="font-bold text-base text-[#291C08] mb-2">NOTE:</h3>
            <p className="text-xs text-[#291C08] leading-relaxed">
              Lorem ipsum odor amet, consectetuer adipiscing elit. Tortor consequat vivamus fusce, dignissim luctus dictum suscipit sed. Ultricies et aenean partrurient proin himenaeos curabitur luctus. Penatibus nascetur velit sit at condimentum semper ullamcorper et. Rhoncus blandit adipiscing egestas vel dignissim suscipit pulvinar interdum. Nec sapien arcu consectetur massa venenatis.
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default CartPage;