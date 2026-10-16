"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Eye, Flag, Star, Search, CalendarCheck, Tag, Sparkles, Users } from "lucide-react";

const enContent = {
    title: "About Us",
    heroTitle: "Welcome to Glow Hub",
    heroSubtitle:
        "Glow Hub is your smart platform to discover and book beauty and personal care services with ease and comfort.",
    intro: [
        "At Glow Hub, we believe the beauty and care experience should be more organized, clear, and easy for both clients and service providers. That's why we built a platform that brings together clients, beauty centers, salons, and care service providers in one place — to simplify searching, comparing, booking, and managing appointments.",
        "We aim to empower clients to access the best beauty and care services — such as hair, skin, nails, makeup, spa, and personal care — with the ability to view service details, prices, ratings, and availability before booking.",
        "We also help service providers run their business more professionally through digital tools that simplify managing bookings, staff, services, ratings, and offers — contributing to a better client experience and higher service quality.",
    ],
    visionTitle: "Our Vision",
    vision:
        "To be the leading platform in Saudi Arabia in the field of booking and managing beauty and care services, by delivering a trusted, easy, and modern digital experience.",
    missionTitle: "Our Mission",
    mission:
        "To connect clients with beauty and care service providers in a smooth and secure way, while offering technical solutions that help salons and beauty centers grow and organize their work efficiently.",
    featuresTitle: "What Makes Glow Hub Special",
    features: [
        "Easy search for services and their providers.",
        "Online appointment booking.",
        "Clear display of services, prices, and ratings.",
        "An easy experience for both clients and service providers.",
        "Support for service providers in managing bookings, staff, and clients.",
    ],
    closing: "At Glow Hub, we always strive to make the beauty and care experience easier, more trustworthy, and more comfortable.",
};

const arContent = {
    title: "من نحن",
    heroTitle: "مرحبًا بك في ذا قلو هب",
    heroSubtitle:
        "منصتك الذكية لاكتشاف وحجز خدمات التجميل والعناية الشخصية بكل سهولة وراحة.",
    intro: [
        "في ذا قلو هب، نؤمن أن تجربة العناية والجمال يجب أن تكون أكثر تنظيمًا، وضوحًا، وسهولة لكل من العملاء ومقدمي الخدمات. لذلك صممنا منصة تجمع بين العملاء ومراكز التجميل والصالونات ومقدمي خدمات العناية في مكان واحد، لتسهيل عملية البحث، المقارنة، الحجز، وإدارة المواعيد.",
        "نهدف إلى تمكين العملاء من الوصول إلى أفضل خدمات التجميل والعناية، مثل خدمات الشعر، البشرة، الأظافر، المكياج، السبا، والعناية الشخصية، مع إمكانية الاطلاع على تفاصيل الخدمات، الأسعار، التقييمات، ومواعيد التوفر قبل الحجز.",
        "كما نساعد مزودي الخدمات على إدارة أعمالهم بشكل أكثر احترافية من خلال أدوات رقمية تسهّل إدارة الحجوزات، الموظفين، الخدمات، التقييمات، والعروض، بما يساهم في تحسين تجربة العميل ورفع جودة الخدمة.",
    ],
    visionTitle: "رؤيتنا",
    vision:
        "أن نكون المنصة الرائدة في المملكة العربية السعودية في مجال حجز وإدارة خدمات التجميل والعناية، من خلال تقديم تجربة رقمية موثوقة، سهلة، وعصرية.",
    missionTitle: "رسالتنا",
    mission:
        "ربط العملاء بمقدمي خدمات التجميل والعناية بطريقة سلسة وآمنة، مع توفير حلول تقنية تساعد الصالونات ومراكز التجميل على النمو وتنظيم أعمالهم بكفاءة.",
    featuresTitle: "ما يميز ذا قلو هب",
    features: [
        "سهولة البحث عن الخدمات ومقدميها.",
        "إمكانية حجز المواعيد إلكترونيًا.",
        "عرض واضح للخدمات والأسعار والتقييمات.",
        "تجربة استخدام سهلة للعملاء ومقدمي الخدمات.",
        "دعم لمزودي الخدمات في إدارة الحجوزات والموظفين والعملاء.",
    ],
    closing: "في ذا قلو هب، نسعى دائمًا لجعل تجربة الجمال والعناية أكثر سهولة، ثقة، وراحة.",
};

const featureIcons = [Search, CalendarCheck, Tag, Sparkles, Users];

export default function AboutPage() {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-background" />;

    const isAr = i18n.language?.startsWith("ar");
    const t = isAr ? arContent : enContent;
    const dir = isAr ? "rtl" : "ltr";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div
                dir={dir}
                className={`flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 text-foreground ${isAr ? "text-right" : "text-left"}`}
            >
                <div className="max-w-3xl w-full space-y-8">
                    <div className="border-b border-border pb-6">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{t.title}</h1>
                    </div>

                    {/* Hero */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 text-center space-y-4">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#79A66B]/10">
                            <Sparkles className="h-7 w-7 text-[#79A66B]" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">{t.heroTitle}</h2>
                        <p className="text-lg leading-relaxed text-foreground/80 font-medium">{t.heroSubtitle}</p>
                    </div>

                    {/* Intro */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-5">
                        {t.intro.map((p, i) => (
                            <p key={i} className="text-foreground/80 leading-relaxed">
                                {p}
                            </p>
                        ))}
                    </div>

                    {/* Vision & Mission */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-[#79A66B]/5 border border-[#79A66B]/20 rounded-[16px] p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#79A66B]/15">
                                    <Eye className="h-5 w-5 text-[#79A66B]" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">{t.visionTitle}</h3>
                            </div>
                            <p className="text-foreground/80 leading-relaxed">{t.vision}</p>
                        </div>
                        <div className="bg-[#79A66B]/5 border border-[#79A66B]/20 rounded-[16px] p-6 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#79A66B]/15">
                                    <Flag className="h-5 w-5 text-[#79A66B]" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">{t.missionTitle}</h3>
                            </div>
                            <p className="text-foreground/80 leading-relaxed">{t.mission}</p>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-5">
                        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                            <Star className="h-6 w-6 text-[#79A66B]" />
                            {t.featuresTitle}
                        </h2>
                        <ul className="space-y-3">
                            {t.features.map((item, i) => {
                                const Icon = featureIcons[i] ?? Star;
                                return (
                                    <li
                                        key={i}
                                        className="flex items-center gap-3 bg-muted/30 p-4 rounded-lg text-foreground/80"
                                    >
                                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#79A66B]/10">
                                            <Icon className="h-4 w-4 text-[#79A66B]" />
                                        </span>
                                        {item}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Closing */}
                    <div className="bg-[#79A66B] text-white rounded-[16px] p-8 text-center">
                        <p className="text-lg font-semibold leading-relaxed">{t.closing}</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
