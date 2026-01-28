import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { User } from '../types';
import { getDatabase } from '../utils/database';

// zod schemas for auth
const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(request.body);
      const db = getDatabase();
      const usersCollection = db.collection<User>('users');

      const existingUser = await usersCollection.findOne({
        $or: [{ email: body.email }, { username: body.username }],
      });

      if (existingUser) {
        return reply.code(400).send({
          error: 'User with this email or username already exists',
        });
      }

      const hashedPassword = await hashPassword(body.password);
      const newUser: User = {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        displayName: body.displayName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.username}`,
        bio: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      const userId = result.insertedId.toString();

      const token = generateToken(fastify, {
        userId,
        username: body.username,
        email: body.email,
      });

      return reply.code(201).send({
        token,
        user: {
          _id: userId,
          username: newUser.username,
          email: newUser.email,
          displayName: newUser.displayName,
          avatar: newUser.avatar,
          bio: newUser.bio,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      console.error('Register error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(request.body);
      const db = getDatabase();
      const usersCollection = db.collection<User>('users');

      const user = await usersCollection.findOne({ email: body.email });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(body.password, user.password);

      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = generateToken(fastify, {
        userId: user._id!.toString(),
        username: user.username,
        email: user.email,
      });

      return reply.send({
        token,
        user: {
          _id: user._id!.toString(),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      console.error('Login error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  fastify.get(
    '/me',
    { onRequest: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const db = getDatabase();
        const usersCollection = db.collection<User>('users');
        const { ObjectId } = require('mongodb');

        const user = await usersCollection.findOne({
          _id: new ObjectId(request.user.userId),
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({
          _id: user._id!.toString(),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        });
      } catch (error) {
        console.error('Get user error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}