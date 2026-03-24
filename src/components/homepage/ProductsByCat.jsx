/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-key */
// ProductsByCat.jsx
import React, { useState, useEffect } from 'react';
import { AiOutlinePlus } from "react-icons/ai";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { checkStock } from '../../utils/inventoryCheck';
const API_URL = import.meta.env.VITE_API_URL;

const ProductsByCat = ({ title, cat, onAddToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_URL}/products/cat/${cat}`);
        setProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching product data');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cat]);

  if (loading) {
    return <div className="mt-8 px-7">Loading {title} products...</div>;
  }

  if (error) {
    return <div className="mt-8 px-7">Error: {error}</div>;
  }

  return (
    <div className="mt-8 px-7">
      <div className="flex items-center mb-4">
        <h3 className="text-2xl font-semibold text-tertiary mr-4">{title}</h3>
        <div className="flex-grow border-b-2 border-tertiary"></div>
        <button className="ml-4 text-tertiary font-semibold" onClick={() => navigate('/categories')}>See All</button>
      </div>
      <div className="flex flex-nowrap space-x-7 overflow-x-auto pb-4 scrollbar-hide">
        {products && products.length > 0 ? (
          products.slice(0, 5).map((product) => (
            <div className="flex-none w-[20%] pt-4">
              <div
                className="aspect-square rounded-[26px] relative bg-gray-100 overflow-visible cursor-pointer"
                onClick={() => navigate(`/product/${product._id || product.prodId}`)}
              >
                <img
                  src={product.prodImg}
                  alt={product.prodName}
                  className="w-full h-full object-cover rounded-[26px]"
                />
                <button
                  className="absolute -top-[5px] -right-[5px] bg-background text-tertiary text-3xl rounded-full border-4 border-tertiary w-7 h-7 flex items-center justify-center pointer-events-auto"
                  onClick={async (e) => {
                    e.stopPropagation();

                    const selectedShop = localStorage.getItem("selectedShop");
                    if (!selectedShop) {
                      alert("Please select a shop before adding items!");
                      return;
                    }

                    // try {
                      // const res = await axios.get(
                      //   `${API_URL}/inventory/${selectedShop}/product/${product.prodId}`
                      // );

                      // const { stock } = res.data;

                      // console.log("Available stock:", stock);

                      const stock = await checkStock(product.prodId);
                      if (stock === null) return;
                      
                      const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");
                      const cartItem = cartItems.find(i => i.prodId === product.prodId);
                      const currentQty = cartItem ? cartItem.quantity : 0;

                      if (stock < currentQty) {
                        alert(`Not enough stock for ${product.prodName} in this shop.`);
                        return;
                      }

                      onAddToCart(product);

                    // } catch (err) {
                      // console.error("Stock check failed:", err);
                      // alert("Unable to verify stock right now!");
                    // }
                  }}
                >
                  <AiOutlinePlus className='w-7 h-7' />
                </button>
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-tertiary">
                {product.prodName}
              </p>
            </div>

          ))
        ) : (
          <div>No products found in this category.</div>
        )}
      </div>
    </div>
  );
};

export default ProductsByCat;