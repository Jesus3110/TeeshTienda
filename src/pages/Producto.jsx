import React from "react";
import { useParams } from "react-router-dom";

function Producto() {
  const { id } = useParams();
  return <h1>Detalles del producto {id}</h1>;
}

export default Producto;
