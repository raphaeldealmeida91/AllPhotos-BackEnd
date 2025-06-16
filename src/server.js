import Fastify from "fastify";
import fastifyMultipart from "@fastify/multipart";
import fastifyHelmet from "@fastify/helmet";
import fastifyCors from "@fastify/cors";
import "dotenv/config";
import logger from "./utils/logger.js";
import routes from "./routes/routes.js";

const fastify = Fastify({
  disableRequestLogging: false,
  trustProxy: true,
  bodyLimit: 5 * 1024 * 1024,
  http2: false,
});

await fastify.register(fastifyHelmet);

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

fastify.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  (req, body, done) => {
    done(null, body);
  }
);

fastify.addHook("onSend", async (request, reply, payload) => {
  reply.header("x-powered-by", "");
  return payload;
});

fastify.setErrorHandler((error, request, reply) => {
  logger.error(error);
  reply.status(error.statusCode ?? 500).send({
    success: false,
    message: error.message || "Erreur serveur interne",
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

try {
  await fastify.listen({ port: PORT, host: HOST });
  logger.info(`🚀 Serveur lancé sur http://${HOST}:${PORT}`);
} catch (err) {
  logger.error(err);
  process.exit(1);
}
