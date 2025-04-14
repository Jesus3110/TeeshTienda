// src/pages/AdminPanel.jsx
import React from "react";
import "../styles/dashboard.css";

const AdminPanel = () => {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2 className="logo">Admin</h2>
        <nav>
          <ul>
            <li><a href="#perfil">Perfil</a></li>
            <li><a href="#datos">Datos</a></li>
            <li><a href="#productos">Productos</a></li>
            <li><a href="#usuarios">Usuarios</a></li>
            <li><a href="#pedidos">Pedidos</a></li>
            <li><a href="#ingresos">Ingresos</a></li>
            <li><button onClick={() => alert("Cerrar sesión")}>Cerrar sesión</button></li>
          </ul>
        </nav>
      </aside>

      <main className="main-content">
        <h1>Panel de Administración</h1>
        <div className="cards">
          <div className="card">
            <div className="circle purple">
              <span>23%</span>
            </div>
            <p>Pedidos pendientes</p>
          </div>
          <div className="card">
            <div className="circle yellow">
              <span>55%</span>
            </div>
            <p>Pedidos enviados</p>
          </div>
          <div className="card">
            <div className="circle red">
              <span>70%</span>
            </div>
            <p>Pedidos en proceso</p>
          </div>
          <div className="card">
            <div className="circle green">
              <span>--</span>
            </div>
            <p>Ingresos</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
