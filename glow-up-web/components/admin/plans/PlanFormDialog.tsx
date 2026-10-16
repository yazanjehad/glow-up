"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, SaudiRiyal } from "lucide-react";
import { subscriptionsService } from "@/integration/services/subscriptions/subscriptions.service";
import {
  Plan,
  PlanType,
  CreatePlanPayload,
} from "@/integration/services/subscriptions/subscriptions.types";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSaved: () => void;
}

export default function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: PlanFormDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const isEditing = !!plan;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<PlanType>("DAYS");
  const [price, setPrice] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [commissionPercent, setCommissionPercent] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // Reset form when dialog opens/closes or plan changes
  useEffect(() => {
    if (open) {
      if (plan) {
        setName(plan.name);
        setType(plan.type);
        setPrice(plan.price);
        setDurationDays(plan.durationDays);
        setCommissionPercent(plan.commissionPercent);
        setIsActive(plan.isActive);
      } else {
        setName("");
        setType("DAYS");
        setPrice(0);
        setDurationDays(30);
        setCommissionPercent(0);
        setIsActive(true);
      }
      setError("");
    }
  }, [open, plan]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError(t("plans.form.errors.nameRequired"));
      return;
    }

    if (type === "PERCENT") {
      if (commissionPercent <= 0 || commissionPercent > 100) {
        setError(t("plans.form.errors.commissionRange"));
        return;
      }
    } else {
      if (price <= 0) {
        setError(t("plans.form.errors.priceRequired"));
        return;
      }
      if (durationDays <= 0) {
        setError(t("plans.form.errors.durationRequired"));
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      if (isEditing && plan) {
        // Update payload - exclude type as it cannot be changed
        const updatePayload = {
          name: name.trim(),
          price: type === "DAYS" ? price : 0,
          durationDays: type === "DAYS" ? durationDays : 0,
          commissionPercent: type === "PERCENT" ? commissionPercent : 0,
          isActive,
        };
        await subscriptionsService.updatePlan(plan._id, updatePayload);
      } else {
        // Create payload - includes type
        const createPayload: CreatePlanPayload = {
          name: name.trim(),
          type,
          price: type === "DAYS" ? price : 0,
          durationDays: type === "DAYS" ? durationDays : 0,
          commissionPercent: type === "PERCENT" ? commissionPercent : 0,
          isActive,
        };
        await subscriptionsService.createPlan(createPayload);
      }

      onSaved();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          t("plans.form.errors.generic")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing
              ? t("plans.form.editPlan")
              : t("plans.form.createNewPlan")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("plans.form.planName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("plans.form.enterPlanName")}
            />
          </div>

          {/* Plan Type */}
          <div className="space-y-2">
            <Label>{t("plans.form.planType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as PlanType)} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAYS">
                  {t("plans.form.durationBased")}
                </SelectItem>
                <SelectItem value="PERCENT">
                  {t("plans.form.commissionBased")}
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {type === "PERCENT"
                ? t("plans.form.commissionDescription")
                : t("plans.form.durationDescription")}
            </p>
          </div>

          {/* Conditional Fields based on Type */}
          {type === "PERCENT" ? (
            <div className="space-y-2">
              <Label htmlFor="commissionPercent">
                {t("plans.form.commissionPercent")}
              </Label>
              <Input
                id="commissionPercent"
                type="number"
                min={1}
                max={100}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Number(e.target.value))}
                placeholder="10"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="price" className="inline-flex items-center gap-2">
                  {t("plans.form.price").replace(/\s*\(.*?\)\s*$/, "")}
                  <SaudiRiyal className="h-4 w-4" />
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="99"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationDays">
                  {t("plans.form.duration")}
                </Label>
                <Input
                  id="durationDays"
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  placeholder="30"
                />
              </div>
            </>
          )}

          {/* Active Status */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="isActive" className="font-medium">
                {t("plans.form.active")}
              </Label>
              <p className="text-xs text-gray-500 mt-0.5">
                {t("plans.form.activeDescription")}
              </p>
            </div>
            <Toggle
              pressed={isActive}
              onPressedChange={setIsActive}
              variant="outline"
              aria-label="Toggle active status"
              className="data-[state=on]:bg-primary data-[state=on]:text-white"
            >
              <Check className="h-4 w-4" />
            </Toggle>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("plans.form.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? t("plans.form.saving")
              : isEditing
                ? t("plans.form.saveChanges")
                : t("plans.form.createPlan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
