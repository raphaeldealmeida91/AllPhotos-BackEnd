import Stripe from "stripe";
import logger from "../utils/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function stripeWebhook(request, reply) {
  const sig = request.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
  } catch (err) {
    logger.error("Erreur de vérification du webhook Stripe :");
    logger.error({ err });
    return reply.code(400).send(`Webhook Error: ${err.message}`);
  }

  // Traitement des évènements Stripe
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    console.log("Paiement réussi !");
    console.log("Session:", session);

    // Ici tu récupères tes données transmises via metadata
    const pathImgs = JSON.parse(session.metadata.images);

    // Ta fonction métier ici
    await traiterLaCommande(pathImgs, session);

    return reply.code(200).send();
  }

  // Pour les autres types d'événements
  return reply.code(200).send();
}
