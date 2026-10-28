import React, { useEffect, useRef, useState } from 'react';

// IntersectionObserver-based scroll reveal. Falls back to visible when the
// API is missing or the element is already on screen, so content never gets
// stuck hidden. `delay` staggers groups; `y` sets the rise distance.
export default function Reveal({
  as: Tag = 'div',
  children,
  delay = 0,
  y = 20,
  once = true,
  className = '',
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={{
        transform: visible ? undefined : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
