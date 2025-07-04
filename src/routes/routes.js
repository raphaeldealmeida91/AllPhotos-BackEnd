import { createStripeCheckoutSession } from "../controllers/CreateStripeCheckoutSession.js";
import DeleteOneFolder from "../controllers/DeleteOneFolder.js";
import GetAllFolders from "../controllers/GetAllFolders.js";
import GetImagesByFolderWithWatermark from "../controllers/GetImagesByFolderWithWatermark.js";
import { GetImagesByIdsWithWatermark } from "../controllers/GetImagesByIdsWithWatermark.js";

import PostImagesInFolder from "../controllers/PostImagesInFolder.js";
import { stripeWebhook } from "../controllers/StripeWebhookSuccess.js";

export default async function routes(fastify, options) {
  fastify.post("/api/images/:folder", PostImagesInFolder);
  fastify.get(
    "/api/images/watermarked/:folder",
    GetImagesByFolderWithWatermark
  );
  fastify.post("/api/images/watermarked/id/", GetImagesByIdsWithWatermark);
  fastify.get("/api/folders/", GetAllFolders);
  fastify.delete("/api/folder/:folder", DeleteOneFolder);
  fastify.post("/api/payment/checkout", createStripeCheckoutSession);
  fastify.post(
    "/api/payment/webhook",
    {
      bodyLimit: 1048576,
      config: {
        rawBody: true,
      },
      preParsing: (req, reply, payload, done) => {
        const chunks = [];
        payload.on("data", (chunk) => chunks.push(chunk));
        payload.on("end", () => {
          const rawBody = Buffer.concat(chunks);
          req.rawBody = rawBody;
          done(null, rawBody);
        });
      },
    },
    stripeWebhook
  );
}
