"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, Save } from "lucide-react";

import ProfileFields from "../../../components/provider/salon-profile";
import { useProviderStore } from "@/store/providerStore";
import { patch } from "@/integration/http/http.client";
import { TOKEN_KEY } from "@/app/models/constants";

export default function UpdateProfilePage() {
  const { t } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const salonName = useProviderStore((state) => state.salonName);
  const setSalonName = useProviderStore((state) => state.setSalonName);

  const [tempName, setTempName] = useState("");
  const [tempNameEn, setTempNameEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [policy, setPolicy] = useState("");
  const [policyEn, setPolicyEn] = useState("");

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem(TOKEN_KEY);

        const res = await fetch(
          `https://api-staging.theglowhub.com.sa/providers/me`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        const data = await res.json();

        const apiNameAr = typeof data.name === 'string' ? data.name : (data.name?.ar || "");
        const apiNameEn = typeof data.name === 'string' ? data.name : (data.name?.en || "");
        const apiDescAr = typeof data.description === 'string' ? data.description : (data.description?.ar || "");
        const apiDescEn = typeof data.description === 'string' ? data.description : (data.description?.en || "");
        const apiPolicyAr = typeof data.policy === 'string' ? data.policy : (data.policy?.ar || "");
        const apiPolicyEn = typeof data.policy === 'string' ? data.policy : (data.policy?.en || "");

        setSalonName(apiNameAr);
        setTempName(apiNameAr);
        setTempNameEn(apiNameEn);
        setDescription(apiDescAr);
        setDescriptionEn(apiDescEn);
        setPolicy(apiPolicyAr);
        setPolicyEn(apiPolicyEn);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [setSalonName]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const providerId = localStorage.getItem("providerId");
      const token = localStorage.getItem(TOKEN_KEY);

      if (!providerId) throw new Error("Missing providerId");

      const payload = {
        name: {
          ar: tempName.trim(),
          en: tempNameEn.trim(),
        },
        description: {
          ar: description.trim(),
          en: descriptionEn.trim(),
        },
        policy: {
          ar: policy.trim(),
          en: policyEn.trim(),
        },
      };

      const res = await patch(`/providers/${providerId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const updated = res.data as any;

      const updatedNameAr = updated?.name?.ar || tempName;
      const updatedNameEn = updated?.name?.en || tempNameEn;
      const updatedDescAr = updated?.description?.ar || description;
      const updatedDescEn = updated?.description?.en || descriptionEn;
      const updatedPolicyAr = updated?.policy?.ar || policy;
      const updatedPolicyEn = updated?.policy?.en || policyEn;

      setSalonName(updatedNameAr);
      setTempName(updatedNameAr);
      setTempNameEn(updatedNameEn);
      setDescription(updatedDescAr);
      setDescriptionEn(updatedDescEn);
      setPolicy(updatedPolicyAr);
      setPolicyEn(updatedPolicyEn);
      setIsEditing(false);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      const message = err?.response?.data?.message || err?.message || t("admin-dashboard.saveFailed");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">{t("loading")}</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {t("admin-dashboard.salonProfileManagement")}
        </h2>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={[
            "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition",
            isEditing
              ? "bg-button-green text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          ].join(" ")}
          disabled={saving}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              {t("admin-dashboard.finishEditing")}
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4" />
              {t("admin-dashboard.updateProfile")}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      <div className="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <ProfileFields
          fullName={tempName}
          setFullName={setTempName}
          fullNameEn={tempNameEn}
          setFullNameEn={setTempNameEn}
          description={description}
          setDescription={setDescription}
          descriptionEn={descriptionEn}
          setDescriptionEn={setDescriptionEn}
          policy={policy}
          setPolicy={setPolicy}
          policyEn={policyEn}
          setPolicyEn={setPolicyEn}
          showDescription={true}
          isReadOnly={!isEditing}
        />
        {isEditing && (
          <button
            onClick={handleSave}
            className="mt-8 h-12 w-full rounded-xl bg-button-green font-semibold text-white shadow-sm transition hover:bg-opacity-90"
            disabled={saving}
          >
            {saving
              ? t("admin-dashboard.saving")
              : t("admin-dashboard.saveChanges")}
          </button>
        )}
      </div>
    </div>
  );
}
