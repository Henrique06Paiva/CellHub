import React, { useEffect, useState } from 'react';
import { useGlobal } from '../../contexts/GlobalContext';

const ProgressBar = () => {
  const { isNavigating } = useGlobal();
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval;
    if (isNavigating) {
      setIsVisible(true);
      setWidth(0);
      interval = setInterval(() => {
        setWidth((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 5;
        });
      }, 100);
    } else {
      setWidth(100);
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setWidth(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [isNavigating]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '3px',
      background: 'linear-gradient(to right, var(--secondary-color), var(--primary-color))',
      width: `${width}%`,
      zIndex: 10001,
      boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)',
      transition: width === 100 ? 'width 0.3s ease-out' : 'width 0.4s ease-out'
    }} />
  );
};

export default ProgressBar;
