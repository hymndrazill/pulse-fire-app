import { useState } from "react";
import { Image, Send, X } from "lucide-react";
import { useCreatePost } from "../hooks/usePosts";
import { useAuthStore } from "../store/authStore";

const CreatePost = () => {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const user = useAuthStore((state) => state.user);
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createPost.mutateAsync({
        content,
        imageUrl: imageUrl || undefined,
      });
      setContent("");
      setImageUrl("");
      setShowImageInput(false);
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-primary-50 to-accent-50 rounded-2xl shadow-xl p-6 border border-primary-100 mb-6">
      <div className="flex gap-4">
        <img
          src={
            user?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`
          }
          alt={user?.displayName}
          className="w-12 h-12 rounded-full ring-2 ring-primary-300"
        />
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            rows={3}
            maxLength={500}
          />

          {showImageInput && (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL..."
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false);
                  setImageUrl("");
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full max-h-60 object-cover rounded-lg"
                onError={() => setImageUrl("")}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="flex items-center gap-2 px-4 py-2 text-accent-600 hover:bg-accent-50 rounded-lg transition-all"
            >
              <Image className="w-5 h-5" />
              <span className="font-medium">Add Image</span>
            </button>

            <button
              type="submit"
              disabled={!content.trim() || createPost.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-full hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <Send className="w-5 h-5" />
              <span>Post</span>
            </button>
          </div>

          <div className="text-right text-sm text-gray-500">
            {content.length}/500
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
