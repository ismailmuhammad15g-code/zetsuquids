import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Breadcrumbs navigation component
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items [{label, href}]
 * @param {string} props.dividerType - Type of divider (default: "chevron")
 */
export default function Breadcrumbs({ items = [], dividerType = "chevron" }) {
    const Divider = () => {
        if (dividerType === "chevron") {
            return <ChevronRight size={16} className="text-gray-400" />;
        }
        return <span className="text-gray-400">/</span>;
    };

    return (
        <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {isLast ? (
                                <span className="font-medium text-gray-900">
                                    {item.label}
                                </span>
                            ) : (
                                <>
                                    <Link
                                        to={item.href}
                                        className="text-gray-600 hover:text-black transition-colors font-medium"
                                    >
                                        {item.label}
                                    </Link>
                                    <Divider />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
