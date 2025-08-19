import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  perspective?: number;
  shadowIntensity?: number;
  glowColor?: string;
  hoverEffect?: 'lift' | 'glow' | 'morph' | 'all';
  onClick?: () => void;
}

const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  intensity = 20,
  scale = 1.05,
  rotateX = 10,
  rotateY = 10,
  perspective = 1000,
  shadowIntensity = 0.3,
  glowColor = '#3b82f6',
  hoverEffect = 'all',
  onClick
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Motion values for smooth animations
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateXValue = useMotionValue(0);
  const rotateYValue = useMotionValue(0);
  const scaleValue = useMotionValue(1);

  // Spring animations for smooth transitions
  const springConfig = { damping: 20, stiffness: 300 };
  const springRotateX = useSpring(rotateXValue, springConfig);
  const springRotateY = useSpring(rotateYValue, springConfig);
  const springScale = useSpring(scaleValue, springConfig);

  // Transform values
  const transformRotateX = useTransform(springRotateX, [-intensity, intensity], [-rotateX, rotateX]);
  const transformRotateY = useTransform(springRotateY, [-intensity, intensity], [-rotateY, rotateY]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      setMousePosition({ x, y });

      // Calculate rotation based on mouse position
      const rotateX = (y / (rect.height / 2)) * intensity;
      const rotateY = (x / (rect.width / 2)) * intensity;

      rotateXValue.set(rotateX);
      rotateYValue.set(rotateY);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      scaleValue.set(scale);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      scaleValue.set(1);
      rotateXValue.set(0);
      rotateYValue.set(0);
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [intensity, scale, rotateXValue, rotateYValue, scaleValue]);

  // Dynamic shadow based on mouse position
  const shadowX = useTransform(mouseX, [-100, 100], [-20, 20]);
  const shadowY = useTransform(mouseY, [-100, 100], [-20, 20]);
  const shadowBlur = useTransform(springScale, [1, scale], [20, 40]);

  // Glow effect
  const glowOpacity = useTransform(springScale, [1, scale], [0, 0.3]);
  const glowScale = useTransform(springScale, [1, scale], [1, 1.1]);

  return (
    <div className="relative group" ref={cardRef}>
      {/* Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent)`,
          opacity: glowOpacity,
          scale: glowScale,
          filter: 'blur(40px)',
        }}
      />

      {/* Main Card */}
      <motion.div
        className={`relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden cursor-pointer ${className}`}
        style={{
          perspective,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          boxShadow: isHovered 
            ? `0 25px 50px rgba(0, 0, 0, 0.25), 0 0 50px ${glowColor}40`
            : '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
      >
        {/* 3D Transform Container */}
        <motion.div
          className="w-full h-full"
          style={{
            rotateX: transformRotateX,
            rotateY: transformRotateY,
            scale: springScale,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Content */}
          <div className="relative z-10 p-6">
            {children}
          </div>

          {/* Shimmer Effect */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: '100%' }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transform: 'skewX(-20deg)',
              }}
            />
          )}

          {/* Edge Highlights */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 via-transparent to-white/5" />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 via-transparent to-white/5" />
          </div>
        </motion.div>

        {/* Floating Particles */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                initial={{
                  x: Math.random() * 100,
                  y: Math.random() * 100,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Shadow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,${shadowIntensity}) 0%, transparent 70%)`,
          x: shadowX,
          y: shadowY,
          scale: shadowBlur,
          filter: 'blur(20px)',
        }}
      />
    </div>
  );
};

// Enhanced Card Variants
export const FeatureCard: React.FC<{
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  gradient: string;
  className?: string;
}> = ({ icon: Icon, title, description, gradient, className = '' }) => (
  <Card3D
    className={`p-8 text-center ${className}`}
    intensity={15}
    scale={1.03}
    glowColor={gradient}
    hoverEffect="all"
  >
    <div className="mb-6">
      <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/70 leading-relaxed">{description}</p>
    </div>
  </Card3D>
);

export const StatsCard: React.FC<{
  number: string;
  label: string;
  trend?: string;
  className?: string;
}> = ({ number, label, trend, className = '' }) => (
  <Card3D
    className={`p-6 text-center ${className}`}
    intensity={10}
    scale={1.02}
    glowColor="#3b82f6"
  >
    <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
      {number}
    </div>
    <div className="text-white/60 text-sm font-medium mb-2">{label}</div>
    {trend && (
      <div className="text-green-400 text-xs font-medium flex items-center justify-center gap-1">
        <span>↗</span>
        {trend}
      </div>
    )}
  </Card3D>
);

export const ActionCard: React.FC<{
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  className?: string;
}> = ({ title, description, action, onClick, className = '' }) => (
  <Card3D
    className={`p-6 cursor-pointer ${className}`}
    intensity={20}
    scale={1.05}
    glowColor="#8b5cf6"
    hoverEffect="all"
    onClick={onClick}
  >
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-white/70 text-sm mb-4">{description}</p>
    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
      {action}
    </button>
  </Card3D>
);

export default Card3D;