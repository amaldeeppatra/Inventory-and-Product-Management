import React, { useEffect, useState } from "react";
import axios from "axios";

const ShopLocationSelector = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(
    localStorage.getItem("selectedShop") || ""
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/shop/all`);
        setShops(res.data.shops);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching shops:", err);
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleSelect = (e) => {
    const shopId = e.target.value;
    setSelectedShop(shopId);
    localStorage.setItem("selectedShop", shopId);
  };

  return (
    <div className="px-4 mt-6">
      <label className="text-lg font-semibold text-tertiary">Select Shop</label>

      {loading ? (
        <p className="text-sm text-gray-600 mt-1">Loading shops...</p>
      ) : (
        <select
          value={selectedShop}
          onChange={handleSelect}
          className="w-full mt-2 p-3 rounded-xl bg-white border border-gray-300 text-gray-700 shadow-sm focus:ring-tertiary focus:border-tertiary"
        >
          <option value="">Choose a Shop</option>

          {shops.map((shop) => (
            <option key={shop._id} value={shop._id}>
              {shop.name} — {shop.address || "No address"}
            </option>
          ))}
        </select>
      )}

      {selectedShop && (
        <p className="mt-2 text-sm text-green-700">
          ✔ Selected shop saved!
        </p>
      )}
    </div>
  );
};

export default ShopLocationSelector;