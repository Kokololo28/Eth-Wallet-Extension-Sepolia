import React, { useState, useEffect, useRef } from 'react';

const AnimatedLogo = () => {
  const [particles, setParticles] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Створення початкових частинок
  useEffect(() => {
    const particlesArray = [];
    for (let i = 0; i < 50; i++) {
      particlesArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 2, // Розмір від 4 до 10 пікселів
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
    setParticles(particlesArray);
  }, []);

  // Анімація руху частинок
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          let newSpeedX = particle.speedX;
          let newSpeedY = particle.speedY;

          // Якщо наведено курсор, частинки розходяться від центру
          if (isHovered) {
            const centerX = 50;
            const centerY = 50;
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 40) {
              const force = (40 - distance) / 40;
              newSpeedX += (dx / distance) * force * 0.5;
              newSpeedY += (dy / distance) * force * 0.5;
            }
          }

          // Відбиття від країв
          if (newX <= 0 || newX >= 100) {
            newSpeedX = -newSpeedX;
            newX = Math.max(0, Math.min(100, newX));
          }
          if (newY <= 0 || newY >= 100) {
            newSpeedY = -newSpeedY;
            newY = Math.max(0, Math.min(100, newY));
          }

          // Затухання швидкості
          newSpeedX *= 0.99;
          newSpeedY *= 0.99;

          // Додаємо невелику випадкову силу для хаотичного руху
          newSpeedX += (Math.random() - 0.5) * 0.1;
          newSpeedY += (Math.random() - 0.5) * 0.1;

          // Обмежуємо максимальну швидкість
          const maxSpeed = 1;
          const currentSpeed = Math.sqrt(newSpeedX * newSpeedX + newSpeedY * newSpeedY);
          if (currentSpeed > maxSpeed) {
            newSpeedX = (newSpeedX / currentSpeed) * maxSpeed;
            newSpeedY = (newSpeedY / currentSpeed) * maxSpeed;
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
          };
        })
      );
    }, 30); // 30 FPS

    return () => clearInterval(animationInterval);
  }, [isHovered]);

  return (
    <div 
      ref={containerRef}
      className="animated-logo-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg 
        width="100" 
        height="100" 
        viewBox="0 0 100 100"
        className="animated-logo-svg"
      >
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size / 2}
            fill="#f6851b"
            opacity={particle.opacity}
            className="logo-particle"
            style={{
              filter: 'blur(0.5px)',
              transition: 'none',
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default AnimatedLogo;