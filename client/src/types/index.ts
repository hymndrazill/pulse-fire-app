export interface User {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
}

export interface Post {
  _id: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  isLiked?: boolean;
}

export interface Comment {
  _id: string;
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline?: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}