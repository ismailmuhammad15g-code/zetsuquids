import CommunityLeftSidebar from "../components/community/CommunityLeftSidebar";
import TrendsSidebar from "../components/community/TrendsSidebar";
import { useAuth } from "../contexts/AuthContext";

interface CommunityPlaceholderPageProps {
    title: string;
    message?: string;
}

export default function CommunityPlaceholderPage({ title, message }: CommunityPlaceholderPageProps) {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center font-sans subpixel-antialiased">
            <CommunityLeftSidebar onPostClick={() => {}} />

            {/* Main Feed Column */}
            <main className="w-full max-w-[600px] border-x border-[#2f3336] flex flex-col min-h-screen">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336]">
                    <h1 className="text-xl font-bold px-4 py-3">{title}</h1>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ textWrap: 'balance' }}>
                    <h2 className="text-[31px] font-extrabold text-[#e7e9ea] mb-2 leading-tight">
                        Nothing to see here — yet
                    </h2>
                    <p className="text-[#71767b] text-[15px] max-w-[360px] leading-relaxed">
                        {message || `This is the ${title} page. When more features are rolled out, they'll show up right here.`}
                    </p>
                </div>
            </main>

            <TrendsSidebar user={user as any} />
        </div>
    );
}
