import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import HomePage from '@/pages/customer/HomePage';
import BookingPage from '@/pages/customer/BookingPage';
import OrdersPage from '@/pages/customer/OrdersPage';
import OrderDetailPage from '@/pages/customer/OrderDetailPage';
import TechnicianHomePage from '@/pages/technician/TechnicianHomePage';
import SchedulePage from '@/pages/technician/SchedulePage';
import AdminHomePage from '@/pages/admin/AdminHomePage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminTechniciansPage from '@/pages/admin/AdminTechniciansPage';
import AdminServicesPage from '@/pages/admin/AdminServicesPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import NotFoundPage from '@/pages/404Page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/booking',
    element: <BookingPage />,
  },
  {
    path: '/orders',
    element: <OrdersPage />,
  },
  {
    path: '/orders/:id',
    element: <OrderDetailPage />,
  },
  {
    path: '/technician',
    element: <TechnicianHomePage />,
  },
  {
    path: '/technician/schedule',
    element: <SchedulePage />,
  },
  {
    path: '/admin',
    element: <AdminHomePage />,
  },
  {
    path: '/admin/orders',
    element: <AdminOrdersPage />,
  },
  {
    path: '/admin/technicians',
    element: <AdminTechniciansPage />,
  },
  {
    path: '/admin/services',
    element: <AdminServicesPage />,
  },
  {
    path: '/admin/settings',
    element: <AdminSettingsPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
