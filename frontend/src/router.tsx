import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/root-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AdminRoute } from "@/components/layout/admin-route";
import { AdminLayout } from "@/components/layout/admin-layout";
import { CatalogPage } from "@/pages/catalog-page";
import { ProductDetailPage } from "@/pages/product-detail-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { CartPage } from "@/pages/cart-page";
import { CheckoutPage } from "@/pages/checkout-page";
import { LibraryPage } from "@/pages/library-page";
import { WishlistPage } from "@/pages/wishlist-page";
import { AdminDashboardPage } from "@/pages/admin/admin-dashboard-page";
import { AdminProductsPage } from "@/pages/admin/admin-products-page";
import { AdminOrdersPage } from "@/pages/admin/admin-orders-page";
import { AdminCustomersPage } from "@/pages/admin/admin-customers-page";
import { AdminCouponsPage } from "@/pages/admin/admin-coupons-page";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <CatalogPage /> },
      { path: "/products/:slug", element: <ProductDetailPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/cart", element: <CartPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/checkout", element: <CheckoutPage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/wishlist", element: <WishlistPage /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "products", element: <AdminProductsPage /> },
              { path: "orders", element: <AdminOrdersPage /> },
              { path: "customers", element: <AdminCustomersPage /> },
              { path: "coupons", element: <AdminCouponsPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
