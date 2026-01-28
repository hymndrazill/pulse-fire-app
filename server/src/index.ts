import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { Server } from "socket.io";
import { connectDatabase } from "./utils/database";
import { verifyToken } from "./utils/auth";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import commentRoutes from "./routes/comments";

const PORT = process.env.PORT || "4003"
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pulse-social";
const JWT_SECRET =
  process.env.JWT_SECRET || "your-very-super-secret-jwt-key-change-this";

const fastify = Fastify({
  logger: true,
});

fastify.register(jwt, {
  secret: JWT_SECRET,
});

fastify.register(cors, {
  origin: true,
  credentials: true,
});

fastify.decorate(
  "authenticate",
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply
          .code(401)
          .send({ error: "Missing or invalid authorization header" });
      }

      const token = authHeader.substring(7);
      const payload = await verifyToken(fastify, token);
      request.user = payload;
    } catch (error) {
      return reply.code(401).send({ error: "Invalid token" });
    }
  },
);

// routes
fastify.register(authRoutes, { prefix: "/api/auth" });
fastify.register(postRoutes, { prefix: "/api/posts" });
fastify.register(commentRoutes, { prefix: "/api/comments" });

// health check api
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await connectDatabase(MONGODB_URI);
    await fastify.listen({ port: PORT, host: "0.0.0.0" });

    //  socket.io
    const io = new Server(fastify.server, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
      },
    });

    // socket.io middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const payload = await verifyToken(fastify, token);
        socket.data.user = payload;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket) => {
      const username = socket.data.user?.username || "Anonymous";
      console.log(`User connected: ${username} (${socket.id})`);

      socket.join("feed");

      // Handle new posts
      socket.on("post:created", (post) => {
        console.log("New post created:", post._id);
        socket.to("feed").emit("post:new", post);
      });

      // Handle new comment 
      socket.on("comment:created", (data) => {
        console.log("New comment on post:", data.postId);
        io.to("feed").emit("comment:new", data);
      });

      // Handle like 
      socket.on("post:liked", (data) => {
        console.log("Post liked:", data.postId);
        socket.to("feed").emit("post:like", data);
      });

      socket.on("typing:start", (data) => {
        socket.to("feed").emit("user:typing", {
          userId: socket.data.user?.userId,
          username: socket.data.user?.username,
          postId: data.postId,
        });
      });

      socket.on("typing:stop", (data) => {
        socket.to("feed").emit("user:typing:stop", {
          userId: socket.data.user?.userId,
          postId: data.postId,
        });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(` User disconnected: ${username} (${socket.id})`);
      });
    });

    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Socket.io ready for real-time connections`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\n Shutting down gracefully...");
  await fastify.close();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

start();

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      userId: string;
      username: string;
      email: string;
    };
  }
}
