import { Bot, Home, Mail, Search, Sparkles, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getAvatarForUser } from "../../lib/avatar";

export default function CommunityLeftSidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: "Home", icon: Home, href: "/community" },
    { name: "Explore", icon: Search, href: "#" },
    { name: "Messages", icon: Mail, href: "#" },
    { name: "Zetsu AI", icon: Bot, href: "/zetsuguide-ai" },
    {
      name: "Profile",
      icon: User,
      href: user ? `/@${(user?.user_metadata?.full_name || user?.email?.split("@")[0] || "user").toLowerCase()}/workspace` : "/auth",
    },
  ];

  return (
    <>
      {/* Desktop Left Sidebar: >= sm */}
      <header className="hidden sm:flex flex-col items-end w-[88px] xl:w-[275px] h-screen sticky top-0 border-r border-gray-800 xl:pr-4">
        <div className="flex flex-col items-center xl:items-start w-full h-full py-4 pt-2">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors xl:ml-2 mb-2"
          >
           <Sparkles className="text-[#e7e9ea]" size={28} />
          </Link>

          {/* Nav Links */}
          <nav className="flex flex-col gap-2 w-full mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center justify-center xl:justify-start w-fit xl:w-auto p-3 xl:px-4 xl:py-3 rounded-full hover:bg-[#181818] transition-colors group mx-auto xl:mx-0"
                >
                  <Icon
                    size={26}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="text-[#e7e9ea]"
                  />
                  <span
                    className={`hidden xl:block ml-4 text-[20px] ${
                      isActive ? "font-bold" : "font-normal"
                    } text-[#e7e9ea]`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Post Button */}
          <button className="hidden xl:block w-[90%] bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-[17px] rounded-full py-3 mt-4 mx-auto transition-colors shadow-sm">
            Post
          </button>
          <button className="xl:hidden w-12 h-12 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-full flex items-center justify-center mt-4 mx-auto transition-colors shadow-sm">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[24px] h-[24px] fill-current">
              <g>
                <path d="M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H16c.63-.016 1.2-.08 1.72-.188C16.95 15.24 14.68 17 12 17H8.55c.57-2.512 1.57-4.851 3-6.78 2.16-2.912 5.29-4.911 9.45-5.187C20.95 8.079 19.9 11 16 11zM4 9V6H1V4h3V1h2v3h3v2H6v3H4z"></path>
              </g>
            </svg>
          </button>

          {/* User Profile Mini */}
          {user && (
            <div className="mt-auto mb-4 w-full flex justify-center xl:justify-start">
              <div className="flex items-center gap-3 p-3 rounded-full hover:bg-[#181818] transition-colors cursor-pointer w-fit xl:w-[250px]">
                <img
                  src={getAvatarForUser(user.email)}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="hidden xl:flex flex-col overflow-hidden min-w-0 flex-1">
                  <span className="font-bold text-[#e7e9ea] text-[15px] truncate">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                  <span className="text-[#71767b] text-[15px] truncate">
                    @{user.email?.split("@")[0]}
                  </span>
                </div>
                <div className="hidden xl:block text-[#e7e9ea]">
                   <svg viewBox="0 0 24 24" className="w-[18.75px] h-[18.75px] fill-current">
                     <g><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></g>
                   </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Tab Bar: < sm */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-black/80 backdrop-blur-md border-t border-gray-800 z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className="p-3 w-full flex items-center justify-center relative group"
            >
              <Icon
                size={26}
                strokeWidth={isActive ? 2.5 : 2}
                className="text-[#e7e9ea] group-active:scale-95 transition-transform"
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
