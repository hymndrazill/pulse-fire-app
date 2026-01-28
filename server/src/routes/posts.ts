import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../utils/database';
import { Post, PostWithUser } from '../types';

const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
});

export default async function postRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const db = getDatabase();
      const postsCollection = db.collection<Post>('posts');
      const { page = 1, limit = 20 } = request.query as any;

      const skip = (page - 1) * limit;

      const posts = await postsCollection
        .aggregate<PostWithUser>([
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          { $unwind: '$userDetails' },
          {
            $project: {
              _id: 1,
              content: 1,
              imageUrl: 1,
              likes: 1,
              commentCount: 1,
              createdAt: 1,
              updatedAt: 1,
              user: {
                _id: '$userDetails._id',
                username: '$userDetails.username',
                displayName: '$userDetails.displayName',
                avatar: '$userDetails.avatar',
              },
            },
          },
        ])
        .toArray();

      const userId = (request.user as any)?.userId;
      if (userId) {
        posts.forEach((post) => {
          post.isLiked = post.likes.some(
            (like) => like.toString() === userId
          );
        });
      }

      return reply.send(posts);
    } catch (error) {
      console.error('Get posts error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post(
    '/',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createPostSchema.parse(request.body);
        const db = getDatabase();
        const postsCollection = db.collection<Post>('posts');

        const newPost: Post = {
          userId: new ObjectId(request.user.userId),
          content: body.content,
          imageUrl: body.imageUrl,
          likes: [],
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await postsCollection.insertOne(newPost);

        const createdPost = await postsCollection
          .aggregate<PostWithUser>([
            { $match: { _id: result.insertedId } },
            {
              $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'userDetails',
              },
            },
            { $unwind: '$userDetails' },
            {
              $project: {
                _id: 1,
                content: 1,
                imageUrl: 1,
                likes: 1,
                commentCount: 1,
                createdAt: 1,
                updatedAt: 1,
                user: {
                  _id: '$userDetails._id',
                  username: '$userDetails.username',
                  displayName: '$userDetails.displayName',
                  avatar: '$userDetails.avatar',
                },
              },
            },
          ])
          .next();

        if (createdPost) {
          createdPost.isLiked = false;
        }

        return reply.code(201).send(createdPost);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: error.errors });
        }
        console.error('Create post error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Toggle like
  fastify.post(
    '/:id/like',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;
        const db = getDatabase();
        const postsCollection = db.collection<Post>('posts');
        const userId = new ObjectId(request.user.userId);

        const post = await postsCollection.findOne({ _id: new ObjectId(id) });

        if (!post) {
          return reply.code(404).send({ error: 'Post not found' });
        }

        const likeIndex = post.likes.findIndex(
          (like) => like.toString() === userId.toString()
        );

        let isLiked: boolean;
        if (likeIndex > -1) {
          await postsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $pull: { likes: userId } }
          );
          isLiked = false;
        } else {
          await postsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $push: { likes: userId } }
          );
          isLiked = true;
        }

        const updatedPost = await postsCollection.findOne({
          _id: new ObjectId(id),
        });

        return reply.send({
          isLiked,
          likesCount: updatedPost?.likes.length || 0,
        });
      } catch (error) {
        console.error('Like post error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.delete(
    '/:id',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as any;
        const db = getDatabase();
        const postsCollection = db.collection<Post>('posts');
        const commentsCollection = db.collection('comments');
        const userId = new ObjectId(request.user.userId);

        const post = await postsCollection.findOne({ _id: new ObjectId(id) });

        if (!post) {
          return reply.code(404).send({ error: 'Post not found' });
        }

        if (post.userId.toString() !== userId.toString()) {
          return reply.code(403).send({ error: 'Unauthorized' });
        }

        await postsCollection.deleteOne({ _id: new ObjectId(id) });
        await commentsCollection.deleteMany({ postId: new ObjectId(id) });

        return reply.send({ message: 'Post deleted successfully' });
      } catch (error) {
        console.error('Delete post error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}