// backend/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://teesh-tienda.vercel.app",
    "https://teesh-tienda-6jj2x4i45-jesus3110s-projects.vercel.app",
    "https://teesh-tienda-git-main-jesus3110s-projects.vercel.app" // 👈 este es el nuevo
  ]
}));


app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("❌ Error Stripe:", err);
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
