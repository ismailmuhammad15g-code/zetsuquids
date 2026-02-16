import { ArrowLeft, Home, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
    const location = useLocation();
    const isStuffTypo = location.pathname.includes('/stuff');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    🤔
                </div>

                <h1 className="text-3xl font-black mb-2">Page Not Found</h1>
                <p className="text-gray-500 mb-8">
                    The page you are looking for doesn't exist or has been moved.
                </p>

                {isStuffTypo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
                        <h3 className="font-bold text-yellow-800 mb-1 flex items-center gap-2">
                            <Search size={16} />
                            Did you mean "Staff"?
                        </h3>
                        <p className="text-sm text-yellow-700 mb-3">
                            It looks like you might be trying to access the Staff Console.
                        </p>
                        <Link
                            to="/staff/console"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg block text-center transition-colors"
                        >
                            Go to Staff Console
                        </Link>
                    </div>
                )}

                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                </Link>
            </div>

            <p className="mt-8 text-gray-400 text-sm font-mono">
                404 | {location.pathname}
            </p>
        </div>
    );
}
