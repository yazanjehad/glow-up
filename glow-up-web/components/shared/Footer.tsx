import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Download } from 'lucide-react';
import Image from 'next/image';

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z" />
  </svg>
);

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const footerLinks = {
    about: [
      { name: t('footer.about_us'), href: '/about' },
      { name: t('footer.join_us'), href: '/home' },
      { name: t('footer.contact_us'), href: '/contact' },
    ],
    legal: [
      { name: t('footer.privacy_policy'), href: '/privacy' },
      { name: t('footer.terms_of_service'), href: '/terms' },
    ],
  };

  const socials = [
    { icon: <Instagram size={18} />, href: "https://instagram.com", label: "Instagram" },
    { icon: <Facebook size={18} />, href: "https://facebook.com", label: "Facebook" },
    { icon: <XIcon className="w-4 h-4" />, href: "https://x.com", label: "X" },
  ];

  return (
    <footer
      className="bg-white border-t border-gray-100 pt-16 pb-8 px-6 font-sans selection:bg-[#7BA66E]/20"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          <div className="flex flex-col items-center md:items-start space-y-6">
            <Link href="/" className="relative group">
              <Image
                src="/logo.png"
                alt="The Glow Hub Logo"
                width={120}
                height={48}
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed text-center md:text-start max-w-[260px]">
              {t('footer.description')}
            </p>
            <div className="flex gap-3">
              {socials.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:bg-[#7BA66E] hover:text-white hover:shadow-lg hover:shadow-[#7BA66E]/20 transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="text-center md:text-start">
            <h4 className="font-bold text-gray-900 mb-6 text-lg relative inline-block">
              {t('footer.about_title')}
              <span className={`absolute bottom-[-8px] w-full h-1 bg-[#7BA66E]/30 rounded-full ${isRtl ? 'right-0' : 'left-0'}`}></span>
            </h4>
            <ul className="space-y-4">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-gray-500 hover:text-[#7BA66E] transition-all duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-start">
            <h4 className="font-bold text-gray-900 mb-6 text-lg relative inline-block">
              {t('footer.legal_title')}
              <span className={`absolute bottom-[-8px] w-full h-1 bg-[#7BA66E]/30 rounded-full ${isRtl ? 'right-0' : 'left-0'}`}></span>
            </h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-gray-500 hover:text-[#7BA66E] transition-all duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center md:items-start space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="space-y-2 text-center md:text-start">
              <h4 className="font-bold text-gray-900 text-lg">
                {t('footer.download_title')}
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t('footer.download_desc')}
              </p>
            </div>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://play.google.com/store/apps/details?id=com.glowup.user"
              className="flex items-center gap-3 bg-[#7BA66E] text-white px-7 py-3 rounded-xl w-full justify-center shadow-lg shadow-[#7BA66E]/20 hover:bg-[#6a915d] hover:-translate-y-1 transition-all active:scale-95"
            >
              <Download size={18} />
              <span className="font-semibold text-sm">{t('footer.download_btn')}</span>
            </Link>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-100 flex flex-col items-center">
          {isRtl ? (
            <p className="text-sm text-gray-500 font-medium text-center" dir="rtl">
              <span>. جميع الحقوق محفوظة </span>
              <span >©</span>
              <span className="text-[#7BA66E] font-bold">The Glow Hub <span>{new Date().getFullYear()}</span></span>
            </p>
          ) : (
            <p
              className="text-sm text-gray-500 font-medium text-center"
              style={{ direction: 'ltr' }}
            >
              {t('footer.rights').split('The Glow Hub').map((part, index, array) => (
                <React.Fragment key={index}>
                  {part}
                  {index < array.length - 1 && (
                    <span className="text-[#7BA66E] font-bold">The Glow Hub</span>
                  )}
                </React.Fragment>
              ))}
            </p>
          )}
        </div>
      </div>
    </footer >
  );
};

export default Footer;