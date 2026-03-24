import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaBox, FaClock, FaReceipt } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_API_URL || '';

const OrderDetails = () => {
  const { shopId, orderNo } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");

  // Helper function with better null checking for Decimal128 type
  const formatPrice = (price) => {
    if (!price) return '0.00';
    if (typeof price === 'object' && price.$numberDecimal) {
      return price.$numberDecimal;
    }
    return typeof price === 'number' ? price.toFixed(2) : price;
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const shopId = localStorage.getItem("selectedShop");
      if (!shopId) {
        setError("Please select a shop first to view the order");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/order/${shopId}/${orderNo}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOrder(response.data.order);
        const shopRes = await axios.get(`${API_URL}/shop/${response.data.order.shopId}`);
        setShopName(shopRes.data.shop?.name || "Unknown Shop");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(err.response?.data?.error || "Failed to fetch order details");
        setLoading(false);

        // If token expired
        if (err.response?.status === 401 || err.response?.status === 403) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
        }
      }
    };

    fetchOrderDetails();
  }, [orderNo, navigate]);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color class
  const getStatusColorClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED': return 'bg-green-500';
      case 'PLACED': return 'bg-yellow-500';
      case 'PREPARING': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center p-4">
      <div className="pt-8 pb-4 flex items-center">
        <button
          onClick={() => navigate('/orders')}
          className="p-3 bg-[#291C08] rounded-full text-white mr-4"
        >
          <FaChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-[#291C08] flex-1">Order Details</h1>
      </div>

      <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-lg">
        {loading ? (
          <p className="text-center py-8">Loading order details...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button
              className="mt-4 px-6 py-2 bg-[#291C08] text-white rounded-xl"
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </button>
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white/40 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Order #{order.orderNo || orderNo}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(order.orderStatus)} text-white`}>
                  {order.orderStatus || 'PLACED'}
                </span>
              </div>
              <p className="text-sm text-[#291C08]/70">
                Placed on: {formatDate(order.createdAt)}
              </p>
              <p className="text-sm text-[#291C08]/70">
                Shop: {shopName}
              </p>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <p className="text-xs text-[#291C08]/60">
                  Updated: {formatDate(order.updatedAt)}
                </p>
              )}
              {order.transactionId && (
                <p className="text-xs text-[#291C08]/60 mt-1">
                  Transaction ID: {order.transactionId}
                </p>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <FaBox className="text-[#291C08] mr-2" />
                <h4 className="font-semibold">Items</h4>
              </div>

              {order.items && order.items.length > 0 ? (
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="bg-white/50 rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">{item.prodName || 'Unknown Product'}</h5>
                        {/* <p className="text-xs text-[#291C08]/60">Product ID: {item.prodId || 'N/A'}</p> */}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Qty: {item.quantity || 0}</p>
                        {item.price && (
                          <p className="text-xs text-[#291C08]/70">₹{formatPrice(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#291C08]/70 text-center py-3">
                  No items found in this order.
                </p>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white/40 rounded-xl p-4 shadow-sm">
              <div className="flex items-center mb-3">
                <FaReceipt className="text-[#291C08] mr-2" />
                <h4 className="font-semibold">Order Summary</h4>
              </div>

              <div className="flex justify-between items-center font-bold border-t border-[#291C08]/10 pt-3 mt-3">
                <span>Total Amount</span>
                <span>₹{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {/* Delivery Address (if available) */}
            {order.deliveryAddress && (
              <div className="bg-white/40 rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                <p className="text-sm text-[#291C08]/70">
                  {order.deliveryAddress}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-[#291C08]/10 rounded-full flex items-center justify-center mb-3">
              <FaBox className="text-[#291C08]/50 text-2xl" />
            </div>
            <p className="text-[#291C08]/70">Order not found</p>
            <button
              className="mt-4 px-6 py-2 bg-[#291C08] text-white rounded-xl"
              onClick={() => navigate('/orders')}
            >
              Back to Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;