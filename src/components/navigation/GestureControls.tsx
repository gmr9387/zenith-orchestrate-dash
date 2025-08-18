import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ZoomIn, ZoomOut, Move3D } from "lucide-react";

interface GestureControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPinchZoom: (scale: number) => void;
  onLongPress: (element: HTMLElement) => void;
}

export function GestureControls({ 
  onSwipeLeft, 
  onSwipeRight, 
  onPinchZoom, 
  onLongPress 
}: GestureControlsProps) {
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [gesturePreview, setGesturePreview] = useState<any>(null);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
        
        // Start long press timer
        const timer = setTimeout(() => {
          onLongPress(e.target as HTMLElement);
          setActiveGesture('longpress');
          setTimeout(() => setActiveGesture(null), 1000);
        }, 800);
        setLongPressTimer(timer);
      } else if (e.touches.length === 2) {
        setActiveGesture('pinch');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      if (e.touches.length === 2) {
        // Handle pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        
        // Calculate scale based on distance
        const scale = distance / 200; // Normalize
        onPinchZoom(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
          if (deltaX > 0) {
            onSwipeRight();
            setActiveGesture('swipe-right');
            setGesturePreview({ type: 'swipe', direction: 'right', x: touchEndX, y: touchEndY });
          } else {
            onSwipeLeft();
            setActiveGesture('swipe-left');
            setGesturePreview({ type: 'swipe', direction: 'left', x: touchEndX, y: touchEndY });
          }
          
          setTimeout(() => {
            setActiveGesture(null);
            setGesturePreview(null);
          }, 1000);
        }
      }
      
      setActiveGesture(null);
    };

    // Keyboard shortcuts for desktop gesture simulation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            onSwipeLeft();
            setActiveGesture('swipe-left');
            setTimeout(() => setActiveGesture(null), 500);
            break;
          case 'ArrowRight':
            e.preventDefault();
            onSwipeRight();
            setActiveGesture('swipe-right');
            setTimeout(() => setActiveGesture(null), 500);
            break;
          case '+':
          case '=':
            e.preventDefault();
            onPinchZoom(1.2);
            setActiveGesture('zoom-in');
            setTimeout(() => setActiveGesture(null), 500);
            break;
          case '-':
            e.preventDefault();
            onPinchZoom(0.8);
            setActiveGesture('zoom-out');
            setTimeout(() => setActiveGesture(null), 500);
            break;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('keydown', handleKeyDown);
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, [touchStartX, touchStartY, longPressTimer, onSwipeLeft, onSwipeRight, onPinchZoom, onLongPress]);

  return (
    <>
      {/* Gesture Feedback Overlay */}
      <AnimatePresence>
        {activeGesture && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-intense rounded-2xl p-4 flex items-center gap-3"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              {activeGesture === 'swipe-left' && (
                <>
                  <ArrowRight className="w-6 h-6 text-primary rotate-180" />
                  <span className="text-sm font-medium">Swipe Left</span>
                </>
              )}
              {activeGesture === 'swipe-right' && (
                <>
                  <ArrowRight className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Swipe Right</span>
                </>
              )}
              {activeGesture === 'pinch' && (
                <>
                  <ZoomIn className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Pinch to Zoom</span>
                </>
              )}
              {activeGesture === 'zoom-in' && (
                <>
                  <ZoomIn className="w-6 h-6 text-success" />
                  <span className="text-sm font-medium">Zoom In</span>
                </>
              )}
              {activeGesture === 'zoom-out' && (
                <>
                  <ZoomOut className="w-6 h-6 text-warning" />
                  <span className="text-sm font-medium">Zoom Out</span>
                </>
              )}
              {activeGesture === 'longpress' && (
                <>
                  <Move3D className="w-6 h-6 text-primary animate-pulse" />
                  <span className="text-sm font-medium">Long Press Detected</span>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Preview Particles */}
      <AnimatePresence>
        {gesturePreview && (
          <motion.div
            className="fixed pointer-events-none z-40"
            style={{ 
              left: gesturePreview.x - 20, 
              top: gesturePreview.y - 20 
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary"
              animate={{ 
                scale: [1, 1.5, 1],
                rotate: gesturePreview.direction === 'right' ? [0, 45, 0] : [0, -45, 0]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Guide (Bottom-right corner) */}
      <motion.div
        className="fixed bottom-4 right-4 glass-card rounded-xl p-3 text-xs text-muted-foreground z-30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <div className="flex flex-col gap-1">
          <div className="font-medium mb-1">Gesture Controls:</div>
          <div>← → Swipe: Switch tools</div>
          <div>⌘ + /-: Zoom in/out</div>
          <div>Long press: Context menu</div>
          <div>Pinch: Scale interface</div>
        </div>
      </motion.div>
    </>
  );
}