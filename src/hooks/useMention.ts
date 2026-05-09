import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { communityApi } from "../lib/communityApi";

export interface MentionUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  user_email?: string;
}

export function useMention(
  content: string,
  setContent: (content: string) => void,
  textareaRef: React.RefObject<HTMLTextAreaElement>
) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Fetch users on mount
  useEffect(() => {
    async function loadUsers() {
      try {
        const allUsers = await communityApi.getAllUsers();
        setUsers(allUsers as MentionUser[]);
      } catch (err) {
        console.error("Failed to load users for mentions", err);
      }
    }
    loadUsers();
  }, []);

  // Filter users when search changes
  useEffect(() => {
    if (!mentionSearch) {
      setFilteredUsers(users.slice(0, 5));
    } else {
      const lowerSearch = mentionSearch.toLowerCase();
      const filtered = users.filter(
        (u) =>
          u.username?.toLowerCase().includes(lowerSearch) ||
          u.display_name?.toLowerCase().includes(lowerSearch)
      );
      setFilteredUsers(filtered.slice(0, 5));
    }
    setSelectedIndex(0);
  }, [mentionSearch, users]);

  const handleMentionInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Find if we are currently typing a mention
    // We look backwards from the cursor to find an '@' symbol
    // without crossing a space character.
    let foundMention = false;
    let startIdx = -1;

    for (let i = cursorPosition - 1; i >= 0; i--) {
      if (value[i] === ' ' || value[i] === '\n') {
        break;
      }
      if (value[i] === '@') {
        foundMention = true;
        startIdx = i;
        break;
      }
    }

    if (foundMention) {
      const searchStr = value.substring(startIdx + 1, cursorPosition);
      setMentionSearch(searchStr);
      setMentionStartIndex(startIdx);
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
      setMentionStartIndex(-1);
    }
  };

  const handleMentionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredUsers[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;

    const handle = user.username || user.user_email?.split('@')[0] || "user";
    const cursorPosition = textareaRef.current.selectionStart;
    
    const beforeMention = content.substring(0, mentionStartIndex);
    const afterMention = content.substring(cursorPosition);
    
    const newContent = `${beforeMention}@${handle} ${afterMention}`;
    setContent(newContent);
    setShowMentionDropdown(false);
    
    // Set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + handle.length + 2; // +1 for @, +1 for space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return {
    showMentionDropdown,
    filteredUsers,
    selectedIndex,
    handleMentionInput,
    handleMentionKeyDown,
    insertMention,
  };
}
