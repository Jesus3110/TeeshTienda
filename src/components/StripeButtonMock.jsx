const StripeButtonMock = ({ total, confirmar }) => (
    <div>
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
    </div>
  );
  
  export default StripeButtonMock;
  