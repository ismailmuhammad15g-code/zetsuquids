"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

export interface BalloonsProps {
  type?: "default" | "text"
  text?: string
  fontSize?: number
  color?: string
  className?: string
  onLaunch?: () => void
}

interface BalloonInstance {
  id: string;
  xOffset: number;
  color: string;
  size: number;
  speed: number;
  delay: number;
  swayConfig: number;
}

const COLORS = [
  "#f8b13d", // yellow
  "#c03940", // red
  "#0075bc", // blue
  "#3d954b", // green
  "#a3509d", // purple
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
]

const BalloonSVG = ({ color }: { color: string }) => (
  <svg viewBox="0 0 223 609" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl filter">
    <g opacity="0.8">
      <path d="M117.5 253C136.167 294.5 134.7 395 125.5 453C116.3 511 133.833 578.167 125.5 606" stroke="rgba(0,0,0,0.2)" strokeWidth="3"/>
    </g>
    <path fillRule="evenodd" clipRule="evenodd" d="M176.876 204.032C181.934 198.064 209.694 160.262 210.899 127.619C213.023 70.1236 176.876 13 118.337 13C55.7949 13 18.5828 69.332 22.2724 127.619C24.0956 156.423 38.9766 178.5 51.7922 195.372C57.7811 203.257 90.0671 238.749 112.15 245.044C111.698 248.246 112.044 253.284 116.338 254H121.838V245.71C143.277 242.292 172.085 209.686 176.876 204.032Z" fill={color} />
    <path d="M125 256.5C125 258.433 122.09 260 118.5 260C114.91 260 112 258.433 112 256.5C112 254.567 114.91 255 118.5 255C122.09 255 125 254.567 125 256.5Z" fill={color} />
    <path d="M178.928 128.12C178.011 152.146 172.137 162.97 154.623 184.2C141.594 199.992 128.28 215 112.805 215C104.349 215 92.739 215 65.2673 177.844C56.1123 165.461 45.4818 149.259 44.1794 128.12C41.5436 85.3424 68.1267 44 112.805 44C154.623 44 180.55 85.6242 178.928 128.12Z" fill="white" fillOpacity="0.2" />
  </svg>
)

const Balloons = React.forwardRef<any, BalloonsProps>(
  ({ type = "default", text, fontSize = 120, color = "#000000", className, onLaunch }, ref) => {
    const [balloons, setBalloons] = React.useState<BalloonInstance[]>([])
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    const launchAnimation = React.useCallback(() => {
      // Create ~20-30 balloons
      const amount = Math.floor(Math.random() * 15) + 20;
      const newBalloons: BalloonInstance[] = Array.from({ length: amount }).map(() => ({
        id: Math.random().toString(36).substring(7),
        xOffset: Math.random() * 100, // percentage
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 60 + 60, // 60px to 120px width
        speed: Math.random() * 4 + 4, // 4s to 8s duration for a nicer, more majestic float
        delay: Math.random() * 1.5, // 0 to 1.5s stagger
        swayConfig: Math.random() * 10 - 5, // -5 to 5 sway
      }));

      setBalloons(prev => [...prev, ...newBalloons]);

      if (onLaunch) {
        onLaunch()
      }
    }, [onLaunch])

    React.useImperativeHandle(ref, () => ({
      launchAnimation
    }), [launchAnimation])

    // Clean up balloons after animation
    const removeBalloon = (id: string) => {
      setBalloons(prev => prev.filter(b => b.id !== id))
    }

    const content = (
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none overflow-hidden", 
          className
        )}
        style={{ zIndex: 999999 }}
      >
        <AnimatePresence>
          {balloons.map((balloon) => (
            <motion.div
              key={balloon.id}
              initial={{ 
                y: "110vh", 
                x: `calc(${balloon.xOffset}vw - 50%)`,
                rotateZ: 0 
              }}
              animate={{ 
                y: "-120vh", 
                x: [
                    `calc(${balloon.xOffset}vw - 50%)`, 
                    `calc(${balloon.xOffset + balloon.swayConfig}vw - 50%)`, 
                    `calc(${balloon.xOffset - balloon.swayConfig}vw - 50%)`, 
                    `calc(${balloon.xOffset}vw - 50%)`
                ],
                rotateZ: [0, balloon.swayConfig * 2, -balloon.swayConfig * 2, 0]
              }}
              transition={{
                y: {
                  duration: balloon.speed,
                  ease: "easeOut",
                  delay: balloon.delay,
                },
                x: {
                  duration: balloon.speed,
                  ease: "easeInOut",
                  times: [0, 0.33, 0.66, 1],
                  delay: balloon.delay,
                  repeat: Infinity,
                  repeatType: "mirror"
                },
                rotateZ: {
                  duration: balloon.speed,
                  ease: "easeInOut",
                  times: [0, 0.33, 0.66, 1],
                  delay: balloon.delay,
                  repeat: Infinity,
                  repeatType: "mirror"
                }
              }}
              onAnimationComplete={() => removeBalloon(balloon.id)}
              style={{
                position: "absolute",
                width: balloon.size,
                height: balloon.size * 2.73, // maintain SVG aspect ratio (609 / 223 = 2.73)
                bottom: 0,
                left: 0,
              }}
            >
              <BalloonSVG color={balloon.color} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )

    if (!mounted || typeof document === 'undefined') return null;
    return createPortal(content, document.body);
  }
)

Balloons.displayName = "Balloons"
export { Balloons }
