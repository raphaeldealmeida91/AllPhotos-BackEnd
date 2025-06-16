import Fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import fastifyCors from "@fastify/cors";
import "dotenv/config";
import logger from "./utils/logger.js";
import routes from "./routes/routes.js";

const fastify = Fastify();

await fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

await fastify.register(fastifyCors, {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
});

await fastify.register(routes);

fastify.listen({ port: 3000, host: "127.0.0.1" }, (err, address) => {
  if (err) throw err;
  logger.info(`🚀 Serveur lancé sur ${address}`);
});
