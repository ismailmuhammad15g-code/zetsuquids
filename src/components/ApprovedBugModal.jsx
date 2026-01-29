import { useState, useEffect } from 'react'
import { Sparkles, X, Gift } from 'lucide-react'

export default function ApprovedBugModal({ onClose }) {
    // In a real app, we would fetch pending notifications from DB here.
    // For this demo, we can assume 'isOpen' is controlled by parent using localStorage or similar check.
    // BUT, user asked for automatic check.
    // Let's assume passed in prop or context controls visibility.
    // This is just the presentational component.

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal */}
            <div className="bg-white rounded-3xl max-w-sm w-full relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-20"
                >
                    <X size={20} className="text-black" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Icon Animation */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                        <div className="relative bg-black text-white w-full h-full rounded-full flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform duration-500">
                            <Gift size={40} />
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                                +10
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-black mb-2 tracking-tight">
                        Bug Approved!
                    </h2>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Awesome work! Your bug report was verified by our team. You've earned a reward.
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-8">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-gray-500 font-medium">Reward</span>
                            <span className="text-green-600 font-bold flex items-center gap-1">
                                <Sparkles size={16} /> 10 Free Credits
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-black text-white font-bold rounded-xl text-lg hover:scale-[1.02] transition-transform shadow-lg"
                    >
                        Collect Reward
                    </button>
                </div>

                {/* Confetti Decoration (CSS only) */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500"></div>
            </div>
        </div>
    )
}
