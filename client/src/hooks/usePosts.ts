import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Post } from '../types';
import { getSocket } from '../lib/socket';

// Fetch posts
export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get<Post[]>('/posts');
      return data;
    },
  });
};

// Create post
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  const socket = getSocket();

  return useMutation({
    mutationFn: async (postData: { content: string; imageUrl?: string }) => {
      const { data } = await api.post<Post>('/posts', postData);
      return data;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<Post[]>(['posts'], (old = []) => [newPost, ...old]);
      
      // Emit socket event for real-time updates
      if (socket?.connected) {
        socket.emit('post:created', newPost);
      }
    },
  });
};

// Toggle like
export const useToggleLike = () => {
  const queryClient = useQueryClient();
  const socket = getSocket();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post<{ isLiked: boolean; likesCount: number }>(
        `/posts/${postId}/like`
      );
      return { postId, ...data };
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      const previousPosts = queryClient.getQueryData<Post[]>(['posts']);
      
      return { previousPosts };
    },
    onSuccess: (data) => {
      // Update the posts query with the new like data
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.map((post) =>
          post._id === data.postId
            ? {
                ...post,
                isLiked: data.isLiked,
                likes: Array(data.likesCount).fill('') // Create array of correct length for display
              }
            : post
        )
      );

      // Emit socket event
      if (socket?.connected) {
        socket.emit('post:liked', data);
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
  });
};

// Delete post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      await api.delete(`/posts/${postId}`);
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.filter((post) => post._id !== postId)
      );
    },
  });
};