import { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const [commentText, setCommentText] = useState('');
  const user = useAuthStore((state) => state.user);
  const { data: comments, refetch } = useComments(postId);
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const { on, off } = useSocket();

  useEffect(() => {
    const handleNewComment = (data: any) => {
      if (data.postId === postId) {
        refetch();
      }
    };

    on('comment:new', handleNewComment);

    return () => {
      off('comment:new', handleNewComment);
    };
  }, [postId, on, off, refetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await createComment.mutateAsync(commentText);
      setCommentText('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      deleteComment.mutate(commentId);
    }
  };

  return (
    <div className="p-5 space-y-4">
      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
          alt={user?.displayName}
          className="w-10 h-10 rounded-full ring-2 ring-accent-200"
        />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all dark:text-white dark:placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || createComment.isPending}
            className="px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-full hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Comments  */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments?.map((comment) => (
          <div
            key={comment._id}
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors animate-fade-in"
          >
            <img
              src={comment.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`}
              alt={comment.user.displayName}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900 dark:text-white">
                  {comment.user.displayName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
            </div>
            {user?._id === comment.user._id && (
              <button
                onClick={() => handleDelete(comment._id)}
                className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {comments?.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;