"use client";

import Header from "@/components/shared/Header";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

const enContent = {
    title: "Privacy Policy",
    lastUpdated: "Last updated: March 5, 2026",
    welcome: "Welcome to The Glow Hub. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application and services.",
    s1: { title: "1. Information We Collect", p1: "We may collect the following types of information:", sub1: "Personal Information", items1: ["Name", "Phone number", "Booking details"], sub2: "Location Data", p2: "Our application may request access to your device location in order to:", items2: ["Show nearby salons", "Improve search results based on your location"], p2note: "Location access is optional and can be disabled in your device settings.", sub3: "Payment Information", p3: "Payments are processed securely through third-party payment gateways. We do not store your full credit card information on our servers.", sub4: "Usage Information", p4: "We may collect technical information such as:", items4: ["Device type", "Operating system", "App usage data", "Error logs"], p4note: "This information helps us improve the application performance." },
    s2: { title: "2. How We Use Your Information", p1: "We use the collected information to:", items: ["Provide salon booking services", "Process payments", "Display nearby salons based on location", "Improve user experience", "Send booking confirmations or service notifications", "Maintain security and prevent fraud"] },
    s3: { title: "3. Sharing of Information", p1: "We do not sell or rent your personal information.", p2: "We may share information only in the following cases:", items: ["With salons to process your booking", "With payment providers to process transactions", "When required by law", "To protect the security of our services"] },
    s4: { title: "4. Data Security", p1: "We implement reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction." },
    s5: { title: "5. Third-Party Services", p1: "Our app may use third-party services such as:", items: ["Payment gateways", "Analytics tools", "Cloud hosting services"], p2: "These services may collect information according to their own privacy policies." },
    s6: { title: "6. User Rights", p1: "You have the right to:", items: ["Access your personal information", "Request correction of your information", "Request deletion of your account and data"] },
    s7: { title: "7. Children's Privacy", p1: "Our service is not directed to individuals under the age of 13. We do not knowingly collect personal information from children." },
    s8: { title: "8. Changes to This Policy", p1: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date." },
};

const arContent = {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: 5 مارس 2026",
    welcome: "مرحبًا بك في The Glow Hub. خصوصيتك تهمنا. توضح سياسة الخصوصية هذه كيف نقوم بجمع معلوماتك واستخدامها وحمايتها عند استخدامك لتطبيقنا وخدماتنا.",
    s1: { title: "1. المعلومات التي نجمعها", p1: "قد نجمع أنواع المعلومات التالية:", sub1: "المعلومات الشخصية", items1: ["الاسم", "رقم الهاتف", "تفاصيل الحجز"], sub2: "بيانات الموقع", p2: "قد يطلب تطبيقنا الوصول إلى موقع جهازك من أجل:", items2: ["عرض الصالونات القريبة", "تحسين نتائج البحث بناءً على موقعك"], p2note: "الوصول إلى الموقع اختياري ويمكن تعطيله في إعدادات جهازك.", sub3: "معلومات الدفع", p3: "تتم معالجة المدفوعات بشكل آمن من خلال بوابات دفع تابعة لجهات خارجية. نحن لا نقوم بتخزين معلومات بطاقتك الائتمانية الكاملة على خوادمنا.", sub4: "معلومات الاستخدام", p4: "قد نجمع معلومات تقنية مثل:", items4: ["نوع الجهاز", "نظام التشغيل", "بيانات استخدام التطبيق", "سجلات الأخطاء"], p4note: "تساعدنا هذه المعلومات في تحسين أداء التطبيق." },
    s2: { title: "2. كيف نستخدم معلوماتك", p1: "نستخدم المعلومات التي تم جمعها في:", items: ["تقديم خدمات حجز الصالونات", "معالجة المدفوعات", "عرض الصالونات القريبة بناءً على الموقع", "تحسين تجربة المستخدم", "إرسال تأكيدات الحجز أو إشعارات الخدمة", "الحفاظ على الأمان ومنع الاحتيال"] },
    s3: { title: "3. مشاركة المعلومات", p1: "نحن لا نبيع أو نؤجر معلوماتك الشخصية.", p2: "قد نشارك المعلومات فقط في الحالات التالية:", items: ["مع الصالونات لمعالجة حجزك", "مع مزودي الدفع لمعالجة المعاملات", "عندما يقتضي القانون ذلك", "لحماية أمان خدماتنا"] },
    s4: { title: "4. أمن البيانات", p1: "نحن ننفذ إجراءات فنية وتنظيمية معقولة لحماية معلوماتك ضد الوصول أو التغيير أو الكشف أو التدمير غير المصرح به." },
    s5: { title: "5. خدمات الطرف الثالث", p1: "قد يستخدم تطبيقنا خدمات طرف ثالث مثل:", items: ["بوابات الدفع", "أدوات التحليل", "خدمات الاستضافة السحابية"], p2: "قد تقوم هذه الخدمات بجمع المعلومات وفقًا لسياسات الخصوصية الخاصة بها." },
    s6: { title: "6. حقوق المستخدم", p1: "لك الحق في:", items: ["الوصول إلى معلوماتك الشخصية", "طلب تصحيح معلوماتك", "طلب حذف حسابك وبياناتك"] },
    s7: { title: "7. خصوصية الأطفال", p1: "خدمتنا ليست موجهة للأفراد دون سن 13 عامًا. نحن لا نجمع معلومات شخصية متعمدة من الأطفال." },
    s8: { title: "8. التغييرات على هذه السياسة", p1: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تاريخ النشر المحدث." },
};

export default function PrivacyPage() {
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
                className={`flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 text-foreground ${isAr ? 'text-right' : 'text-left'}`}
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

                        <div className="bg-muted/30 rounded-lg p-5 mt-4">
                            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#79A66B]"></span>
                                {t.s1.sub1}
                            </h3>
                            <ul className={`list-disc list-inside space-y-2 text-foreground/80 ${isAr ? 'mr-2' : 'ml-2'}`}>
                                {t.s1.items1.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-5 mt-4">
                            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#79A66B]"></span>
                                {t.s1.sub2}
                            </h3>
                            <p className="text-foreground/80 mb-2">{t.s1.p2}</p>
                            <ul className={`list-disc list-inside space-y-2 text-foreground/80 ${isAr ? 'mr-2' : 'ml-2'}`}>
                                {t.s1.items2.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            <p className="text-sm text-muted-foreground mt-3 bg-background/50 inline-block px-3 py-1 rounded-full border border-border/50">
                                {t.s1.p2note}
                            </p>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-5 mt-4">
                            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#79A66B]"></span>
                                {t.s1.sub3}
                            </h3>
                            <p className="text-foreground/80 leading-relaxed">
                                {t.s1.p3}
                            </p>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-5 mt-4">
                            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#79A66B]"></span>
                                {t.s1.sub4}
                            </h3>
                            <p className="text-foreground/80 mb-2">{t.s1.p4}</p>
                            <ul className={`list-disc list-inside space-y-2 text-foreground/80 ${isAr ? 'mr-2' : 'ml-2'}`}>
                                {t.s1.items4.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            <p className="text-foreground/80 mt-3 pt-3 border-t border-border/50">{t.s1.p4note}</p>
                        </div>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s2.title}
                        </h2>
                        <p className="text-foreground/80 mb-3">{t.s2.p1}</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-foreground/80">
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
                        <p className="text-foreground/90 font-medium">{t.s3.p1}</p>
                        <p className="text-foreground/80">{t.s3.p2}</p>
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
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s5.title}
                        </h2>
                        <p className="text-foreground/80">{t.s5.p1}</p>
                        <div className="flex flex-wrap gap-2 my-3">
                            {t.s5.items.map((item, i) => (
                                <span key={i} className="bg-muted px-4 py-2 rounded-full text-sm font-medium">{item}</span>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{t.s5.p2}</p>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s6.title}
                        </h2>
                        <p className="text-foreground/80">{t.s6.p1}</p>
                        <ul className="list-none space-y-3 text-foreground/80">
                            <li className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-foreground/50"></div> {t.s6.items[0]}</li>
                            <li className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-foreground/50"></div> {t.s6.items[1]}</li>
                            <li className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-destructive/50"></div> {t.s6.items[2]}</li>
                        </ul>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s7.title}
                        </h2>
                        <div className={`bg-muted/30 p-5 rounded-lg border-foreground/20 ${isAr ? 'border-r-2' : 'border-l-2'}`}>
                            <p className="text-foreground/80">
                                {t.s7.p1}
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4 pt-4">
                        <h2 className={`text-2xl font-semibold text-foreground border-[#79A66B] ${isAr ? 'border-r-4 pr-4' : 'border-l-4 pl-4'}`}>
                            {t.s8.title}
                        </h2>
                        <p className="text-foreground/80">
                            {t.s8.p1}
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
