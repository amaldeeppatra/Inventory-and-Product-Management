import React, { useState, useEffect } from "react";

// Dialog component for restocking
const RestockDialog = ({ isOpen, onClose, onConfirm, productName }) => {
  const [amount, setAmount] = useState(10); // Default minimum amount

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
        <h3 className="text-lg font-bold mb-4">Restock {productName}</h3>
        <p className="mb-4 text-sm text-gray-600">
          Enter the amount to add to inventory (minimum 10)
        </p>
        <input
          type="number"
          min="10"
          value={amount}
          onChange={(e) =>
            setAmount(Math.max(10, parseInt(e.target.value) || 10))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#291C08]"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(amount)}
            className="px-4 py-2 bg-[#291C08] text-white rounded-full hover:bg-[#3a2a10] transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Stock Item Component
const StockItem = ({ product, onRestock }) => {
  const [showDialog, setShowDialog] = useState(false);

  // Determine color based on stock level
  const getStockColor = (quantity) => {
    return quantity <= 5
      ? "bg-red-200 text-red-700"
      : "bg-gray-100 text-gray-700";
  };

  // Helper function to convert price if it's returned as a Decimal128 object
  const getPrice = (price) => {
    if (price && typeof price === "object" && price.$numberDecimal) {
      return parseFloat(price.$numberDecimal);
    }
    return parseFloat(price);
  };

  const handleRestockClick = () => {
    setShowDialog(true);
  };

  const handleConfirmRestock = (amount) => {
    onRestock(product.prodId, amount);
    setShowDialog(false);
  };

  return (
    <>
      <div
        className={`p-3 rounded-md mb-2 ${getStockColor(
          product.stock
        )} transition-all hover:shadow-md`}
      >
        <div className="flex items-center gap-3">
          <img
            src={product.prodImg}
            alt={product.prodName}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="flex-1">
            <div className="font-medium">{product.prodName}</div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Stock: {product.stock}</span>
              <span className="text-xs">ID: {product.prodId}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-semibold">
                ₹{getPrice(product.price)}
              </span>
              <button
                onClick={handleRestockClick}
                className="bg-[#291C08] text-white px-3 py-1 rounded-full text-sm hover:bg-[#3a2a10] transition-colors"
              >
                Restock
              </button>
            </div>
          </div>
        </div>
      </div>

      <RestockDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleConfirmRestock}
        productName={product.prodName}
      />
    </>
  );
};

const OrderCard = ({ order, onAccept }) => {
  // Helper function to convert totalPrice if it's returned as a Decimal128 object
  const getTotalPrice = (price) => {
    if (price && typeof price === "object" && price.$numberDecimal) {
      return parseFloat(price.$numberDecimal);
    }
    return parseFloat(price);
  };

  const handleAccept = () => {
    // Call the API to update the order status
    fetch(`http://localhost:5000/api/order/complete/${order.orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to update order");
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Order ${order.orderId} accepted`);
        // Remove this order from the UI
        onAccept(order.orderId);
      })
      .catch((err) => {
        console.error("Error updating order:", err);
      });
  };

  const handleDecline = () => {
    console.log(`Order ${order.orderId} declined`);
    // You can implement decline logic similarly if needed.
  };

  return (
    <div className="flex flex-col justify-between items-center bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-lg shadow-md mb-4 w-full transition-all hover:shadow-lg">
      {/* Order Details */}
      <div className="flex flex-wrap gap-4 items-center w-full">
        <span className="text-sm font-medium text-gray-700">
          Order Number: {order.orderNo}
        </span>
        <span className="text-sm text-gray-600">
          Items:{" "}
          {order.items
            .map((item) => `${item.prodName} (${item.quantity})`)
            .join(", ")}
        </span>
        <span className="text-sm font-semibold text-gray-800">
          Total: ₹{getTotalPrice(order.totalPrice)}
        </span>
        <span className="text-sm text-gray-600">
          User ID: {order.userId.name}
        </span>
        <span className="text-sm text-gray-500 mr-4">
          Status: {order.orderStatus}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-4 w-full justify-end">
        <button
          onClick={handleAccept}
          className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition"
        >
          Accept
        </button>
        <button
          onClick={handleDecline}
          className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

const LiveOrders = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch orders
    const fetchOrders = fetch(
      "http://localhost:5000/api/order/get-placed"
    ).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      return response.json();
    });

    // Fetch all products to get their stock information
    const fetchProducts = fetch("http://localhost:5000/api/products").then(
      (response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        return response.json();
      }
    );

    // Wait for both requests to complete
    Promise.all([fetchOrders, fetchProducts])
      .then(([ordersData, productsData]) => {
        setOrders(ordersData);
        // Sort products by stock level (low to high)
        const sortedProducts = [...productsData].sort(
          (a, b) => a.stock - b.stock
        );
        setProducts(sortedProducts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Callback to remove order from the UI after it's accepted
  const handleOrderAccepted = (orderId) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.orderId !== orderId)
    );
  };

  // Handle restock functionality with new API call
  const handleRestock = (prodId, amount) => {
    fetch(`http://localhost:5000/product/restock/${prodId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: amount }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to restock product");
        }
        return response.json();
      })
      .then((data) => {
        // Update the product's stock using the data returned from the API
        setProducts((prevProducts) =>
          prevProducts
            .map((product) =>
              product.prodId === prodId
                ? { ...product, stock: data.stock }
                : product
            )
            .sort((a, b) => a.stock - b.stock)
        );
      })
      .catch((error) => {
        console.error("Error restocking product:", error);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#291C08]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8EDD6] bg-no-repeat bg-cover bg-center p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-[#291C08]">
        Dashboard
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Live Orders Section - Left Side */}
        <div className="w-full md:w-2/3">
          <h2 className="text-xl font-bold mb-4 text-[#291C08]">Live Orders</h2>
          <div className="bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-lg shadow">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No active orders at the moment
              </p>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onAccept={handleOrderAccepted}
                />
              ))
            )}
          </div>
        </div>

        {/* Stock Information - Right Side */}
        <div className="w-full md:w-1/3">
          <h2 className="text-xl font-bold mb-4 text-[#291C08]">
            Inventory Stock
          </h2>
          <div className="bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-lg shadow max-h-[80vh] overflow-y-auto">
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No product information available
              </p>
            ) : (
              products.map((product) => (
                <StockItem
                  key={product.prodId}
                  product={product}
                  onRestock={handleRestock}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveOrders;
