import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Scissors } from 'lucide-react';
import Layout from '@/components/Layout';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
              <Scissors className="w-16 h-16 text-primary-dark" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-8xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent mb-4"
          >
            404
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-semibold text-gray-800 mb-2"
          >
            页面未找到
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-500 mb-8 max-w-md mx-auto"
          >
            抱歉，您访问的页面不存在或已被移除。
            让我们带您回到正轨。
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
            返回首页
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex items-center gap-8 text-sm text-gray-400"
        >
          <div className="w-20 h-px bg-gray-200" />
          <span>优雅美甲 · 让您的指尖绽放光彩</span>
          <div className="w-20 h-px bg-gray-200" />
        </motion.div>
      </div>
    </Layout>
  );
}
