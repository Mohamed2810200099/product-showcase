import React from "react";
import { Outlet } from "react-router-dom";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppFloat from "@/components/layout/WhatsAppFloat";
import MobileBottomBar from "@/components/layout/MobileBottomBar";
import CartDrawer from "@/components/CartDrawer";

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <AnnouncementBar />
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <WhatsAppFloat />
    <MobileBottomBar />
    <CartDrawer />
  </div>
);

export default PublicLayout;
