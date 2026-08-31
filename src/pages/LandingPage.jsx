import React, { useState, useEffect } from "react";
import { Navigation } from "../components/navigation";
import { Header } from "../components/header";
import { Stats } from "../components/stats";
import { Products } from "../components/products";
import { Sectors } from "../components/sectors";
import { About } from "../components/about";
import { Testimonials } from "../components/testimonials";
import { Contact } from "../components/contact";
import JsonData from "../data/data.json";

export const LandingPage = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    setData(JsonData);
  }, []);

  return (
    <div className="lab-landing">
      <Navigation logoSrc="/img/55lab-logo.svg" />
      <Header data={data.Header} />
      <Stats data={data.Stats} />
      <Products data={data.ProductsSection} items={data.Products} />
      <Sectors data={data.Sectors} />
      <About data={data.About} />
      <Testimonials data={data.Testimonials} />
      <Contact data={data.Contact} products={data.Products} />
    </div>
  );
};
