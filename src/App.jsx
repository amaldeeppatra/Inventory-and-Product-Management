/* eslint-disable react/jsx-key */
import './index.css'
import LandingPage from './pages/LandingPage'
// import LogInWithPhone from './pages/LogInWithPhone'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import ReactDOM from 'react-dom/client'
import LoginGoogle from './pages/LoginGoogle'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import ProtectedRoute from './utils/ProtectedRoute'
import ProductsByCat from './pages/ProductsByCat'
import OrderSuccess from './pages/OrderSuccess'
import MyProfile from './pages/MyProfile'
import ViewOrders from './pages/ViewOrders'
import OrderDetails from './pages/OrderDetails'
import ErrorPage from './pages/ErrorPage'
import SellerPage from './pages/SellerPage'
import AdminPage from './pages/AdminPage'
import LoginRolePrompt from './pages/LoginRolePrompt'
import Dashboard from './components/seller/dashboard/Dashboard'
import Orders from './components/seller/orders/Orders'
import Inventory from './components/seller/inventory/Inventory'
import Restocks from './components/seller/restocks/Restocks'
import Products from './components/admin/products/Products'
import Sellers from './components/admin/sellers/Sellers'
import Requests from './components/admin/requests/Requests'
import Billing from './components/seller/billing/Billing'

const App = () => {
  return (
    <>
      <Outlet />
    </>

  )
}

const appRouter = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          path: "/",
          element: [<LandingPage />]
        },
        {
          path: "/login",
          element: [<LoginGoogle />]
        },
        // {
        //   path:"/login-phone",
        //   element:[<LogInWithPhone/>]
        // },
        {
          path: "/homepage",
          element: (
            <HomePage />
          )
        },
        {
          path: "/search",
          element: (
            <SearchResultsPage />
          )
        },
        {
          path: "/product/:prodId",
          element: (
            <ProductPage />
          )
        },
        {
          path: "/cart",
          element: (
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          )
        },
        {
          path: "/categories",
          element: (
            <ProductsByCat />
          )
        },
        {
          path: "/order-success",
          element: (
            <OrderSuccess />
          )
        },
        {
          path: "/profile",
          element: (
            <MyProfile />
          )
        },
        {
          path: "/orders",
          element: (
            <ViewOrders />
          )
        },
        {
          path: "/order/:shopId/:orderNo",
          element: (
            <OrderDetails />
          )
        },
        {
          path: "*",
          element: <ErrorPage />
        },
        {
          path: "/seller",
          element: <SellerPage />, // The parent component with Sidebar and Header
          children: [
            // This "index" route renders the Dashboard component
            // when the user navigates to the parent's path ("/seller").
            {
              index: true,
              element: <Dashboard />
            },
            // Child routes render inside the SellerLayout's <Outlet />
            {
              path: "billing",
              element: <Billing />
            },
            {
              path: "dashboard",
              element: <Dashboard />
            },
            {
              path: "orders",
              element: <Orders />
            },
            {
              path: "inventory",
              element: <Inventory />
            },
            {
              // Path matches the NavLink in your Sidebar component
              path: "restock",
              element: <Restocks />
            }
          ]
        },
        {
          path: "/admin",
          element: <AdminPage />, // The parent component with Sidebar and Header

          children: [
            
            {
              index: true,
              element: <Products />
            },
            // Child routes render inside the SellerLayout's <Outlet />
            {
              path: "products",
              element: <Products />
            },
            {
              path: "sellers",
              element: <Sellers />
            },
            {
              path: "requests",
              element: <Requests />
            },
          ]

        },
        {
          path: "/choose-role",
          element: <LoginRolePrompt />
        }
      ]
    }
  ]
)


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<RouterProvider router={appRouter} />);