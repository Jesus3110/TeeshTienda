import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { obtenerBanners } from "../services/bannersService";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getDatabase, ref, onValue } from "firebase/database";

function BannerCarousel({ banners: bannersProp }) {
  const [banners, setBanners] = useState(bannersProp || []);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (bannersProp) {
      setBanners(bannersProp);
      setCargando(false);
      return;
    }
    // Suscripción en tiempo real
    const db = getDatabase();
    const bannersRef = ref(db, "banners");
    const unsubscribe = onValue(bannersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((b) => b.activo !== false)
        .sort((a, b) => (a.orden || 0) - (b.orden || 0));
      setBanners(lista);
      setCargando(false);
    });
    return () => unsubscribe();
  }, [bannersProp]);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    adaptiveHeight: true,
  };

  if (cargando)
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Cargando banners...
      </div>
    );
  if (banners.length === 0) return null;

  console.log("BANNERS EN CAROUSEL:", banners);

  return (
    <div
      style={{
        margin: "1rem 0",
        maxWidth: "1200px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Slider {...settings}>
        {banners.map((banner) => {
          console.log("RENDER BANNER:", banner);
          return (
            <div key={banner.id} style={{ position: "relative" }}>
              <a
                href={banner.enlace || "#"}
                style={{ display: "block", position: "relative" }}
              >
                <div
  style={{
    width: "100%",
    aspectRatio: "16/9", // ✅ fuerza proporción
    maxHeight: "300px",  // ✅ límite visual
    overflow: "hidden",
    position: "relative",
    borderRadius: "12px",
    backgroundColor: "#000",
  }}
>
  <img
    src={banner.imagenURL}
    alt={banner.titulo || "Banner"}
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
      border: "none",
    }}
  />
</div>


                {/* Porcentaje - esquina superior derecha */}
                {banner.porcentaje && (
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      backgroundColor: "#fff",
                      color: "#D72638", // Rojo vibrante
                      padding: "0.5rem 1rem",
                      borderRadius: "999px",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  >
                    {banner.porcentaje}% OFF
                  </div>
                )}

                {/* Título - esquina inferior izquierda */}
                {banner.titulo && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "1rem",
                      left: "1rem",
                      backgroundColor: "rgba(215, 38, 56, 0.8)", // Rojo semitransparente
                      color: "#fff",
                      padding: "0.6rem 1rem",
                      borderRadius: "8px",
                      fontSize: "1.3rem",
                      fontWeight: "bold",
                      maxWidth: "80%",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                  >
                    {banner.titulo}🔥
                  </div>
                )}
              </a>
            </div>
          );
        })}
      </Slider>
    </div>
  );
}

export default BannerCarousel;
