import { Bot } from 'lucide-react'

export default function BotIcon({ className, size = 40 }) {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <Bot size={size} className="text-black" strokeWidth={1.5} />
        </div>
    )
}
