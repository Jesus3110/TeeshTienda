const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Stripe = require("stripe");

dotenv.config();
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Enhanced CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://teesh-tienda.vercel.app",
  "https://teesh-tienda.vercel.app/" // Both with and without slash
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (
      allowedOrigins.some(allowed => origin === allowed) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }
    
    console.error("❌ CORS bloqueado:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Explicitly handle OPTIONS requests
app.options('*', cors());

app.use(express.json());

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
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