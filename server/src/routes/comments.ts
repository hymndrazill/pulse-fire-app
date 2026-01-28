import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../utils/database';
import { Comment, CommentWithUser } from '../types';

const createCommentSchema = z.object({
  content: z.string().min(1).max(300),
});

export default async function commentRoutes(fastify: FastifyInstance) {
  fastify.get('/:postId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { postId } = request.params as any;
      const db = getDatabase();
      const commentsCollection = db.collection<Comment>('comments');

      const comments = await commentsCollection
        .aggregate<CommentWithUser>([
          { $match: { postId: new ObjectId(postId) } },
          { $sort: { createdAt: -1 } },
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
              postId: 1,
              content: 1,
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

      return reply.send(comments);
    } catch (error) {
      console.error('Get comments error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create comment
  fastify.post(
    '/:postId',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { postId } = request.params as any;
        const body = createCommentSchema.parse(request.body);
        const db = getDatabase();
        const commentsCollection = db.collection<Comment>('comments');
        const postsCollection = db.collection('posts');

        const post = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return reply.code(404).send({ error: 'Post not found' });
        }

        const newComment: Comment = {
          postId: new ObjectId(postId),
          userId: new ObjectId(request.user.userId),
          content: body.content,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await commentsCollection.insertOne(newComment);

        await postsCollection.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { commentCount: 1 } }
        );

        const createdComment = await commentsCollection
          .aggregate<CommentWithUser>([
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
                postId: 1,
                content: 1,
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

        return reply.code(201).send(createdComment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({ error: error.errors });
        }
        console.error('Create comment error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  fastify.delete(
    '/:postId/:commentId',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { postId, commentId } = request.params as any;
        const db = getDatabase();
        const commentsCollection = db.collection<Comment>('comments');
        const postsCollection = db.collection('posts');
        const userId = new ObjectId(request.user.userId);

        const comment = await commentsCollection.findOne({
          _id: new ObjectId(commentId),
        });

        if (!comment) {
          return reply.code(404).send({ error: 'Comment not found' });
        }

        if (comment.userId.toString() !== userId.toString()) {
          return reply.code(403).send({ error: 'Unauthorized' });
        }

        await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });

        await postsCollection.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { commentCount: -1 } }
        );

        return reply.send({ message: 'Comment deleted successfully' });
      } catch (error) {
        console.error('Delete comment error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}