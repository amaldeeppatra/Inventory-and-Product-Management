import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export const checkStock = async (productId) => {
  const shopId = localStorage.getItem("selectedShop");

  if (!shopId) {
    alert("Please select a shop first!");
    return null;
  }

  try {
    const response = await axios.get(`${API_URL}/inventory/${shopId}/product/${productId}`);
    // const data = await response.json();
    // console.log("Stock data:", data);
    console.log("Stock data:", response.data);
    return response.data.stock;
  } catch (error) {
    console.error("Error fetching stock:", error);
    return null;
  }
};