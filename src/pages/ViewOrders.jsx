import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaBox } from 'react-icons/fa'; // Add this import
import axios from 'axios';
import Cookies from 'js-cookie';
import ParseJwt from '../utils/ParseJWT';

const API_URL = import.meta.env.VITE_API_URL;

const ViewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = Cookies.get('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Use the ParseJwt function that works in MyProfile
        const decoded = ParseJwt(token);
        console.log('Decoded token:', decoded);

        if (!decoded?.user?._id) {
          throw new Error('User ID not found in token');
        }

        // Fetch orders using the user ID from the decoded token
        const response = await axios.get(`${API_URL}/order/user/${decoded.user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrders(response.data.orders || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          Cookies.remove('token');
          navigate('/login');
        } else {
          setError(err.message || 'Failed to fetch orders');
          setLoading(false);
        }
      }
    };

    fetchOrders();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center p-4">
      <div className="pt-8 pb-4 flex items-center">
        <button 
          onClick={() => navigate('/profile')} // Change this to navigate to homepage
          className="p-3 bg-[#291C08] rounded-full text-white mr-4"
        >
          <FaChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-[#291C08] flex-1">My Orders</h1>
      </div>

      <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-lg">
        {loading ? (
          <p className="text-center py-8">Loading your orders...</p>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button 
              className="mt-4 px-6 py-2 bg-[#291C08] text-white rounded-xl"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div 
                key={order._id} 
                className="bg-white/40 rounded-xl p-4 shadow-sm"
                onClick={() => navigate(`/order/${order.shopId}/${order.orderNo}`)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Order #{order.orderId}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full bg-${order.orderStatus === 'DELIVERED' ? 'green' : order.orderStatus === 'PLACED' ? 'yellow' : order.orderStatus === 'PREPARING' ? 'blue' : 'gray'}-500 text-white`}>
                    {order.orderStatus}
                  </span>
                </div>
                <p className="text-sm text-[#291C08]/70">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex justify-between mt-2">
                  <p className="font-medium">₹{order.totalPrice.$numberDecimal || order.totalPrice}</p>
                  <button className="text-[#291C08] underline text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-[#291C08]/10 rounded-full flex items-center justify-center mb-3">
              <FaBox className="text-[#291C08]/50 text-2xl" />
            </div>
            <p className="text-[#291C08]/70">No orders found</p>
            <button 
              className="mt-4 px-6 py-2 bg-[#291C08] text-white rounded-xl"
              onClick={() => navigate('/homepage')}
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewOrders;
