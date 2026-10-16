"use client";

import Header from "@/components/shared/Header";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const enContent = {
    title: "Terms of Service",
    lastUpdated: "Last updated: March 5, 2026",
    welcome: "By using The Glow Hub, you agree to the following Terms of Service.",
    s1: { title: "1. Service Description", p1: "The Glow Hub is a platform that allows users to:", items: ["Discover nearby salons", "Book appointments", "Pay for services through integrated payment gateways"], p2: "The app acts only as a booking platform connecting users with salons." },
    s2: { title: "2. User Responsibilities", p1: "By using the app you agree to:", items: ["Provide accurate information when booking", "Respect salon policies and appointment times", "Use the app only for lawful purposes"] },
    s3: { title: "3. Bookings", p1: "When you book a service:", items: ["The booking is sent to the selected salon", "The salon is responsible for delivering the service", "Availability may change depending on salon schedules"] },
    s4: { title: "4. Payments", p1: "Payments made through the app are processed using secure third-party payment providers.", p2: "We are not responsible for payment processing errors caused by third-party providers.", p3: "Refund policies may depend on the salon’s policy." },
    s5: { title: "5. Cancellations", p1: "Users may cancel bookings according to the cancellation policy set by the salon.", p2: "Late cancellations or no-shows may result in charges depending on salon rules." },
    s6: { title: "6. Limitation of Liability", p1: "The Glow Hub acts as an intermediary platform between users and salons.", p2: "We are not responsible for:", items: ["Quality of salon services", "Appointment delays", "Disputes between users and salons"] },
    s7: { title: "7. Account Termination", p1: "We reserve the right to suspend or terminate accounts that:", items: ["Violate these terms", "Abuse the platform", "Engage in fraudulent activity"] },
    s8: { title: "8. Changes to the Terms", p1: "We may update these Terms of Service from time to time.", p2: "Continued use of the app means acceptance of the updated terms." }
};

const arContent = {
    title: "شروط الخدمة",
    lastUpdated: "آخر تحديث: 5 مارس 2026",
    welcome: "باستخدامك لتطبيق The Glow Hub، فإنك توافق على شروط الخدمة التالية.",
    s1: { title: "1. وصف الخدمة", p1: "يعد The Glow Hub منصة تتيح للمستخدمين:", items: ["اكتشاف الصالونات القريبة", "حجز المواعيد", "دفع رسوم الخدمات عبر بوابات دفع متكاملة"], p2: "يعمل التطبيق كمنصة حجز فقط لربط المستخدمين بالصالونات." },
    s2: { title: "2. مسؤوليات المستخدم", p1: "باستخدامك للتطبيق فإنك توافق على:", items: ["تقديم معلومات دقيقة عند الحجز", "احترام سياسات الصالون وأوقات المواعيد", "استخدام التطبيق لأغراض قانونية فقط"] },
    s3: { title: "3. الحجوزات", p1: "عند حجز خدمة:", items: ["يتم إرسال الحجز إلى الصالون المحدد", "الصالون مسؤول عن تقديم الخدمة", "قد يتغير التوافر بناءً على جداول الصالونات"] },
    s4: { title: "4. المدفوعات", p1: "تتم معالجة المدفوعات التي تتم من خلال التطبيق باستخدام مزودي دفع آمنين من جهات خارجية.", p2: "نحن لسنا مسؤولين عن أخطاء معالجة الدفع الناتجة عن مزودي خدمات من جهات خارجية.", p3: "قد تعتمد سياسات الاسترجاع على سياسة الصالون." },
    s5: { title: "5. الإلغاءات", p1: "يمكن للمستخدمين إلغاء الحجوزات وفقًا لسياسة الإلغاء التي يحددها الصالون.", p2: "قد تؤدي الإلغاءات المتأخرة أو عدم الحضور إلى فرض رسوم بناءً على قواعد الصالون." },
    s6: { title: "6. حدود المسؤولية", p1: "تُعد The Glow Hub منصة وسيطة بين المستخدمين والصالونات.", p2: "نحن لسنا مسؤولين عن:", items: ["جودة خدمات الصالون", "تأخير المواعيد", "النزاعات بين المستخدمين والصالونات"] },
    s7: { title: "7. إنهاء الحساب", p1: "نحتفظ بالحق في تعليق أو إنهاء الحسابات التي:", items: ["تنتهك هذه الشروط", "تسيء استخدام المنصة", "تشارك في أي نشاط احتيالي"] },
    s8: { title: "8. التغييرات على الشروط", p1: "قد نقوم بتحديث شروط الخدمة هذه من وقت لآخر.", p2: "استمرار استخدام التطبيق يعني قبول الشروط المحدثة." }
};

export default function TermsPage() {
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
                <div className="max-w-3xl w-full bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-8">
                    <div className="border-b border-border pb-6">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">{t.title}</h1>
                        <p className="text-sm text-muted-foreground font-medium">{t.lastUpdated}</p>
                    </div>

                    <p className="text-lg leading-relaxed text-foreground/90 font-medium">
                        {t.welcome}
                    </p>

                    <section className="space-y-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s1.title}
                        </h2>
                        <p className="text-foreground/80">{t.s1.p1}</p>
                        <ul className={`list-disc list-inside space-y-2 text-foreground/80 ${isAr ? 'mr-2' : 'ml-2'} mt-2`}>
                            {t.s1.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                        <p className="text-foreground/80 mt-3 pt-3 border-t border-border/50">
                            {t.s1.p2}
                        </p>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s2.title}
                        </h2>
                        <p className="text-foreground/80 mb-3">{t.s2.p1}</p>
                        <ul className="grid grid-cols-1 gap-3 text-foreground/80">
                            {t.s2.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-[#79A66B] mt-1">✓</span> {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s3.title}
                        </h2>
                        <p className="text-foreground/80 mb-3">{t.s3.p1}</p>
                        <ul className="list-disc list-inside space-y-2 text-foreground/80 bg-muted/20 p-4 rounded-lg">
                            {t.s3.items.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s4.title}
                        </h2>
                        <p className="text-foreground/80 leading-relaxed bg-[#79A66B]/5 p-4 rounded-lg border border-[#79A66B]/20">
                            {t.s4.p1}
                        </p>
                        <p className="text-foreground/80 mt-2">
                            {t.s4.p2}
                        </p>
                        <p className="text-foreground/80 mt-2 italic">
                            {t.s4.p3}
                        </p>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s5.title}
                        </h2>
                        <p className="text-foreground/80">{t.s5.p1}</p>
                        <p className="text-foreground/80 mt-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">{t.s5.p2}</p>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s6.title}
                        </h2>
                        <p className="text-foreground/80 mb-4">{t.s6.p1}</p>
                        <div className="bg-muted/30 rounded-lg p-5">
                            <h3 className="text-md font-semibold text-foreground mb-3">{t.s6.p2}</h3>
                            <ul className={`list-disc list-inside space-y-2 text-foreground/80 ${isAr ? 'mr-2' : 'ml-2'}`}>
                                {t.s6.items.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s7.title}
                        </h2>
                        <p className="text-foreground/80 mb-3">{t.s7.p1}</p>
                        <ul className="list-none space-y-3 text-foreground/80">
                            {t.s7.items.map((item, i) => (
                                <li key={i} className="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-destructive/60"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s8.title}
                        </h2>
                        <div className={`bg-muted/30 p-5 rounded-lg border-foreground/20 ${isAr ? 'border-r-2' : 'border-l-2'}`}>
                            <p className="text-foreground/80 mb-2">
                                {t.s8.p1}
                            </p>
                            <p className="text-foreground/80">
                                {t.s8.p2}
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
