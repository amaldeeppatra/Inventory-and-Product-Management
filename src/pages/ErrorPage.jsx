import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const ErrorPage = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [milletFall, setMilletFall] = useState([]);

  // Generate falling millet seed animations
  useEffect(() => {
    const generateMilletSeeds = () => {
      const seeds = Array.from({ length: 20 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: Math.random() * 3 + 2,
        size: Math.random() * 20 + 10
      }));
      setMilletFall(seeds);
    };

    generateMilletSeeds();
    setIsVisible(true);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, scale: 0.9 },
    in: { opacity: 1, scale: 1 },
    out: { opacity: 0, scale: 1.1 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <div className="relative min-h-screen bg-[url('./resources/homepage/Homepage.png')] bg-cover bg-center flex items-center justify-center overflow-hidden">
      {/* Falling Millet Seeds Animation */}
      {milletFall.map((seed) => (
        <motion.div
          key={seed.id}
          initial={{ 
            top: -20, 
            left: `${seed.left}%`, 
            opacity: 1 
          }}
          animate={{ 
            top: '120%', 
            opacity: [1, 0.7, 0],
            rotate: [0, Math.random() * 360]
          }}
          transition={{
            duration: seed.duration,
            delay: seed.delay,
            ease: "linear"
          }}
          className="absolute w-2 h-2 bg-[#291C08]/50 rounded-full"
          style={{ 
            width: `${seed.size}px`, 
            height: `${seed.size}px` 
          }}
        />
      ))}

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full max-w-md bg-white/30 backdrop-blur-lg rounded-3xl shadow-lg p-8 text-center relative z-10"
          >
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                transition: { 
                  duration: 0.5, 
                  repeat: Infinity,
                  repeatDelay: 2
                }
              }}
              className="mb-6 flex justify-center"
            >
              <div className="bg-[#291C08] p-6 rounded-full w-24 h-24 flex items-center justify-center">
                <FaExclamationTriangle className="text-6xl text-white" />
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-4xl font-bold text-[#291C08] mb-4"
            >
              404
            </motion.h1>
            
            <motion.h2
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-semibold text-[#291C08] mb-4"
            >
              Oops! Page Not Found
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-[#291C08]/70 mb-6"
            >
              The page you're looking for seems to have wandered off into the millet fields. 
              Let's get you back to safety!
            </motion.p>
            
            <div className="flex flex-col space-y-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/homepage')}
                className="w-full py-3 bg-[#291C08] text-white rounded-xl flex items-center justify-center"
              >
                <FaHome className="mr-2" /> Return to Homepage
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="w-full py-3 bg-[#291C08]/30 text-[#291C08] rounded-xl"
              >
                Go Back
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ErrorPage;