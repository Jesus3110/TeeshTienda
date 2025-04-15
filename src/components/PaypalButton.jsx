// src/components/PaypalButton.jsx
import React, { useEffect } from "react";

const PaypalButton = ({ total, onSuccess }) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=MXN`;
    script.async = true;

    script.onload = () => {
      window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "paypal"
        },
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: total.toFixed(2),
              },
            }],
          });
        },
        onApprove: async (data, actions) => {
          await actions.order.capture();
          onSuccess();
        },
        onError: (err) => {
          console.error("Error en PayPal:", err);
          alert("Error con el pago en PayPal.");
        },
      }).render("#paypal-button-container");
    };

    document.body.appendChild(script);

    return () => {
      document.getElementById("paypal-button-container").innerHTML = "";
    };
  }, [total, onSuccess]);

  return <div id="paypal-button-container" />;
};

export default PaypalButton;
