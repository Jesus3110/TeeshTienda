import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import { obtenerBanners } from "../services/bannersService";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarBanners = async () => {
      try {
        const lista = await obtenerBanners();
        setBanners(lista.sort((a, b) => a.orden - b.orden));
      } catch (error) {
        console.error("Error cargando banners:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarBanners();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    adaptiveHeight: true
  };

  if (cargando) return <div style={{ padding: "2rem", textAlign: "center" }}>Cargando banners...</div>;
  if (banners.length === 0) return null;

  return (
    <div style={{ margin: "1rem 0", maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}>
      <Slider {...settings}>
        {banners.map(banner => (
          <div key={banner.id}>
            <a href={banner.enlace || "#"} style={{ display: "block" }}>
              <img
                src={banner.imagenURL}
                alt={banner.titulo || "Banner promocional"}
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "cover",
                  borderRadius: "8px"
                }}
              />
            </a>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default BannerCarousel;