import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  _id?: ObjectId;
  userId: ObjectId;
  content: string;
  imageUrl?: string;
  likes: ObjectId[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id?: ObjectId;
  postId: ObjectId;
  userId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostWithUser extends Omit<Post, 'userId'> {
  user: {
    _id: ObjectId;
    username: string;
    displayName: string;
    avatar?: string;
  };
  isLiked?: boolean;
}

export interface CommentWithUser extends Omit<Comment, 'userId'> {
  user: {
    _id: ObjectId;
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
}