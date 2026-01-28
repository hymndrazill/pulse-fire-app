import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import { JWTPayload } from '../types';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(fastify: FastifyInstance, payload: JWTPayload): string {
  return fastify.jwt.sign(payload, { expiresIn: '7d' });
}

export async function verifyToken(
  fastify: FastifyInstance,
  token: string
): Promise<JWTPayload> {
  return fastify.jwt.verify<JWTPayload>(token);
}