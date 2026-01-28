import { useState } from "react";
import { Heart, MessageCircle, Trash2, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Post } from "../types";
import { useToggleLike, useDeletePost } from "../hooks/usePosts";
import { useAuthStore } from "../store/authStore";
import { useOnlineStore } from "../store/onlineStore";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const user = useAuthStore((state) => state.user);
  const onlineUsers = useOnlineStore((state) => state.onlineUsers);
  useOnlineUsers();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();

  const handleLike = () => {
    toggleLike.mutate(post._id);
  };
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(post._id);
    }
  };

  const isOwner = user?._id === post.user._id;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 animate-slide-up">
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={
                post.user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user.username}`
              }
              alt={post.user.displayName}
              className="w-12 h-12 rounded-full ring-2 ring-primary-200"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-colors duration-300 ${
                onlineUsers[post.user._id] ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {post.user.displayName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{post.user.username}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 py-1 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="mt-4 rounded-xl w-full object-cover max-h-96"
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-all duration-200 group ${
              post.isLiked
                ? "text-primary-600"
                : "text-gray-600 hover:text-primary-600"
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                post.isLiked ? "fill-current" : ""
              }`}
            />
            <span className="font-medium">{post.likes?.length || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-accent-600 transition-all duration-200 group"
          >
            <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="font-medium">{post.commentCount}</span>
          </button>
        </div>

        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 dark:border-slate-700">
          <CommentSection postId={post._id} />
        </div>
      )}
    </div>
  );
};

export default PostCard;
