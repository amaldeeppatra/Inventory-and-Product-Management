import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaEdit, FaBox, FaSignOutAlt, FaBell } from 'react-icons/fa';
import { CgProfile } from "react-icons/cg";
import axios from 'axios';
import Cookies from 'js-cookie';
import Skeleton from '@mui/material/Skeleton';
import ParseJwt from '../utils/ParseJWT';

const API_URL = import.meta.env.VITE_API_URL;

const MyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = ParseJwt(token);
        setUserInfo(decoded);
        console.log('Decoded user info:', decoded);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      // Redirect to login if no token found
      navigate('/login');
    }
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Fetch user orders when orders tab is activated
  useEffect(() => {
    const fetchOrders = async () => {
      if (!userInfo?.user?._id) return;
      console.log('Fetching orders for user ID:', userInfo.user._id);
      
      setOrdersLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${API_URL}/order/user/${userInfo.user._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.orders) {
          // Sort orders by date (newest first) and take only the last 3
          const sortedOrders = response.data.orders.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ).slice(0, 3);
          
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [userInfo, activeTab]);

  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem("selectedShop");
    navigate('/login');
  };

  // Format date string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get order status styling
  const getStatusStyle = (status) => {
    switch(status) {
      case 'DELIVERED':
        return 'bg-green-500 text-white';
      case 'PLACED':
        return 'bg-yellow-500 text-white';
      case 'PREPARING':
        return 'bg-blue-500 text-white';
      case 'CANCELLED':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Function to render profile picture
  const renderProfilePicture = () => {
    if (userInfo?.user?.avatar) {
      // If profile picture exists in the token, display it
      return (
        <img 
          src={userInfo.user.avatar} 
          alt="Profile"
          className="w-14 h-14 rounded-full object-cover"
        />
      );
    } else if (userInfo?.user?.name) {
      // If no profile picture but name exists, show initials
      const initials = userInfo.user.name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase();
      
      return (
        <div className="w-14 h-14 bg-[#291C08] rounded-full flex items-center justify-center text-white text-xl font-bold">
          {initials}
        </div>
      );
    } else {
      // Fallback to icon
      return (
        <div className="bg-[#291C08] p-2 rounded-full shadow-md">
          <CgProfile className="text-4xl text-white" />
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center p-4">
        <div className="pt-8 pb-4 flex items-center">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="70%" height={40} className="ml-4" />
        </div>
        <div className="bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-lg mt-4">
          <Skeleton variant="text" width="40%" height={30} />
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="80%" height={30} />
          <Skeleton variant="rectangular" width="100%" height={150} className="mt-4 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center">
      {/* Header */}
      <div className="pt-8 pb-4 px-4 flex items-center">
        <button 
          onClick={() => navigate('/homepage')}
          className="p-3 bg-[#291C08] rounded-full text-white mr-4"
        >
          <FaChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-[#291C08] flex-1">My Profile</h1>
      </div>

      {/* Profile Header Card */}
      <div className="mx-4 bg-white/30 backdrop-blur-lg rounded-3xl p-5 shadow-lg">
        <div className="flex items-center">
          {renderProfilePicture()}
          <div className="ml-4">
            <h2 className="text-xl font-bold text-[#291C08]">{userInfo?.user?.name || 'User'}</h2>
          </div>
          <button 
            className="ml-auto p-2 bg-[#291C08] rounded-full text-white"
            onClick={() => setActiveTab('edit')}
          >
            <FaEdit />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-6 px-4 flex space-x-2">
        <button 
          className={`flex-1 py-3 rounded-t-lg font-medium text-center transition-colors ${
            activeTab === 'profile' 
              ? 'bg-white/30 backdrop-blur-lg text-[#291C08] border-b-2 border-[#291C08]' 
              : 'bg-white/10 backdrop-blur-lg text-[#291C08]/70'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`flex-1 py-3 rounded-t-lg font-medium text-center transition-colors ${
            activeTab === 'orders' 
              ? 'bg-white/30 backdrop-blur-lg text-[#291C08] border-b-2 border-[#291C08]' 
              : 'bg-white/10 backdrop-blur-lg text-[#291C08]/70'
          }`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px] mx-4 bg-white/30 backdrop-blur-lg rounded-b-3xl p-6 shadow-lg">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-semibold text-[#291C08] mb-3 border-b border-[#291C08]/30 pb-2">
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#291C08]/70">Full Name</p>
                  <p className="font-medium">{userInfo?.user?.name || 'User Name'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#291C08]/70">Email</p>
                  <p className="font-medium">{userInfo?.user?.email || 'email@example.com'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#291C08]/70">Phone</p>
                  <p className="font-medium">{userInfo?.user?.phone || 'Not provided'}</p>
                </div>
                {/* {userInfo?.user?.address && (
                  <div>
                    <p className="text-sm text-[#291C08]/70">Address</p>
                    <p className="font-medium">{userInfo.user.address}</p>
                  </div>
                )} */}
              </div>
            </div>

            {/* Preferences */}
            {/* <div>
              <h3 className="text-lg font-semibold text-[#291C08] mb-3 border-b border-[#291C08]/30 pb-2">
                Preferences
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p>Notifications</p>
                  <div className="relative inline-block w-10 h-5 rounded-full bg-[#291C08]/30">
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      defaultChecked={true}
                    />
                    <span className="absolute cursor-pointer top-0.5 left-0.5 bg-[#291C08] w-4 h-4 rounded-full transition-all duration-300 transform translate-x-5"></span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p>Email Updates</p>
                  <div className="relative inline-block w-10 h-5 rounded-full bg-[#291C08]/30">
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      defaultChecked={false}
                    />
                    <span className="absolute cursor-pointer top-0.5 left-0.5 bg-[#291C08] w-4 h-4 rounded-full transition-all"></span>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Account Actions */}
            <div className="">
              {/* <button 
                className="w-full py-3 flex items-center justify-center bg-[#291C08] text-white rounded-xl mb-3"
                onClick={() => setActiveTab('orders')}
              >
                <FaBox className="mr-2" /> My Orders
              </button> */}
              <button 
                className="w-full py-3 flex items-center justify-center bg-red-600 text-white rounded-xl"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mr-2" /> Logout
              </button>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h3 className="text-lg font-semibold text-[#291C08] mb-3 border-b border-[#291C08]/30 pb-2">
              Recent Orders
            </h3>
            
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="bg-white/40 rounded-xl p-4 shadow-sm">
                    <Skeleton variant="text" width="60%" height={24} className="mb-2" />
                    <Skeleton variant="text" width="40%" height={16} className="mb-2" />
                    <div className="flex justify-between mt-2">
                      <Skeleton variant="text" width="20%" height={20} />
                      <Skeleton variant="text" width="30%" height={20} />
                    </div>
                  </div>
                ))}
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
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-sm text-[#291C08]/70">
                      {formatDate(order.createdAt)}
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
            
            {orders.length > 0 && (
              <button 
                className="w-full mt-4 py-3 flex items-center justify-center bg-[#291C08] text-white rounded-xl"
                onClick={() => navigate('/orders')}
              >
                <FaBox className="mr-2" />View All Orders
              </button>
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#291C08] mb-3 border-b border-[#291C08]/30 pb-2">
              Edit Profile
            </h3>
            
            {/* Profile Picture Edit */}
            {/* <div className="flex flex-col items-center mb-4">
              <div className="relative">
                {renderProfilePicture()}
                <button className="absolute right-0 bottom-0 p-1 bg-[#291C08] rounded-full text-white text-xs">
                  <FaEdit />
                </button>
              </div>
              <p className="text-sm text-[#291C08]/70 mt-2">Change Profile Picture</p>
            </div> */}
            
            <div>
              <label className="block text-sm text-[#291C08]/70 mb-1">Full Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#291C08]"
                defaultValue={userInfo?.user?.name || ''}
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#291C08]/70 mb-1">Email</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#291C08]"
                defaultValue={userInfo?.user?.email || ''}
                disabled
              />
              <p className="text-xs text-[#1e1507] mt-1">Email cannot be changed*</p>
            </div>
            
            <div>
              <label className="block text-sm text-[#291C08]/70 mb-1">Phone Number</label>
              <input 
                type="tel" 
                className="w-full px-3 py-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#291C08]"
                defaultValue={userInfo?.user?.phone || ''}
              />
            </div>
            
            {/* <div>
              <label className="block text-sm text-[#291C08]/70 mb-1">Address</label>
              <textarea 
                className="w-full px-3 py-2 bg-white/50 backdrop-blur-md border border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#291C08]"
                defaultValue={userInfo?.user?.address || ''}
                rows="3"
              />
            </div> */}
            
            <div className="pt-4 flex space-x-3">
              <button 
                className="flex-1 py-3 bg-[#291C08] text-white rounded-xl"
                onClick={() => {
                  // Save logic would go here
                  setActiveTab('profile');
                }}
              >
                Save Changes
              </button>
              <button 
                className="flex-1 py-3 bg-[#291C08]/30 text-[#291C08] rounded-xl"
                onClick={() => setActiveTab('profile')}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      {/* <div className="mx-4 mt-6 bg-white/30 backdrop-blur-lg rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#291C08]">Notifications</h3>
          <FaBell className="text-[#291C08]" />
        </div>
        
        <div className="space-y-3">
          <div className="bg-white/40 p-3 rounded-xl">
            <p className="font-medium">Your order #1001 has been delivered!</p>
            <p className="text-sm text-[#291C08]/70">3 hours ago</p>
          </div>
          <div className="bg-white/40 p-3 rounded-xl">
            <p className="font-medium">Special offer: Get 10% off on all millet products</p>
            <p className="text-sm text-[#291C08]/70">Yesterday</p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default MyProfile;