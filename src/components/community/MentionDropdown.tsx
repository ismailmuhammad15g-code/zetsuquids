import { getAvatarForUser } from "../../lib/avatar";
import { MentionUser } from "../../hooks/useMention";

interface MentionDropdownProps {
  users: MentionUser[];
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
}

export default function MentionDropdown({ users, selectedIndex, onSelect }: MentionDropdownProps) {
  if (users.length === 0) return null;

  return (
    <div className="absolute z-50 mt-1 w-64 bg-black border border-[#2f3336] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] overflow-hidden left-12">
      {users.map((user, index) => {
        const handle = user.username || user.user_email?.split('@')[0] || "user";
        const isSelected = index === selectedIndex;
        
        return (
          <button
            key={user.user_id}
            onClick={() => onSelect(user)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
              isSelected ? "bg-[#1d9bf0]/10" : "hover:bg-white/[0.03]"
            }`}
          >
            <img
              src={user.avatar_url || getAvatarForUser(user.user_email)}
              alt={user.display_name}
              className="w-10 h-10 rounded-full object-cover bg-gray-800"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[#e7e9ea] font-bold text-[15px] truncate">
                {user.display_name}
              </div>
              <div className="text-[#71767b] text-[15px] truncate">
                @{handle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
