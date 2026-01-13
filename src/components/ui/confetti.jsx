import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { cn } from "../../lib/utils";

// Simple confetti particle system
const ConfettiParticle = ({ style, color }) => (
    <div
        className="absolute w-3 h-3 rounded-sm animate-confetti-fall"
        style={{
            ...style,
            backgroundColor: color,
        }}
    />
);

export const Confetti = forwardRef(({ className, onMouseEnter, ...props }, ref) => {
    const containerRef = useRef(null);
    const particlesRef = useRef([]);
    const animationFrameRef = useRef(null);

    const colors = useMemo(() => [
        '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9',
        '#fd79a8', '#a29bfe', '#6c5ce7', '#00b894', '#e17055', '#fdcb6e'
    ], []);

    const createParticle = useCallback((x, y) => {
        return {
            id: Math.random(),
            x: x + (Math.random() - 0.5) * 200,
            y: y - Math.random() * 100,
            vx: (Math.random() - 0.5) * 15,
            vy: -Math.random() * 20 - 10,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 8 + 4,
            opacity: 1,
        };
    }, [colors]);

    const fire = useCallback(({ particleCount = 100, origin = { x: 0.5, y: 0.5 } } = {}) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = rect.width * origin.x;
        const y = rect.height * origin.y;

        // Create particles
        const newParticles = [];
        for (let i = 0; i < particleCount; i++) {
            newParticles.push(createParticle(x, y));
        }

        // Create particle elements
        const particleElements = newParticles.map(p => {
            const el = document.createElement('div');
            el.className = 'confetti-particle';
            el.style.cssText = `
                position: absolute;
                width: ${p.size}px;
                height: ${p.size}px;
                background-color: ${p.color};
                border-radius: 2px;
                pointer-events: none;
                left: ${p.x}px;
                top: ${p.y}px;
                transform: rotate(${p.rotation}deg);
                opacity: ${p.opacity};
                transition: none;
            `;
            containerRef.current.appendChild(el);
            return { el, ...p };
        });

        particlesRef.current = [...particlesRef.current, ...particleElements];

        // Animate particles
        const gravity = 0.5;
        const friction = 0.99;

        const animate = () => {
            let hasActiveParticles = false;

            particlesRef.current = particlesRef.current.filter(particle => {
                particle.vy += gravity;
                particle.vx *= friction;
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.rotation += particle.rotationSpeed;
                particle.opacity -= 0.01;

                if (particle.opacity <= 0 || particle.y > rect.height + 100) {
                    particle.el.remove();
                    return false;
                }

                particle.el.style.left = `${particle.x}px`;
                particle.el.style.top = `${particle.y}px`;
                particle.el.style.transform = `rotate(${particle.rotation}deg)`;
                particle.el.style.opacity = particle.opacity;

                hasActiveParticles = true;
                return true;
            });

            if (hasActiveParticles) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(animate);
    }, [createParticle]);

    useImperativeHandle(ref, () => ({
        fire,
    }));

    return (
        <div
            ref={containerRef}
            className={cn("pointer-events-none", className)}
            onMouseEnter={onMouseEnter}
            {...props}
        />
    );
});

Confetti.displayName = "Confetti";

export default Confetti;
