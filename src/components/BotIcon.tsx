import { Bot } from 'lucide-react'

interface BotIconProps {
    className?: string
    size?: number
}

export default function BotIcon({ className, size = 40 }: BotIconProps) {
    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ width: size, height: size }}>
            <img 
                src="/avatars/chatbot.svg" 
                alt="Bot" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
        </div>
    )
}
