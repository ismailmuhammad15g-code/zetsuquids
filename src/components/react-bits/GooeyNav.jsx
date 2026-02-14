import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GooeyNav.css";

const GooeyNav = ({
  items,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = ["#000", "#222", "#111"], // Changed to black shades for consistency
  initialActiveIndex = 0,
}) => {
  const containerRef = useRef(null);
  const navRef = useRef(null);
  const filterRef = useRef(null);
  const textRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  // Sync active index with current route
  useEffect(() => {
    const index = items.findIndex((item) => {
      if (typeof item.isActive !== "undefined") {
        return item.isActive;
      }
      return item.href === location.pathname;
    });

    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname, items]);

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i, t, d, r) => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };

  const makeParticles = (element) => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");

      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty("--color", p.color); // Use actual color value
        particle.style.setProperty("--rotate", `${p.rotate}deg`);

        point.classList.add("point");
        point.style.backgroundColor = p.color; // Set point color directly
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add("active");
        });
        setTimeout(() => {
          try {
            if (element.contains(particle)) {
              element.removeChild(particle);
            }
          } catch {
            // Do nothing
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element) => {
    if (
      !containerRef.current ||
      !filterRef.current ||
      !textRef.current ||
      !element
    )
      return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };
    // Adjust filterRef size to accommodate particles expanding
    if (filterRef.current) {
      // Expand the filter container to allow particles to exist outside the bounds of the pill
      const padding = 40;
      filterRef.current.style.left = `${pos.x - containerRect.x - padding}px`;
      filterRef.current.style.top = `${pos.y - containerRect.y - padding}px`;
      filterRef.current.style.width = `${pos.width + padding * 2}px`;
      filterRef.current.style.height = `${pos.height + padding * 2}px`;
    }

    // Text ref should exactly match the target
    Object.assign(textRef.current.style, styles);
  };

  const handleClick = (e, index) => {
    e.preventDefault();
    const liEl = e.currentTarget;
    const item = items[index];

    if (activeIndex === index) return;

    setActiveIndex(index);
    updateEffectPosition(liEl);

    // Filter Effect
    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current.removeChild(p));
    }

    if (textRef.current) {
      textRef.current.classList.remove("active");
      void textRef.current.offsetWidth; // Trigger reflow
      textRef.current.classList.add("active");
    }

    if (filterRef.current) {
      makeParticles(filterRef.current);
    }

    // DELAYED NAVIGATION logic as requested
    setTimeout(() => {
      navigate(item.href);
    }, 1500); // 1.5 second delay for effect to play
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const liEl = e.currentTarget.parentElement;
      if (liEl) {
        handleClick({ currentTarget: liEl, preventDefault: () => {} }, index);
      }
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi);
      textRef.current?.classList.add("active");
    }

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi =
        navRef.current?.querySelectorAll("li")[activeIndex];
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex, items]);

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li
              key={index}
              className={activeIndex === index ? "active" : ""}
              onClick={(e) => handleClick(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              data-index={index}
              tabIndex={0}
            >
              <a
                href={item.href}
                onClick={(e) => e.preventDefault()}
                style={{ pointerEvents: "none" }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.extra}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {/* The background blob effect */}
      <span className="effect filter" ref={filterRef} />
      {/* The foreground text color transition effect */}
      <span className="effect text" ref={textRef} />

      {/* SVG Filter for proper Gooey effect without white background artifacting */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default GooeyNav;
