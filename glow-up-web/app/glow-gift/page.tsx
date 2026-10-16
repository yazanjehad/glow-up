"use client";
import React, { useState } from "react";
import { User } from "lucide-react";
import Layout from "@/components/Layout";
import { TopBar } from "@/components/shared/TopBar";
import { ChevronArrow } from "@/components/ui/chevron-arrow";
import { HiMiniArrowLeftCircle } from "react-icons/hi2";
import { useTranslation } from "react-i18next";

const ArrowCircle = ({ isRTL }: { isRTL: boolean }) => (
  <div className="flex items-center justify-center w-9 h-9 bg-green-600 rounded-full">
    <HiMiniArrowLeftCircle
      className="text-white"
      size={22}
      style={{ transform: isRTL ? "none" : "rotate(180deg)" }}
    />
  </div>
);
const UserSearch = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");

  const results = [
    { id: "GL1009", name: "محمد أحمد", date: "13 سبتمبر، 2022" },
    { id: "GL1010", name: "أحمد علي", date: "5 يناير، 2023" },
  ];

  const filteredResults = results.filter((user) =>
    user.name.includes(searchTerm)
  );

  return (
    <Layout>
      <main className="min-h-screen flex flex-col items-center p-4 gap-6 bg-gray-50">
        <div className="w-full max-w-[46rem]">
          <TopBar
            titleKey="userSearch.title"
            iconAriaLabelKey="teamPage.icon"
            icon={<ChevronArrow />}
            iconHref="/home"
          />

          <div
            className="min-h-screen py-8 flex flex-col items-center"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="w-[44rem] bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2
                className={`text-gray-800 font-bold mb-4 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {t("userSearch.searchUser")}
              </h2>

              <div className="relative w-3/4">
                <div className="flex items-center rounded-full px-3 py-2 w-full bg-gray-200">
                  <div className="flex items-center gap-2 flex-1">
                    <User className="text-gray-500" size={20} />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t("userSearch.username")}
                      className={`bg-transparent outline-none w-full ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    />
                  </div>

                  <ArrowCircle isRTL={isRTL} />
                </div>
              </div>
            </div>

            {searchTerm.trim() !== "" && (
              <div className="w-[44rem] bg-white rounded-2xl shadow-lg p-6">
                <h2
                  className={`text-gray-800 font-bold mb-4 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  {t("userSearch.searchResults")}
                </h2>

                <div className="space-y-4">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((user, index) => (
                      <div
                        key={index}
                        className="border border-gray-100 rounded-xl p-4 flex justify-between items-center"
                      >
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <h3 className="font-bold text-gray-900 text-lg">
                            {user.name}
                          </h3>
                          <span
                            className="text-green-700 text-xs px-3 py-1 rounded-full mt-2 inline-block"
                            style={{ backgroundColor: "#E6F4EA" }}
                          >
                            {t("userSearch.memberSince")} {user.date}
                          </span>
                        </div>

                        <span
                          className={`font-medium text-[22px] leading-[100%] text-green-600 ${
                            isRTL ? "text-left" : "text-right"
                          }`}
                        >
                          {user.id}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400">
                      {t("userSearch.noResults")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default UserSearch;
