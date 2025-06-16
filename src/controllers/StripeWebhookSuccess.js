import Stripe from "stripe";
import logger from "../utils/logger.js";
import { copyFileToFolder } from "./CopyFileToFolderSuccess.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function stripeWebhook(request, reply) {
  const sig = request.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  logger.info({ body: request.body });
  logger.info({ sig });
  logger.info({ webhookSecret });

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, webhookSecret);
  } catch (err) {
    logger.error("Erreur de vérification du webhook Stripe :");
    logger.error({ err });
    return reply.code(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    logger.info("Paiement réussi !");
    logger.info("Session:", session);
    const customerEmail =
      session.customer_details?.email || "email non disponible";
    logger.info(`Email client : ${customerEmail}`);

    try {
      const pathImgs = JSON.parse(session.metadata.images);
      if (Array.isArray(pathImgs)) {
        await copyFileToFolder(imgPath);
      } else {
        logger.error("Metadata images n'est pas un tableau");
      }
    } catch (err) {
      logger.error("Erreur lors de la copie des fichiers après paiement :");
      logger.error({ err });
    }
    return reply.code(200).send();
  }
  return reply.code(200).send();
}
