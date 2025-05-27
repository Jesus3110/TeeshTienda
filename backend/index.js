// backend/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://teesh-tienda.vercel.app"
    ];

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      console.error("❌ CORS bloqueado:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  }
}));



app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  console.log("📦 Monto recibido:", amount);
  console.log("🔑 Clave Stripe:", process.env.STRIPE_SECRET_KEY ? "✔️ Cargada" : "❌ No cargada");

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "mxn",
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
