import React, { useState, useEffect } from "react";
import { Navigation } from "../components/navigation";
import { Header } from "../components/header";
import { Stats } from "../components/stats";
import { Services } from "../components/services";
import { Products } from "../components/products";
import { TechStack } from "../components/techStack";
import { Process } from "../components/process";
import { About } from "../components/about";
import { Gallery } from "../components/gallery";
import { Testimonials } from "../components/testimonials";
import { Contact } from "../components/contact";
import JsonData from "../data/data.json";

export const LandingPage = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    setData(JsonData);
  }, []);

  return (
    <>
      <Navigation logoSrc="/img/55lab-logo.svg" />
      <Header data={data.Header} />
      <Stats data={data.Stats} />
      <Services data={data.Services} />
      <Products data={data.ProductsSection} items={data.Products} />
      <TechStack data={data.TechStack} />
      <Process data={data.Process} />
      <About data={data.About} />
      <Gallery data={data.Gallery} />
      <Testimonials data={data.Testimonials} />
      <Contact data={data.Contact} />
    </>
  );
};
