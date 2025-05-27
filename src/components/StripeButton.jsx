import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ total, confirmar }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (total <= 0) return;

    fetch(`${import.meta.env.VITE_API_URL}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(total * 100) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setModalError(data.error); // ⛔ mostrar modal si backend responde error
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setModalError("❌ No se pudo obtener clientSecret.");
        }
      })
      .catch(err => {
        console.error("❌ Error en la petición:", err);
        setModalError("Error conectando con el servidor de pagos.");
      });
  }, [total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setCargando(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    if (result.error) {
      console.error(result.error);
      setModalError("❌ Error en el pago: " + result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
      alert("✅ Pago aprobado por Stripe");
      confirmar();
    }

    setCargando(false);
  };

  return (
    <>
      {modalError && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999
        }}>
          <div style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: "10px",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)"
          }}>
            <p style={{ marginBottom: "1rem", fontWeight: "bold", color: "#e74c3c" }}>{modalError}</p>
            <button onClick={() => setModalError("")} style={{
              background: "#e74c3c",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "5px",
              cursor: "pointer"
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CardElement options={{ hidePostalCode: true }} />
        <button
          type="submit"
          disabled={!stripe || !clientSecret || total <= 0 || cargando}
          style={{
            marginTop: "1rem",
            background: "#27ae60",
            color: "#fff",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "5px",
            opacity: !clientSecret || cargando ? 0.6 : 1,
            cursor: !clientSecret || cargando ? "not-allowed" : "pointer"
          }}
        >
          💳 {cargando ? "Procesando..." : "Pagar con tarjeta (Stripe)"}
        </button>
      </form>
    </>
  );
};

const StripeButton = ({ total, confirmar, modoPrueba }) => {
  if (modoPrueba) {
    return (
      <button
        onClick={() => {
          alert("🧪 Simulando pago con Stripe (modo prueba)...");
          confirmar();
        }}
        style={{
          marginTop: "1rem",
          background: "#9b59b6",
          color: "#fff",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        💳 Simular pago con Stripe (modo prueba)
      </button>
    );
  } else {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm total={total} confirmar={confirmar} />
      </Elements>
    );
  }
};

export default StripeButton;
