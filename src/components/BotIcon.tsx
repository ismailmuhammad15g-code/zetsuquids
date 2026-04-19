import { Bot } from 'lucide-react'

interface BotIconProps {
    className?: string
    size?: number
}

export default function BotIcon({ className, size = 40 }: BotIconProps) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <Bot size={size} className="text-black" strokeWidth={1.5} />
        </div>
    )
}
