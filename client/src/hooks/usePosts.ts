import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Post } from '../types';
import { getSocket } from '../lib/socket';

export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get<Post[]>('/posts');
      return data;
    },
  });
};

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
      
      if (socket?.connected) {
        socket.emit('post:created', newPost);
      }
    },
  });
};

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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      
      const previousPosts = queryClient.getQueryData<Post[]>(['posts']);
      
      return { previousPosts };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(['posts'], (old = []) =>
        old.map((post) =>
          post._id === data.postId
            ? {
                ...post,
                isLiked: data.isLiked,
                likes: Array(data.likesCount).fill('') 
              }
            : post
        )
      );

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