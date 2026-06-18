import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Calendar,
  User,
  Settings,
  LogOut,
  Scissors,
  Users,
  ShoppingBag,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';

const navItems = {
  customer: [
    { path: '/', label: '首页', icon: Home },
    { path: '/orders', label: '我的预约', icon: Calendar },
  ],
  technician: [
    { path: '/technician', label: '首页', icon: Home },
    { path: '/technician/schedule', label: '排班', icon: Calendar },
  ],
  admin: [
    { path: '/admin', label: '首页', icon: BarChart3 },
    { path: '/admin/orders', label: '订单', icon: ShoppingBag },
    { path: '/admin/technicians', label: '技师', icon: Users },
    { path: '/admin/services', label: '服务', icon: Scissors },
    { path: '/admin/settings', label: '设置', icon: Settings },
  ],
};

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, logout, isLoggedIn } = useUserStore();

  const role = currentUser?.role || 'customer';
  const items = navItems[role] || navItems.customer;

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-primary-light via-primary to-primary-light shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-dark" />
            </div>
            <span className="text-xl font-bold text-primary-dark hidden sm:block">
              优雅美甲
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-white text-primary-dark shadow-md'
                      : 'text-primary-dark/80 hover:bg-white/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn && currentUser ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-dark" />
                  </div>
                  <span className="text-primary-dark font-medium">
                    {currentUser.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white/20 text-primary-dark rounded-lg hover:bg-white/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">退出</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-primary-dark/80 text-sm">
                  欢迎光临
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-primary-dark hover:bg-white/30 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-primary-light"
          >
            <div className="px-4 py-4 space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-primary/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {isLoggedIn && currentUser && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-dark" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {currentUser.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {role === 'customer'
                          ? '顾客'
                          : role === 'technician'
                          ? '技师'
                          : '管理员'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
