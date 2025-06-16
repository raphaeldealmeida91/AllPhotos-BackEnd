import Stripe from "stripe";
import logger from "../utils/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createStripeCheckoutSession(request, reply) {
  try {
    const { count, pathImgs } = request.body;

    const price = pathImgs.length * 3;

    if (!count || !price || !pathImgs) {
      return reply
        .code(400)
        .send({ success: false, message: "Données incomplètes" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Commande de ${count} image(s)`,
              description: `Commande via ton site.`,
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      success_url:
        "https://ton-site.com/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://ton-site.com/cancel",
      metadata: {
        images: JSON.stringify(pathImgs),
      },
    });
    return reply.code(200).send({ url: session.url });
  } catch (err) {
    logger.error("Erreur lors de la création de la session Stripe :");
    logger.error({ err });
    return reply
      .code(500)
      .send({ success: false, message: "Une erreur interne est survenue." });
  }
}
