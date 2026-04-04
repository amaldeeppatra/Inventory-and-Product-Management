/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
/**
 * SellerKiosk.jsx
 *
 * Payment flows:
 *  • Cash / Card  — single "Preview Bill" button → CashModal
 *                   Inside CashModal the cashier picks Cash or Card:
 *                     Cash → enter tendered → calculate change → confirm
 *                     Card → instruction to hand terminal → confirm receipt
 *                   Both record via POST /seller/order/validate/:shopId
 *  • UPI / QR     — separate button → UpiModal → dynamic QR → cashier ticks
 *                   "received" → confirm
 *
 *  On success → navigate('/seller/order-success', { state: { orderNo } })
 *
 * Install: npm install qrcode
 * Env:     VITE_API_URL, VITE_SHOP_UPI_VPA, VITE_SHOP_NAME
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from 'qrcode';
import {
  FiSearch, FiX, FiShoppingCart, FiCheck, FiTrash2, FiPrinter,
} from 'react-icons/fi';
import { MdPointOfSale } from 'react-icons/md';
import { BsCashCoin, BsCreditCard2Front } from 'react-icons/bs';
import { checkStock } from '../../../utils/inventoryCheck';

// ── Inline UPI icon (avoids react-icons/si version issues) ───────────────────
const UpiIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="currentColor" className={className}>
    <path d="M20 3L5 20l15 17 15-17L20 3zm0 6l9 11-9 11-9-11 9-11z" />
  </svg>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL;
const SHOP_UPI_VPA = import.meta.env.VITE_SHOP_UPI_VPA || 'shopname@upi';
const SHOP_NAME = import.meta.env.VITE_SHOP_NAME || 'Shree Anna Abhiyan';
const CATEGORIES = ['All', 'Millet', 'Beverage', 'Snacks', 'Dessert', 'Fast Food'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);
const getProductId = (p) => p.prodId || p._id;
const getPrice = (p) => p.price?.$numberDecimal ? parseFloat(p.price.$numberDecimal) : parseFloat(p.price) || 0;
const buildUpiUri = (vpa, name, amount, ref) =>
  `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + ref)}&tr=${encodeURIComponent(ref)}`;

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
);

const getTokenFromCookie = () => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie || '';
  const match = cookie.match(/(?:^|;\s*)(auth_token|token)=([^;]+)/);
  return match ? decodeURIComponent(match[2]) : null;
};

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    getTokenFromCookie() ||
    null
  );
};

const buildAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── PrintableReceipt ──────────────────────────────────────────────────────────
export const PrintableReceipt = ({ cartItems, total, customerName, orderRef, date, cashTendered, subMethod }) => {
  const change = cashTendered > 0 ? cashTendered - total : null;
  return (
    <div id="printable-receipt" className="font-mono text-[13px] text-gray-900 w-full max-w-[320px] mx-auto">
      <style>{`
        @media print {
          body > *:not(#print-portal) { display: none !important; }
          #print-portal, #printable-receipt { display: block !important; }
          #printable-receipt { width: 80mm; font-size: 12px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="text-center mb-3">
        <p className="text-base font-bold uppercase tracking-wide">{SHOP_NAME}</p>
        <p className="text-xs text-gray-400">Tax Invoice / Cash Memo</p>
        <div className="border-t border-dashed border-gray-300 mt-2 mb-1" />
        <p className="text-xs text-gray-400">{date}</p>
        {orderRef && <p className="text-xs text-gray-400">Ref: {orderRef}</p>}
        {customerName && <p className="text-xs text-gray-400">Customer: {customerName}</p>}
        <div className="border-t border-dashed border-gray-300 mt-2" />
      </div>
      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="border-b border-dashed border-gray-300">
            <th className="text-left py-1 font-bold">Item</th>
            <th className="text-center py-1 font-bold w-8">Qty</th>
            <th className="text-right py-1 font-bold">Amt</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={getProductId(item)}>
              <td className="py-0.5 text-left pr-1 truncate max-w-[130px]">{item.prodName}</td>
              <td className="py-0.5 text-center">{item.quantity}</td>
              <td className="py-0.5 text-right whitespace-nowrap">₹{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
        <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
        <div className="flex justify-between text-xs text-gray-500"><span>Payment</span><span className="uppercase">{subMethod || 'CASH'}</span></div>
        {subMethod === 'cash' && cashTendered > 0 && <>
          <div className="flex justify-between text-xs"><span>Cash Tendered</span><span>₹{cashTendered.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs font-semibold"><span>Change</span><span>₹{(change || 0).toFixed(2)}</span></div>
        </>}
      </div>
      <div className="text-center mt-4 text-[11px] text-gray-400">
        <div className="border-t border-dashed border-gray-300 mb-2" />
        <p>Thank you for your purchase!</p>
        <p>Powered by {SHOP_NAME}</p>
      </div>
    </div>
  );
};

// ── CashModal ─────────────────────────────────────────────────────────────────
const OrderSuccessModal = ({ data, onClose, onViewOrders, onOpenPage }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#DE6B18]/10 text-[#DE6B18]">
          <FiCheck size={28} />
        </div>
        <h2 className="text-xl font-bold text-[#291C08] mb-2">Order Recorded</h2>
        <p className="text-sm text-gray-500 mb-5">The order has been successfully recorded for the cashier kiosk.</p>
        <div className="grid gap-3 text-left bg-[#F9F6F1] rounded-3xl p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Order No.</span><span className="font-semibold text-[#291C08]">{data.orderNo}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Payment</span><span className="font-semibold text-[#291C08]">{data.paymentMethod?.toUpperCase()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total</span><span className="font-semibold text-[#291C08]">{fmt(data.total)}</span>
          </div>
          {data.customerName && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Customer</span><span className="font-semibold text-[#291C08]">{data.customerName}</span>
            </div>
          )}
        </div>
        <div className="grid gap-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#291C08] text-white font-semibold"
          >
            New Order
          </button>
          <button
            onClick={onViewOrders}
            className="w-full py-3 rounded-xl border border-[#291C08] text-[#291C08] font-semibold"
          >
            View Orders
          </button>
        </div>
      </div>
    </div>
  </div>
);

const CashModal = ({ cartItems, total, customerName, orderRef, onConfirm, onCancel, confirming }) => {
  const [subMethod, setSubMethod] = useState('cash');
  const [tendered, setTendered] = useState('');

  const change = subMethod === 'cash' && tendered !== '' ? parseFloat(tendered) - total : null;
  const canConfirm = !confirming && (
    subMethod === 'card' ||
    (tendered !== '' && parseFloat(tendered) >= total)
  );
  const date = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BsCashCoin size={20} className="text-[#DE6B18]" />
            <h2 className="font-bold text-[#291C08] text-lg">Bill & Payment</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="px-6 pt-4 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Payment Method</p>
          <div className="flex gap-2">
            {[
              { key: 'cash', label: 'Cash', icon: <BsCashCoin size={15} /> },
              { key: 'card', label: 'Card', icon: <BsCreditCard2Front size={15} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setSubMethod(key); setTendered(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                  subMethod === key
                    ? 'border-[#DE6B18] bg-[#FFF3E8] text-[#DE6B18]'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PrintableReceipt
            cartItems={cartItems}
            total={total}
            customerName={customerName}
            orderRef={orderRef}
            date={date}
            cashTendered={subMethod === 'cash' ? parseFloat(tendered) || 0 : 0}
            subMethod={subMethod}
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50 rounded-b-3xl space-y-3">
          {subMethod === 'cash' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Cash Tendered by Customer
              </label>
              <input
                type="number"
                min={total}
                value={tendered}
                autoFocus
                onChange={(e) => setTendered(e.target.value)}
                placeholder={`Enter amount (min ₹${total.toFixed(2)})`}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#DE6B18]/40 bg-white"
              />
              {change !== null && (
                <div className={`mt-2 flex justify-between text-sm font-semibold px-3 py-2 rounded-xl ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <span>{change >= 0 ? '← Change to return' : '⚠ Amount short'}</span>
                  <span>{fmt(Math.abs(change))}</span>
                </div>
              )}
            </div>
          )}

          {subMethod === 'card' && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <BsCreditCard2Front size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Hand the terminal to the customer</p>
                <p className="text-xs text-blue-500 mt-0.5 leading-relaxed">
                  Ask the customer to tap / swipe / insert their card. Confirm below once the terminal shows a successful transaction.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all"
            >
              <FiPrinter size={15} /> Print Bill
            </button>
            <button
              onClick={() => onConfirm({ subMethod, cashTendered: parseFloat(tendered) || 0 })}
              disabled={!canConfirm}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                canConfirm ? 'bg-[#DE6B18] hover:bg-[#C1580D] active:scale-95 shadow-md' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {confirming
                ? <><Spinner /> Recording...</>
                : subMethod === 'cash'
                  ? <><FiCheck size={16} /> Cash Received — Confirm</>
                  : <><FiCheck size={16} /> Card Received — Confirm</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── UpiModal ──────────────────────────────────────────────────────────────────
const UpiModal = ({ total, customerName, txnRef, onConfirm, onCancel, confirming }) => {
  const upiUri = buildUpiUri(SHOP_UPI_VPA, SHOP_NAME, total, txnRef);
  const [verified, setVerified] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 200, margin: 2,
      color: { dark: '#1a0033', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl).catch(console.error);
  }, [upiUri]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <UpiIcon size={18} className="text-[#5F259F]" />
            <h2 className="font-bold text-[#291C08] text-lg">UPI Payment</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiX size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center px-6 py-5 gap-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Scan with any UPI app</p>
          <div className="p-4 rounded-2xl border-2 border-[#5F259F]/20 bg-gradient-to-br from-[#f3eeff] to-white shadow-inner">
            {qrDataUrl
              ? <img src={qrDataUrl} alt="UPI QR" width={200} height={200} />
              : <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse text-gray-300 text-sm">Generating QR...</div>
            }
          </div>
          <div className="bg-[#FFF3E8] px-6 py-2 rounded-full">
            <span className="text-[#DE6B18] font-extrabold text-2xl tracking-tight">{fmt(total)}</span>
          </div>
          <div className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Pay to</span>
              <span className="font-semibold text-gray-700">{SHOP_UPI_VPA}</span>
            </div>
            {customerName && (
              <div className="flex justify-between">
                <span className="text-gray-400">Customer</span>
                <span className="font-semibold text-gray-700">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Ref</span>
              <span className="font-mono text-gray-500 text-[10px]">{txnRef}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            Ask the customer to scan and pay. Once you see the credit in your UPI app, tick below and confirm.
          </p>
          <label className="flex items-center gap-2 cursor-pointer select-none w-full">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="w-4 h-4 rounded accent-[#DE6B18] flex-shrink-0"
            />
            <span className="text-sm font-semibold text-[#291C08]">I have received the payment in my UPI app</span>
          </label>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={() => onConfirm()}
            disabled={!verified || confirming}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all ${
              verified && !confirming
                ? 'bg-[#5F259F] hover:bg-[#4a1d7a] active:scale-95 shadow-md'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {confirming ? <><Spinner /> Recording...</> : <><FiCheck size={16} /> Confirm UPI Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── BillingPanel ──────────────────────────────────────────────────────────────
const BillingPanel = ({ cartItems, total, onInitiatePayment, onClear, confirming }) => {
  const [customerName, setCustomerName] = useState('');
  const canProceed = cartItems.length > 0 && !confirming;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
          Customer Name <span className="text-gray-300 font-normal normal-case">(optional)</span>
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Walk-in customer"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#DE6B18]/40"
        />
      </div>
      <div className="bg-[#FFF8F1] rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Bill Summary</p>
        <div className="space-y-1.5 mb-3">
          {cartItems.length === 0
            ? <p className="text-xs text-gray-300 text-center py-2">No items yet</p>
            : cartItems.map((item) => (
                <div key={getProductId(item)} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate flex-1 mr-2">{item.prodName} × {item.quantity}</span>
                  <span className="font-medium text-[#291C08] flex-shrink-0">{fmt(item.price * item.quantity)}</span>
                </div>
              ))
          }
        </div>
        <div className="border-t border-[#DE6B18]/20 pt-3 flex justify-between items-center">
          <span className="font-bold text-[#291C08]">Grand Total</span>
          <span className="font-extrabold text-[#DE6B18] text-xl">{fmt(total)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClear}
          disabled={cartItems.length === 0}
          className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiTrash2 size={14} />
        </button>
        <button
          onClick={() => onInitiatePayment({ paymentMethod: 'cash', customerName })}
          disabled={!canProceed}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
            canProceed ? 'bg-[#291C08] hover:bg-[#3d2a0f] active:scale-95' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {confirming ? <Spinner /> : <BsCashCoin size={14} />}
          Cash / Card
        </button>
        <button
          onClick={() => onInitiatePayment({ paymentMethod: 'upi', customerName })}
          disabled={!canProceed}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border-2 ${
            canProceed
              ? 'border-[#5F259F] text-[#5F259F] bg-[#f3eeff] hover:bg-[#eadaff] active:scale-95'
              : 'border-gray-200 text-gray-400 bg-white cursor-not-allowed'
          }`}
        >
          <UpiIcon size={13} />
          UPI / QR
        </button>
      </div>
    </div>
  );
};

const SellerKiosk = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [cartItems, setCartItems] = useState(() => {
    try { const s = sessionStorage.getItem('sellerKioskCart'); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('sellerKioskCart', JSON.stringify(cartItems)); }
    catch {}
  }, [cartItems]);

  const [confirming, setConfirming] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [orderSuccessData, setOrderSuccessData] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const shopId = localStorage.getItem('selectedShop');

  const txnRef = useRef(`SK-${Date.now().toString(36).toUpperCase()}`);
  const refreshTxnRef = () => { txnRef.current = `SK-${Date.now().toString(36).toUpperCase()}`; };

  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await axios.get(`${API_URL}/products`);
        const data = res.data.products || res.data || [];
        setProducts(data.map((p) => ({ ...p, prodId: p.prodId || p._id, price: getPrice(p) })));
      } catch (e) {
        console.error('Products fetch failed:', e);
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((p) =>
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.prodName?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [products, searchTerm, activeCategory],
  );

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const findCartItem = useCallback((p) => cartItems.find((i) => getProductId(i) === getProductId(p)), [cartItems]);

  const handleAdd = useCallback(async (product) => {
    if (!shopId) return alert('No shop selected.');
    const stock = await checkStock(product.prodId);
    if (!stock) return alert(`${product.prodName} is out of stock.`);
    setCartItems((prev) => {
      const ex = prev.find((i) => getProductId(i) === getProductId(product));
      if (ex) {
        if (ex.quantity >= stock) { alert(`Only ${stock} in stock.`); return prev; }
        return prev.map((i) => getProductId(i) === getProductId(product) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { prodId: getProductId(product), prodImg: product.prodImg, prodName: product.prodName, price: product.price, quantity: 1 }];
    });
  }, [shopId]);

  const handleIncrease = useCallback(async (product) => {
    const stock = await checkStock(getProductId(product));
    if (!stock) return;
    const cur = findCartItem(product)?.quantity || 0;
    if (cur + 1 > stock) return alert(`Only ${stock} in stock.`);
    setCartItems((prev) => prev.map((i) => getProductId(i) === getProductId(product) ? { ...i, quantity: i.quantity + 1 } : i));
  }, [findCartItem]);

  const handleDecrease = useCallback((product) => {
    setCartItems((prev) =>
      prev.map((i) => getProductId(i) === getProductId(product) ? { ...i, quantity: i.quantity - 1 } : i)
          .filter((i) => i.quantity > 0),
    );
  }, []);

  const handleRemove = useCallback((product) => {
    setCartItems((prev) => prev.filter((i) => getProductId(i) !== getProductId(product)));
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    sessionStorage.removeItem('sellerKioskCart');
    refreshTxnRef();
  }, []);

  const recordOrder = useCallback(async ({
    customerName, paymentMethod, paymentRef, cashTendered, changeReturned,
  }) => {
    const payload = {
      cartItems,
      totalPrice: cartTotal,
      paymentMethod,
      orderRef: txnRef.current,
      razorpay_order_id: txnRef.current,
      razorpay_payment_id: paymentRef,
      cashTendered,
      changeReturned,
    };

    const res = await fetch(`${API_URL}/seller/order/validate/${shopId}`, {
      method: 'POST',
      credentials: 'include',
      headers: buildAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw new Error(`Validate failed: ${res.status} ${errorBody?.message || ''}`.trim());
    }
    return res.json();
  }, [cartItems, cartTotal, shopId]);

  const handleInitiatePayment = ({ paymentMethod, customerName }) => {
    if (!shopId || !cartItems.length) return;
    setPendingPayment({ paymentMethod, customerName });
    setActiveModal(paymentMethod === 'upi' ? 'upi' : 'cash');
  };

  const handleCashCardConfirm = async ({ subMethod, cashTendered }) => {
    setConfirming(true);
    try {
      const { customerName } = pendingPayment;
      const orderRef = txnRef.current;
      const result = await recordOrder({
        customerName,
        paymentMethod: subMethod,
        paymentRef: `OFFLINE_${subMethod.toUpperCase()}_${Date.now()}`,
        cashTendered: subMethod === 'cash' ? cashTendered : 0,
        changeReturned: subMethod === 'cash' ? Math.max(0, cashTendered - cartTotal) : 0,
      });

      if (result.message === 'success') {
        setActiveModal(null);
        setOrderSuccessData({
          orderNo: result.orderNo,
          paymentMethod: subMethod,
          total: cartTotal,
          customerName,
          orderRef,
        });
        handleClearCart();
        setCartOpen(false);
        refreshTxnRef();
      } else {
        alert('Could not record order. Please retry.');
      }
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please retry.');
    } finally {
      setConfirming(false);
    }
  };

  const handleUpiConfirm = async () => {
    setConfirming(true);
    try {
      const { customerName } = pendingPayment;
      const orderRef = txnRef.current;
      const result = await recordOrder({
        customerName,
        paymentMethod: 'upi',
        paymentRef: `OFFLINE_UPI_${txnRef.current}_${Date.now()}`,
        cashTendered: 0,
        changeReturned: 0,
      });

      if (result.message === 'success') {
        setActiveModal(null);
        setOrderSuccessData({
          orderNo: result.orderNo,
          paymentMethod: 'upi',
          total: cartTotal,
          customerName,
          orderRef,
        });
        handleClearCart();
        setCartOpen(false);
        refreshTxnRef();
      } else {
        alert('Could not record order. Please retry.');
      }
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please retry.');
    } finally {
      setConfirming(false);
    }
  };

  const CartPanel = () => (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-300">
            <FiShoppingCart size={32} className="mb-2" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-0.5">Add products from the left</p>
          </div>
        ) : cartItems.map((item) => (
          <CartRow
            key={getProductId(item)}
            item={item}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onRemove={handleRemove}
          />
        ))}
      </div>
      <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
        <BillingPanel
          cartItems={cartItems}
          total={cartTotal}
          onInitiatePayment={handleInitiatePayment}
          onClear={handleClearCart}
          confirming={confirming}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <MdPointOfSale className="text-[#DE6B18] text-3xl" />
          <div>
            <h1 className="text-2xl font-bold text-[#291C08]">Seller Kiosk</h1>
            <p className="text-xs text-gray-400">Assisted in-store ordering</p>
          </div>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden relative bg-[#291C08] text-white p-2.5 rounded-xl shadow"
        >
          <FiShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#DE6B18] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="relative mb-3 flex-shrink-0">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DE6B18]/40"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 flex-shrink-0 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat ? 'bg-[#291C08] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-32 bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-7 bg-gray-200 rounded-xl mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <FiSearch size={36} className="mb-3 opacity-30" />
                <p className="font-medium">No products found</p>
                <p className="text-xs mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={getProductId(product)}
                    product={product}
                    cartItem={findCartItem(product)}
                    onAdd={handleAdd}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hidden lg:flex flex-col w-80 xl:w-96 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <FiShoppingCart size={18} className="text-[#291C08]" />
              <h2 className="font-bold text-[#291C08]">Order</h2>
            </div>
            {cartCount > 0 && (
              <span className="bg-[#FFF3E8] text-[#DE6B18] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartCount} item{cartCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <CartPanel />
        </div>
      </div>
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FiShoppingCart size={18} className="text-[#291C08]" />
                <h2 className="font-bold text-[#291C08]">Order</h2>
                {cartCount > 0 && (
                  <span className="bg-[#FFF3E8] text-[#DE6B18] text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {cartCount} items
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <CartPanel />
          </div>
        </div>
      )}
      {activeModal === 'cash' && pendingPayment && (
        <CashModal
          cartItems={cartItems}
          total={cartTotal}
          customerName={pendingPayment.customerName}
          orderRef={txnRef.current}
          onConfirm={handleCashCardConfirm}
          onCancel={() => { setActiveModal(null); setConfirming(false); }}
          confirming={confirming}
        />
      )}
      {activeModal === 'upi' && pendingPayment && (
        <UpiModal
          total={cartTotal}
          customerName={pendingPayment.customerName}
          txnRef={txnRef.current}
          onConfirm={handleUpiConfirm}
          onCancel={() => { setActiveModal(null); setConfirming(false); }}
          confirming={confirming}
        />
      )}
      {orderSuccessData && (
        <OrderSuccessModal
          data={orderSuccessData}
          onClose={() => setOrderSuccessData(null)}
          onViewOrders={() => {
            setOrderSuccessData(null);
            navigate('/seller/orders');
          }}
        />
      )}
    </div>
  );
};

const ProductCard = ({ product, cartItem, onAdd, onIncrease, onDecrease }) => {
  const qty = cartItem?.quantity || 0;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      <div className="relative">
        <img src={product.prodImg} alt={product.prodName} className="w-full h-32 object-cover" />
        {qty > 0 && <span className="absolute top-2 right-2 bg-[#DE6B18] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">{qty}</span>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-[#291C08] text-sm leading-tight mb-1 truncate">{product.prodName}</p>
        <p className="text-[#DE6B18] font-bold text-base mb-3">{fmt(product.price)}</p>
        <div className="mt-auto">
          {qty === 0 ? (
            <button
              onClick={() => onAdd(product)}
              className="w-full bg-[#291C08] hover:bg-[#3d2a0f] text-white text-sm font-semibold py-1.5 rounded-xl transition-colors"
            >
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between bg-[#FFF3E8] rounded-xl px-2 py-1">
              <button onClick={() => onDecrease(product)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-[#DE6B18] font-bold shadow-sm hover:bg-red-50 transition-colors">−</button>
              <span className="font-bold text-[#291C08] text-sm">{qty}</span>
              <button onClick={() => onIncrease(product)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-[#DE6B18] font-bold shadow-sm hover:bg-green-50 transition-colors">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CartRow = ({ item, onIncrease, onDecrease, onRemove }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <img src={item.prodImg} alt={item.prodName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-[#291C08] text-sm truncate">{item.prodName}</p>
      <p className="text-[#DE6B18] text-xs font-medium">{fmt(item.price)}</p>
    </div>
    <div className="flex items-center gap-1.5">
      <button onClick={() => onDecrease(item)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-red-100 rounded-lg text-[#291C08] font-bold text-sm transition-colors">−</button>
      <span className="font-bold text-[#291C08] text-sm w-5 text-center">{item.quantity}</span>
      <button onClick={() => onIncrease(item)} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-green-100 rounded-lg text-[#291C08] font-bold text-sm transition-colors">+</button>
    </div>
    <span className="font-bold text-[#291C08] text-sm w-14 text-right flex-shrink-0">{fmt(item.price * item.quantity)}</span>
    <button onClick={() => onRemove(item)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"><FiX size={15} /></button>
  </div>
);

export default SellerKiosk;