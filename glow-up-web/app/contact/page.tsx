"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Mail, Phone, Clock, LifeBuoy, CheckCircle2 } from "lucide-react";

const EMAIL = "tech@theglowhub.com.sa";
const PHONE = "+966 50 806 9614";
const PHONE_HREF = "+966508069614";

const enContent = {
    title: "Contact Us",
    intro: "At Glow Hub, we care about hearing from you, and we are always happy to receive your inquiries, feedback, suggestions, or support requests related to using the platform.",
    intro2:
        "Whether you are a client looking for help with a booking or managing your account, or a service salon wishing to join Glow Hub or needing support managing your services, our team is ready to help you.",
    topicsTitle: "You can contact us regarding:",
    topics: [
        "Inquiries about how to use the platform.",
        "Help with creating or managing your account.",
        "Inquiries about bookings or services.",
        "Salon and beauty center requests to join Glow Hub.",
        "Technical support or reporting an issue.",
        "Sending suggestions and feedback to improve your experience.",
        "Following up on salon and service provider requests.",
    ],
    channelsTitle: "Contact Channels",
    emailLabel: "Email",
    phoneLabel: "Phone",
    supportNote:
        "You can also reach us through the support page inside your account for registered users, where you can create a support ticket and follow the request status and replies from the Glow Hub team directly from the dashboard.",
    hoursTitle: "Working Hours",
    hours: "Sunday to Thursday, from 9:00 AM to 6:00 PM",
    hoursNote:
        "At Glow Hub, we are keen to provide fast and effective support to all clients and service providers. Requests and technical issues are handled within 24 to 72 hours depending on the type of request and the size of the issue.",
    closing: "Glow Hub — your beauty starts here.",
};

const arContent = {
    title: "تواصل معنا",
    intro: "نحن في ذا قلو هب نهتم بتواصلكم معنا، ونسعد دائمًا باستقبال استفساراتكم، ملاحظاتكم، اقتراحاتكم، أو طلبات الدعم المتعلقة باستخدام المنصة.",
    intro2:
        "سواء كنت عميلًا تبحث عن مساعدة في الحجز أو إدارة حسابك، أو كنت مزود خدمة/صالون ترغب في الانضمام إلى ذا قلو هب أو تحتاج إلى دعم في إدارة خدماتك، فإن فريقنا جاهز لمساعدتك.",
    topicsTitle: "يمكنك التواصل معنا بخصوص:",
    topics: [
        "الاستفسار عن طريقة استخدام المنصة.",
        "المساعدة في إنشاء أو إدارة الحساب.",
        "الاستفسار عن الحجوزات أو الخدمات.",
        "طلبات انضمام الصالونات ومراكز التجميل إلى ذا قلو هب.",
        "الدعم الفني أو الإبلاغ عن مشكلة.",
        "إرسال الاقتراحات والملاحظات لتحسين تجربتك.",
        "متابعة طلبات الصالونات ومزودي الخدمات.",
    ],
    channelsTitle: "طرق التواصل",
    emailLabel: "البريد الإلكتروني",
    phoneLabel: "رقم التواصل",
    supportNote:
        "ويمكنك أيضًا التواصل معنا من خلال صفحة الدعم داخل الحساب للمسجلين في المنصة، حيث يمكن للمستخدم إنشاء تذكرة دعم ومتابعة حالة الطلب والردود من فريق ذا قلو هب مباشرة من لوحة التحكم.",
    hoursTitle: "ساعات العمل",
    hours: "من الأحد إلى الخميس من الساعة 9:00 صباحًا حتى 6:00 مساءً",
    hoursNote:
        "نحرص في ذا قلو هب على تقديم دعم سريع وفعّال لجميع العملاء ومزودي الخدمات، ويتم العمل على معالجة الطلبات والمشكلات الفنية خلال مدة تتراوح من 24 إلى 72 ساعة بحسب نوع الطلب وحجم المشكلة.",
    closing: "ذا قلو هب — جمالك يبدأ من هنا.",
};

export default function ContactPage() {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="min-h-screen bg-background" />;

    const isAr = i18n.language?.startsWith("ar");
    const t = isAr ? arContent : enContent;
    const dir = isAr ? "rtl" : "ltr";

    const channels = [
        { icon: Mail, label: t.emailLabel, value: EMAIL, href: `mailto:${EMAIL}` },
        { icon: Phone, label: t.phoneLabel, value: PHONE, href: `tel:${PHONE_HREF}` },
    ];

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

                    {/* Intro */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-4">
                        <p className="text-lg leading-relaxed text-foreground/90 font-medium">{t.intro}</p>
                        <p className="text-foreground/80 leading-relaxed">{t.intro2}</p>
                    </div>

                    {/* Topics */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-5">
                        <h2 className="text-2xl font-semibold text-foreground">{t.topicsTitle}</h2>
                        <ul className="space-y-3">
                            {t.topics.map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-3 text-foreground/80"
                                >
                                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#79A66B] mt-0.5" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Channels */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-5">
                        <h2 className="text-2xl font-semibold text-foreground">{t.channelsTitle}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {channels.map(({ icon: Icon, label, value, href }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target={href.startsWith("http") ? "_blank" : undefined}
                                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    className="flex flex-col items-center gap-3 text-center bg-muted/30 hover:bg-[#79A66B]/10 transition-colors rounded-xl p-5 border border-border"
                                >
                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#79A66B]/10">
                                        <Icon className="h-5 w-5 text-[#79A66B]" />
                                    </span>
                                    <span className="text-sm text-muted-foreground font-medium">{label}</span>
                                    <span className="text-sm font-semibold text-foreground break-all" dir="ltr">
                                        {value}
                                    </span>
                                </a>
                            ))}
                        </div>
                        <div className="flex items-start gap-3 bg-[#79A66B]/5 border border-[#79A66B]/20 rounded-lg p-4">
                            <LifeBuoy className="h-5 w-5 shrink-0 text-[#79A66B] mt-0.5" />
                            <p className="text-foreground/80 leading-relaxed text-sm">{t.supportNote}</p>
                        </div>
                    </div>

                    {/* Working hours */}
                    <div className="bg-card shadow-sm border border-border rounded-[16px] p-8 space-y-4">
                        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                            <Clock className="h-6 w-6 text-[#79A66B]" />
                            {t.hoursTitle}
                        </h2>
                        <p className="text-lg font-semibold text-foreground bg-[#79A66B]/5 border border-[#79A66B]/20 rounded-lg p-4">
                            {t.hours}
                        </p>
                        <p className="text-foreground/80 leading-relaxed">{t.hoursNote}</p>
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
