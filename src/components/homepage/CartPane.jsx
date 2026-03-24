/* eslint-disable react/prop-types */
// CartPane.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineDelete } from 'react-icons/ai';
import { FaShoppingCart, FaChevronUp } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CartPane = ({ cartItems, onIncrease, onDecrease, onRemove }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Calculate total items and price
    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const price = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotalItems(items);
    setTotalPrice(price);
  }, [cartItems]);

  if (cartItems.length === 0) return null; // Hide pane if cart is empty

  // Show only the first 2 items by default, unless expanded
  const displayedItems =
    cartItems.length > 2 && !isExpanded ? cartItems.slice(0, 2) : cartItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <AnimatePresence>
        {!isMinimized && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", bounce: 0.25 }}
            className="bg-white/95 backdrop-blur-md rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] mx-4 mb-4 overflow-hidden pointer-events-auto border border-[#291C08]/10"
          >
            {/* Cart header */}
            <div className="flex items-center justify-between p-4 border-b border-[#291C08]/10">
              <div className="flex items-center space-x-2">
                <div className="bg-[#291C08] p-2 rounded-full">
                  <FaShoppingCart className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#291C08]">Your Cart</h3>
                  <p className="text-sm text-gray-500">{totalItems} items</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaChevronUp className="text-[#291C08]" />
              </button>
            </div>
            
            {/* Cart items */}
            <div className={`${isExpanded ? 'max-h-60' : 'max-h-40'} overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-[#291C08]/20 scrollbar-track-transparent`}>
              {displayedItems.map((item) => (
                <motion.div 
                  key={item.prodId} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 border-b border-[#291C08]/10 hover:bg-[#291C08]/5 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img 
                        src={item.prodImg} 
                        alt={item.prodName} 
                        className="w-14 h-14 object-cover rounded-lg shadow-sm" 
                      />
                      <div className="absolute -top-2 -right-2 bg-[#291C08] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-[#291C08]">{item.prodName}</p>
                      <p className="text-sm text-[#291C08]/70">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => onDecrease(item)} 
                      className="w-7 h-7 rounded-full bg-[#291C08]/10 hover:bg-[#291C08]/20 flex items-center justify-center transition-colors"
                    >
                      <span className="text-[#291C08] font-bold">-</span>
                    </button>
                    <button 
                      onClick={() => onIncrease(item)} 
                      className="w-7 h-7 rounded-full bg-[#291C08]/10 hover:bg-[#291C08]/20 flex items-center justify-center transition-colors"
                    >
                      <span className="text-[#291C08] font-bold">+</span>
                    </button>
                    <button 
                      onClick={() => onRemove(item)} 
                      className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors"
                    >
                      <AiOutlineDelete className="text-red-500" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Show more/less button */}
            {cartItems.length > 2 && (
              <div className="text-center py-2 border-t border-[#291C08]/10">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-[#291C08] font-medium hover:underline transition-colors"
                >
                  {isExpanded ? 'Show Less' : `Show ${cartItems.length - 2} More Items`}
                </button>
              </div>
            )}
            
            {/* Checkout button */}
            <div className="p-4 bg-[#F8EDD6]/50">
              <button 
                className="w-full bg-[#291C08] text-white py-3 rounded-full font-medium shadow-md hover:shadow-lg transform hover:translate-y-[-2px] transition-all"
                onClick={() => navigate('/cart')}
              >
                Checkout · ₹{totalPrice.toFixed(2)}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimized cart button */}
      {isMinimized && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-4 right-4 bg-[#291C08] text-white p-4 rounded-full shadow-lg flex items-center space-x-2 pointer-events-auto"
          onClick={() => setIsMinimized(false)}
        >
          <FaShoppingCart />
          <span className="font-medium">{totalItems}</span>
          {/* <span className="font-medium">·</span> */}
          {/* <span className="font-medium">₹{totalPrice.toFixed(2)}</span> */}
        </motion.button>
      )}
    </div>
  );
};

export default CartPane;
