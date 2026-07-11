import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { bundles, site } from "@/config/site";

export async function POST(req: NextRequest) {
  try {
    const { bundleId } = await req.json();
    const bundle = bundles.find((b) => b.id === bundleId);

    if (!bundle) {
      return NextResponse.json({ error: "Bundle inconnu." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? new URL(req.url).origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: site.currency.toLowerCase(),
            unit_amount: Math.round(bundle.price * 100),
            product_data: {
              name: bundle.stripePriceLabel,
              description: bundle.description,
            },
          },
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC", "CA"],
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        bundleId: bundle.id,
        units: String(bundle.units),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erreur création session Stripe:", error);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement." },
      { status: 500 }
    );
  }
}
