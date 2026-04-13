import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Globe, 
  Settings, 
  Trash2, 
  AlertTriangle,
  Lock
} from "lucide-react";
import { communityApi } from "../../lib/communityApi";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import PostCard from "../../components/PostCard";
import Composer from "../../components/community/Composer";

export default function GroupPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user && group && user.id === group.creator_id;

  const fetchGroupData = async () => {
    try {
      const g = await communityApi.getGroup(id);
      if (!g) {
        toast.error("Community not found");
        navigate("/community/communities");
        return;
      }
      setGroup(g);
      
      const [groupPosts, joinedIds] = await Promise.all([
        communityApi.getPosts("All", user?.id, id),
        user ? communityApi.getJoinedCommunities(user.id) : Promise.resolve([])
      ]);
      
      setPosts(groupPosts || []);
      setJoined(joinedIds.includes(id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load community details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [id, user]);

  const handleJoinToggle = async () => {
    if (!user) {
      toast.error("Please login to join");
      return;
    }
    
    try {
      if (joined) {
        await communityApi.leaveCommunity(id, user.id);
        setJoined(false);
        toast.success("Left community");
      } else {
        await communityApi.joinCommunity(id, user.id);
        setJoined(true);
        toast.success("Joined community!");
      }
      // Refresh details to get updated count
      const updated = await communityApi.getGroup(id);
      setGroup(updated);
    } catch (e) {
      toast.error("Failed to update membership");
    }
  };

  const handleDeleteCommunity = async () => {
    if (deleteConfirmText !== group.name) {
      toast.error("Please type the community name correctly to confirm");
      return;
    }
    
    setIsDeleting(true);
    try {
      await communityApi.deleteCommunity(id);
      toast.success("Community permanently deleted");
      navigate("/community/communities");
    } catch (e) {
      toast.error("Deletion failed");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-[#1d9bf0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-2 flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/[0.1] transition-colors">
          <ArrowLeft size={20} className="text-[#e7e9ea]" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#e7e9ea] truncate">{group.name}</h1>
          <p className="text-[#71767b] text-[13px]">{group.members_count} members</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
            title="Delete Community"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Hero Content */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 sm:h-52 bg-[#333639] w-full overflow-hidden">
          {group.banner_url ? (
            <img src={group.banner_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1d9bf0]/20 to-[#16181c]" />
          )}
        </div>

        {/* Profile Info Overlay */}
        <div className="px-4 pb-4">
          <div className="relative flex justify-between items-start">
            <div className="absolute -top-12 sm:-top-16 left-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-[#2f3336] overflow-hidden">
              <img 
                src={group.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random&color=fff`} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="ml-auto pt-3 flex gap-2">
              <button className="p-2 rounded-full border border-[#536471] hover:bg-white/[0.05] transition-colors">
                <Settings size={20} className="text-[#e7e9ea]" />
              </button>
              <button
                onClick={handleJoinToggle}
                className={`rounded-full px-5 py-2 font-bold text-[15px] transition-all ${
                  joined 
                    ? "border border-[#536471] text-[#e7e9ea] hover:border-red-500 hover:text-red-500"
                    : "bg-[#eff3f4] text-black hover:bg-[#d7dbdc]"
                }`}
              >
                {joined ? "Following" : "Join Community"}
              </button>
            </div>
          </div>

          <div className="mt-14 sm:mt-18">
            <div className="flex items-center gap-1">
              <h2 className="text-[20px] font-extrabold text-[#e7e9ea]">{group.name}</h2>
              <ShieldCheck size={18} className="text-[#1d9bf0]" />
            </div>
            {group.description && (
              <p className="mt-3 text-[15px] text-[#e7e9ea] leading-5 whitespace-pre-wrap">
                {group.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
              <div className="flex items-center gap-1 text-[#71767b] text-[15px]">
                <Users size={16} />
                <span className="font-bold text-[#e7e9ea]">{group.members_count}</span>
                <span>Members</span>
              </div>
              <div className="flex items-center gap-1 text-[#71767b] text-[15px]">
                <Globe size={16} />
                <span>Public Group</span>
              </div>
              <div className="flex items-center gap-1 text-[#71767b] text-[15px]">
                <Calendar size={16} />
                <span>Created April 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Content */}
      <div className="border-b border-[#2f3336] flex">
        <button className="flex-1 py-4 text-[15px] font-bold text-[#e7e9ea] border-b-4 border-[#1d9bf0]">
          Posts
        </button>
        <button className="flex-1 py-4 text-[15px] font-bold text-[#71767b] hover:bg-white/[0.03] transition-colors">
          Media
        </button>
        <button className="flex-1 py-4 text-[15px] font-bold text-[#71767b] hover:bg-white/[0.03] transition-colors">
          Rules
        </button>
      </div>

      {/* Group Composer - Logic added to Composer to handle groupId */}
      <div className="border-b border-[#2f3336]">
        <Composer 
          user={user} 
          onPostCreated={fetchGroupData} 
          groupId={id} 
          placeholder={`Post to ${group.name}...`}
        />
      </div>

      {/* Feed */}
      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1d9bf0]/10 flex items-center justify-center mx-auto mb-4 border border-[#1d9bf0]/20">
              <Lock size={24} className="text-[#1d9bf0]" />
            </div>
            <h3 className="text-[20px] font-bold text-[#e7e9ea]">No posts here yet</h3>
            <p className="text-[#71767b] mt-1">Be the first to share something with the community!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onDeleted={id => setPosts(p => p.filter(x => x.id !== id))} 
            />
          ))
        )}
      </div>

      {/* DELETE WARNING MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 bg-[#5b7083]/40 backdrop-blur-sm">
          <div className="bg-black w-full max-w-[400px] rounded-2xl p-6 border border-[#2f3336] shadow-[0_0_20px_rgba(244,33,46,0.2)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h2 className="text-[23px] font-extrabold text-[#e7e9ea] mb-2 leading-tight">
                Delete community?
              </h2>
              <p className="text-[#71767b] text-[15px] leading-relaxed mb-6">
                This action <span className="text-red-500 font-bold uppercase underline">cannot be undone</span>. 
                This will permanently delete the <strong>{group.name}</strong> community. 
                All posts, members, and data associated with it will be lost forever.
              </p>

              <div className="w-full space-y-4">
                <div className="text-left space-y-1.5">
                  <label className="text-[13px] text-[#71767b] px-1">Type "{group.name}" to confirm:</label>
                  <input 
                    type="text" 
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Community Name"
                    className="w-full bg-transparent border border-[#2f3336] focus:border-red-500/50 outline-none rounded-lg px-4 py-3 text-[#e7e9ea] transition-all"
                  />
                </div>

                <button 
                  onClick={handleDeleteCommunity}
                  disabled={isDeleting || deleteConfirmText !== group.name}
                  className="w-full bg-[#f4212e] hover:bg-[#d81b2a] text-white font-bold py-3 rounded-full transition-all disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Community"}
                </button>
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                  className="w-full bg-transparent border border-[#536471] text-[#e7e9ea] font-bold py-3 rounded-full hover:bg-white/[0.05] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
