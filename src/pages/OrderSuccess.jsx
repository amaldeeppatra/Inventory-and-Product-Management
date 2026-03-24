import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft } from 'react-icons/fa';
import Lottie from 'lottie-react';
import successAnimation from '../resources/animations/success-animation.json';
import Skeleton from '@mui/material/Skeleton';
import Cookies from 'js-cookie';
import ParseJwt from '../utils/ParseJWT';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  
  // Fetch order details
  useEffect(() => {
  const fetchOrderDetails = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const decoded = ParseJwt(token);
      setUserInfo(decoded);

      // Get orderNo passed from previous page
      const orderNo = location.state?.orderNo;
      const selectedShop = localStorage.getItem("selectedShop");

      if (orderNo) {
        try {
          const response = await axios.get(
            `${API_URL}/order/${selectedShop}/${orderNo}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          const orderData = response.data.order;

          setOrderDetails({
            orderNo: orderData.orderNo,
            date: new Date(orderData.createdAt).toLocaleString(),
            items: orderData.items.length,
            total: parseFloat(
              orderData.totalPrice?.$numberDecimal || orderData.totalPrice
            ),
            products: orderData.items,
          });
        } catch (err) {
          console.error("Error fetching order by orderNo:", err);

          // FALLBACK in case API fails
          const cartItems =
            JSON.parse(localStorage.getItem("cartItems")) || [];

          setOrderDetails({
            orderNo: "N/A",
            date: new Date().toLocaleString(),
            items: cartItems.length,
            total: cartItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
            products: cartItems,
          });
        }
      } else {
        // If no orderNo available
        const cartItems =
          JSON.parse(localStorage.getItem("cartItems")) || [];

        setOrderDetails({
          orderNo: "N/A",
          date: new Date().toLocaleString(),
          items: cartItems.length,
          total: cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
          products: cartItems,
        });
      }
    } catch (error) {
      console.error("Error fetching order details:", error);

      const cartItems =
        JSON.parse(localStorage.getItem("cartItems")) || [];

      setOrderDetails({
        orderNo: "N/A",
        date: new Date().toLocaleString(),
        items: cartItems.length,
        total: cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
        products: cartItems,
      });
    } finally {
      setLoading(false);
    }
  };

  fetchOrderDetails();
}, [location]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center p-4">
        <div className="pt-8 pb-4 flex items-center">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="70%" height={40} className="ml-4" />
        </div>
        <div className="mx-auto max-w-md">
          <Skeleton variant="circular" width={150} height={150} className="mx-auto my-8" />
          <Skeleton variant="text" width="100%" height={40} className="mb-2" />
          <Skeleton variant="text" width="60%" height={30} className="mx-auto mb-8" />
          <Skeleton variant="rectangular" width="100%" height={150} className="rounded-xl mb-6" />
          <Skeleton variant="rectangular" width="100%" height={50} className="rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center px-4 pb-8">
      {/* Header */}
      <div className="pt-8 pb-4 flex items-center">
        <button 
          onClick={() => navigate('/homepage')}
          className="p-3 bg-[#291C08] rounded-full text-white mr-4"
        >
          <FaChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-[#291C08] flex-1">Order Confirmation</h1>
      </div>

      {/* Success Animation */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="w-32 h-32 mb-4">
          <Lottie 
            animationData={successAnimation} 
            loop={false} 
            autoplay={true}
          />
        </div>
        <h2 className="text-2xl font-bold text-[#291C08] text-center">Order Placed Successfully!</h2>
        <p className="text-[#291C08]/70 text-center mt-2">
          Your delicious food is on its way to you
        </p>
      </div>

      {/* Order Details Card */}
      <div className="mx-auto max-w-md bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-lg mb-6">
        <h3 className="text-lg font-semibold text-[#291C08] mb-3 border-b border-[#291C08]/30 pb-2">
          Order Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <p className="text-[#291C08]/70">Order Number</p>
            <p className="font-medium">{orderDetails?.orderNo || 'N/A'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#291C08]/70">Date & Time</p>
            <p className="font-medium">{orderDetails?.date || 'N/A'}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#291C08]/70">Items</p>
            <p className="font-medium">{orderDetails?.items || 0} items</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#291C08]/70">Total Amount</p>
            <p className="font-bold">₹{orderDetails?.total || 0}</p>
          </div>
        </div>
        
        {/* Product details */}
        {orderDetails?.products && orderDetails.products.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#291C08]/30">
            <h4 className="font-medium text-[#291C08] mb-2">Items Ordered</h4>
            {orderDetails.products.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-[#291C08]/10 last:border-b-0">
                <div className="flex items-center">
                  {item.prodImg && (
                    <img src={item.prodImg} alt={item.prodName} className="w-10 h-10 rounded-lg object-cover mr-2" />
                  )}
                  <span className="text-[#291C08]">{item.prodName}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-[#291C08] mr-2">x{item.quantity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mx-auto max-w-md space-y-3">
        <button 
          className="w-full py-3 flex items-center justify-center bg-white/50 backdrop-blur-md border border-[#291C08] text-[#291C08] rounded-xl"
          onClick={() => navigate('/homepage')}
        >
          Continue Shopping
        </button>
      </div>

      {/* Promotional Note - Moved to bottom after Continue Shopping button */}
      <div className="mx-auto max-w-md mt-8 text-center">
        <p className="mt-2 text-[0.9rem] text-[#291C08]">
          Thank you for ordering! With ❤️ from Milet Hub Cafe.
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;