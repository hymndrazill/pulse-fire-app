import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Comment, Post } from '../types';
import { getSocket } from '../lib/socket';

// Fetch comments for a post
export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data } = await api.get<Comment[]>(`/comments/${postId}`);
      return data;
    },
    enabled: !!postId,
  });
};

// Create comment
export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();
  const socket = getSocket();

  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<Comment>(`/comments/${postId}`, {
        content,
      });
      return data;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) => [
        newComment,
        ...old,
      ]);

      // Update comment count in posts
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.map((post) =>
          post._id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );

      // Emit socket event
      if (socket?.connected) {
        socket.emit('comment:created', { postId, comment: newComment });
      }
    },
  });
};

// Delete comment
export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/comments/${postId}/${commentId}`);
      return commentId;
    },
    onSuccess: (commentId) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old = []) =>
        old.filter((comment) => comment._id !== commentId)
      );

      // Update comment count in posts
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.map((post) =>
          post._id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        )
      );
    },
  });
};