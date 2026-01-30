import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes, Delete", cancelText = "Cancel" }) {
    if (!isOpen) return null

    const handleConfirm = () => {
        console.log('[ConfirmModal] User clicked confirm button')
        // Don't close the modal here - let the parent handle it after async operation completes
        onConfirm()
    }

    const handleCancel = () => {
        console.log('[ConfirmModal] User clicked cancel button')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white border-4 border-black rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-black text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <h2 className="text-lg font-black">{title}</h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="text-white hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 text-base leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-black flex gap-3 justify-end">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 border-2 border-black bg-white text-black font-bold hover:bg-gray-100 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 border-2 border-black bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
