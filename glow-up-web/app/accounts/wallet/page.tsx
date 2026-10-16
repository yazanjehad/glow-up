"use client";
import React, { useState } from "react";
import PaymentCenter from "@/components/payment-details/PaymentCenter";
import CardManagement from "@/components/payment-details/CardManagement";
interface Card {
  id: number;
  type: string;
  name: string;
  last4: string;
  logo: string;
}

const WalletPage: React.FC = () => {

  const cards: Card[] = [
    {
      id: 1,
      type: "MasterCard",
      name: "Saeed Card",
      last4: "8395 **** **** ****",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
    },
    {
      id: 2,
      type: "Visa",
      name: "Saeed Visa",
      last4: "8395 **** **** ****",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
    },
    {
      id: 3,
      type: "Mada",
      name: "Saeed Mada",
      last4: "8395 **** **** ****",
      logo: "./madaCard.png",
    },
  ];

  const cardsOthers: Card[] = [
    {
      id: 1,
      type: "GooglePay",
      name: "googlePay",
      last4: "",
      logo: "https://image.similarpng.com/file/similarpng/original-picture/2020/06/Logo-google-icon-PNG.png",
    },
    {
      id: 2,
      type: "ApplePay",
      name: "applePay",
      last4: "",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    },
  ];

  const [activePayment, setActivePayment] = useState<string | null>(null);
  return (
    <main className="min-h-screen flex flex-col items-center p-4 gap-6">
      <CardManagement
        className=""
        activeCardId={cards.find((c) => `card-${c.id}` === activePayment)?.id}
        onSelectCard={(id) => setActivePayment(`card-${id}`)}
      />

      <PaymentCenter
        className="w-full"
        isActive={activePayment === "center"}
        onClick={() => setActivePayment("center")}
      />
    </main>
  );
};

export default WalletPage;
