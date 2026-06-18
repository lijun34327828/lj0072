import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {children}
      </motion.main>
      <footer className="mt-auto py-6 text-center text-gray-500 text-sm border-t border-gray-100">
        <p>© 2024 优雅美甲 版权所有</p>
      </footer>
    </div>
  );
}
