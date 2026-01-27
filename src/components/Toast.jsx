import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const bgColor = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200'
    }[type]

    const Icon = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info
    }[type]

    const textColor = {
        success: 'text-green-800',
        error: 'text-red-800',
        info: 'text-blue-800'
    }[type]

    const iconColor = {
        success: 'text-green-600',
        error: 'text-red-600',
        info: 'text-blue-600'
    }[type]

    return (
        <div className={`fixed top-4 right-4 ${bgColor} border-2 rounded-lg p-4 flex items-center gap-3 max-w-sm shadow-lg z-50 animate-in slide-in-from-top fade-in`}>
            <Icon size={20} className={iconColor} />
            <p className={`${textColor} font-medium flex-1`}>{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/10 rounded transition-colors"
            >
                <X size={16} className={textColor} />
            </button>
        </div>
    )
}
