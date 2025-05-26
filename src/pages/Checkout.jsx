const CheckoutForm = ({ total, confirmar }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (total <= 0) return;

    setCargando(true);
    setError(null);

    fetch(`${import.meta.env.VITE_API_URL}/create-payment-intent`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ amount: Math.round(total * 100) })
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }
        return res.json();
      })
      .then(data => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No clientSecret received');
        }
      })
      .catch(err => {
        console.error("❌ Error en la petición:", err);
        setError(`Error: ${err.message}`);
      })
      .finally(() => {
        setCargando(false);
      });
  }, [total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setCargando(true);
    setError(null);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // Add any additional billing details if needed
          }
        }
      });

      if (result.error) {
        throw result.error;
      }

      if (result.paymentIntent.status === "succeeded") {
        confirmar();
      }
    } catch (err) {
      console.error(err);
      setError(`Pago fallido: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{ 
        hidePostalCode: true,
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        }
      }} />
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>
      )}

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
        💳 {cargando ? "Procesando..." : "Pagar con tarjeta"}
      </button>
    </form>
  );
};