import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import Toast from "../components/Toast";
import "../styles/dashboard.css";

const AdminPanel = () => {
  const [toastVisible, setToastVisible] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard">
 
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

      {toastVisible && (
        <Toast message="¡Sesión cerrada!" onClose={() => setToastVisible(false)} />
      )}
    </div>
  );
};

export default AdminPanel;
