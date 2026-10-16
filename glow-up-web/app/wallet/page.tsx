"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, X } from "lucide-react";
import Layout from "@/components/Layout";
import {
  WalletService,
  WalletResponse,
  WalletTransaction,
} from "@/integration/services/wallet/wallet.service";

export default function WalletPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("ar");

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await WalletService.getWallet();
      setWallet(data);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
      setError(t("walletPage.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      setAddError(t("walletPage.invalidAmount"));
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      await WalletService.addMoney({
        amount,
        description: addDescription || t("walletPage.defaultDescription"),
      });
      setShowAddModal(false);
      setAddAmount("");
      setAddDescription("");
      fetchWallet();
    } catch (err) {
      console.error("Failed to add money:", err);
      setAddError(t("walletPage.addError"));
    } finally {
      setAddLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Layout>
      <div
        className="min-h-screen bg-gray-50 py-8 px-4"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 font-din-next">
            {t("walletPage.title")}
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#79A66B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchWallet}
                className="text-[#79A66B] hover:underline"
              >
                {t("walletPage.retry")}
              </button>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <div className="rounded-2xl bg-gradient-to-br from-[#79A66B] to-[#5a8a4d] p-6 text-white shadow-lg mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-full">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <span className="text-lg font-medium opacity-90">
                      {t("walletPage.balance")}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex shrink-0 items-center justify-center gap-2 bg-white text-[#79A66B] px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t("walletPage.addMoney")}
                  </button>
                </div>
                <div className="text-3xl sm:text-4xl font-bold">
                  {formatAmount(wallet?.balance ?? 0)}{" "}
                  <span className="text-lg sm:text-xl opacity-80">SAR</span>
                </div>
              </div>

              {/* Transactions */}
              <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("walletPage.transactions")}
                </h2>

                {wallet?.transactions && wallet.transactions.length > 0 ? (
                  <div className="space-y-3">
                    {wallet.transactions.map((tx, index) => (
                      <TransactionItem
                        key={index}
                        transaction={tx}
                        formatDate={formatDate}
                        formatAmount={formatAmount}
                        t={t}
                        isRTL={isRTL ?? false}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t("walletPage.noTransactions")}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Add Money Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
              <div
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("walletPage.addMoney")}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setAddError(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleAddMoney}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("walletPage.amount")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={addAmount}
                        onChange={(e) => {
                          setAddAmount(e.target.value);
                          setAddError(null);
                        }}
                        placeholder="0.00"
                        min="1"
                        step="0.01"
                        className="w-full h-12 rounded-xl border border-gray-200 px-4 text-lg outline-none focus:border-[#79A66B] focus:ring-2 focus:ring-[#79A66B]/20"
                        required
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm px-3 end-0">
                        SAR
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("walletPage.description")}
                    </label>
                    <input
                      type="text"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                      placeholder={t("walletPage.descriptionPlaceholder")}
                      className="w-full h-12 rounded-xl border border-gray-200 px-4 outline-none focus:border-[#79A66B] focus:ring-2 focus:ring-[#79A66B]/20"
                    />
                  </div>

                  {addError && (
                    <p className="text-red-500 text-sm mb-4">{addError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setAddError(null);
                      }}
                      className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={addLoading}
                      className="flex-1 h-12 rounded-xl bg-[#79A66B] text-white font-semibold hover:bg-[#6B975D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? t("loading") : t("walletPage.addMoney")}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

interface TransactionItemProps {
  transaction: WalletTransaction;
  formatDate: (date: string) => string;
  formatAmount: (amount: number) => string;
  t: (key: string) => string;
  isRTL: boolean;
}

function TransactionItem({
  transaction,
  formatDate,
  formatAmount,
  t,
  isRTL,
}: TransactionItemProps) {
  const isCredit = transaction.type === "CREDIT";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`p-2 rounded-full shrink-0 ${
            isCredit ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isCredit ? (
            <ArrowDownCircle className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowUpCircle className="h-5 w-5 text-red-600" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-right rtl:text-right ltr:text-left">
          <p className="font-semibold text-gray-900 truncate text-sm md:text-base">
            {transaction.description}
          </p>
          <p className="text-[10px] md:text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
        </div>
      </div>

      <div
        className={`text-sm md:text-base font-bold shrink-0 ${isRTL ? "text-right mr-12 sm:mr-0" : "text-left ml-12 sm:ml-0"} ${
          isCredit ? "text-green-600" : "text-red-600"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatAmount(transaction.amount)} SAR
      </div>
    </div>
  );
}
