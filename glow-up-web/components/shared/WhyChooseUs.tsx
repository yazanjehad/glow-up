"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";

export function WhyChooseUs() {
    const { i18n, t } = useTranslation();
    const isRTL = i18n.language === "ar";

    const features = [
        {
            image: "/why-glowup3.png",
            titleKey: "whyChooseUs.easyBooking.title",
        },
        {
            image: "/why-glowup2.png",
            titleKey: "whyChooseUs.genuineReviews.title",
        },
        {
            image: "/why-glowup1.png",
            titleKey: "whyChooseUs.realDeals.title",
        },
    ];

    return (
        <section dir={isRTL ? "rtl" : "ltr"} className="pt-4 md:pt-4 pb-36 md:pb-36">
            <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 bg-gradient-to-r from-[#79A66B] to-[#2F4029] bg-clip-text text-transparent">
                    {t("whyChooseUs.title")}
                </h2>
                <hr className="border-[#79A66B] mb-12 max-w-md mx-auto" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="text-center"
                        >
                            <div className="mx-auto relative" style={{ width: '295px', height: '220px' }}>
                                <Image
                                    src={feature.image}
                                    alt={t(feature.titleKey)}
                                    width={295}
                                    height={220}
                                    className="object-contain"
                                />
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-2 mt-4">
                                {t(feature.titleKey)}
                            </h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
