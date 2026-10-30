import { Button as HuntrButton } from "~/shared/ui/Button";
import { Input as HuntrInput, Select as HuntrSelect, Textarea as HuntrTextarea } from "~/shared/ui/Fields";
import React from "react";
import {
  ClipboardList,
  Building,
  MapPin,
  Calendar,
  Paperclip,
  FileText,
} from "lucide-react";
import { CheckoutServiceDetails } from "./CheckoutServiceDetails";
import { DEPARTMENT_OPTIONS, TENDER_DURATION_OPTIONS } from "../constants";
import type {
  CartItem,
  CompanyAddress,
  DurationCalculation,
  ProcurementMode,
  ProcurementType,
} from "../types";

interface CheckoutFormProps {
  procurementType: ProcurementType;
  setProcurementType: (type: ProcurementType) => void;
  procurementMode: ProcurementMode;
  setProcurementMode: (mode: ProcurementMode) => void;
  cart: CartItem[];
  prTitle: string;
  setPrTitle: (val: string) => void;
  prDepartment: string;
  setPrDepartment: (val: string) => void;
  prDesc: string;
  setPrDesc: (val: string) => void;
  prDuration: number;
  setPrDuration: (val: number) => void;
  prDocument: File | null;
  setPrDocument: (file: File | null) => void;
  deliveryPoint: string;
  setDeliveryPoint: (val: string) => void;
  companyAddresses: CompanyAddress[];
  wmsInstalled: boolean;
  warehouses: any[];
  warehouseId: string;
  warehouseDeliveryPoint: string;
  onWarehouseChange: (warehouseId: string) => void;
  // Service props
  projectType: string;
  setProjectType: (val: string) => void;
  customProjectType: string;
  setCustomProjectType: (val: string) => void;
  serviceStartDate: string;
  setServiceStartDate: (val: string) => void;
  serviceEndDate: string;
  setServiceEndDate: (val: string) => void;
  serviceWorkingSchedule: string;
  setServiceWorkingSchedule: (val: string) => void;
  serviceLocation: string;
  setServiceLocation: (val: string) => void;
  acceptanceCriteria: string;
  setAcceptanceCriteria: (val: string) => void;
  durationCalculation: DurationCalculation | null;
}

export function CheckoutForm({
  procurementType,
  setProcurementType,
  procurementMode,
  setProcurementMode,
  cart,
  prTitle,
  setPrTitle,
  prDepartment,
  setPrDepartment,
  prDesc,
  setPrDesc,
  prDuration,
  setPrDuration,
  prDocument,
  setPrDocument,
  deliveryPoint,
  setDeliveryPoint,
  companyAddresses,
  wmsInstalled,
  warehouses,
  warehouseId,
  warehouseDeliveryPoint,
  onWarehouseChange,
  projectType,
  setProjectType,
  customProjectType,
  setCustomProjectType,
  serviceStartDate,
  setServiceStartDate,
  serviceEndDate,
  setServiceEndDate,
  serviceWorkingSchedule,
  setServiceWorkingSchedule,
  serviceLocation,
  setServiceLocation,
  acceptanceCriteria,
  setAcceptanceCriteria,
  durationCalculation,
}: CheckoutFormProps) {
  return (
    <div className="border border-[var(--ui-border)] rounded-xl bg-[var(--ui-bg-card)] p-4 space-y-3">
      <h3 className="text-xs sm:text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--ui-border)]">
        <ClipboardList size={16} className="text-orange-500" /> Request Details
      </h3>

      <div className="space-y-3 text-xs">
        {/* Procurement Object */}
        <fieldset className="space-y-2">
          <legend className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)]">
            Procurement object
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              [
                "goods",
                "Goods",
                "Physical items that can be received into warehouse.",
              ],
              [
                "services",
                "Services",
                "Professional work, subscription, consulting, or maintenance.",
              ],
              ["mixed", "Mixed", "A single PR contains goods and services."],
            ].map(([value, label, help]) => (
              <HuntrButton
                key={value}
                type="button"
                onClick={() => {
                  const next =
                    value === "services" &&
                    cart.some((item) => item.line_type !== "service")
                      ? "mixed"
                      : value;
                  setProcurementType(next as any);
                  if (next === "services") onWarehouseChange("");
                }}
                className={`border p-3 text-left transition-colors cursor-pointer ${
                  procurementType === value
                    ? "border-orange-500 bg-orange-500/5"
                    : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"
                }`}
              >
                <span className="block font-semibold text-[var(--ui-text-primary)]">
                  {label}
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">
                  {help}
                </span>
              </HuntrButton>
            ))}
          </div>
        </fieldset>

        {/* Procurement Route */}
        <fieldset className="space-y-2">
          <legend className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)]">
            Procurement route
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <HuntrButton
              type="button"
              onClick={() => setProcurementMode("tender")}
              className={`border p-3 text-left transition-colors cursor-pointer ${
                procurementMode === "tender"
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"
              }`}
            >
              <span className="block font-semibold text-[var(--ui-text-primary)]">
                Tender
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">
                Invite vendors after approval.
              </span>
            </HuntrButton>
            <HuntrButton
              type="button"
              onClick={() => {
                setProcurementMode("direct");
                setPrDocument(null);
              }}
              className={`border p-3 text-left transition-colors cursor-pointer ${
                procurementMode === "direct"
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-[var(--ui-border)] bg-[var(--ui-bg-input)]"
              }`}
            >
              <span className="block font-semibold text-[var(--ui-text-primary)]">
                Direct purchase
              </span>
              <span className="mt-0.5 block text-[10px] text-[var(--ui-text-muted)]">
                For urgent buying. No tender is published.
              </span>
            </HuntrButton>
          </div>
        </fieldset>

        {/* PR Title & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">
              PR Title *
            </label>
            <HuntrInput
              type="text"
              placeholder="e.g. Office Supplies for Q3 2026"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
              <Building size={12} /> Department *
            </label>
            <HuntrSelect
              value={prDepartment}
              onChange={(e) => setPrDepartment(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
            >
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </HuntrSelect>
          </div>
        </div>

        {/* Purpose / Description */}
        <div className="space-y-1">
          <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] block">
            Purpose / Description
          </label>
          <HuntrTextarea
            placeholder="Explain why these items are needed..."
            value={prDesc}
            onChange={(e) => setPrDesc(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none"
          />
        </div>

        {/* Services Detail Card */}
        {procurementType !== "goods" && (
          <CheckoutServiceDetails
            projectType={projectType}
            setProjectType={setProjectType}
            customProjectType={customProjectType}
            setCustomProjectType={setCustomProjectType}
            serviceStartDate={serviceStartDate}
            setServiceStartDate={setServiceStartDate}
            serviceEndDate={serviceEndDate}
            setServiceEndDate={setServiceEndDate}
            serviceWorkingSchedule={serviceWorkingSchedule}
            setServiceWorkingSchedule={setServiceWorkingSchedule}
            acceptanceCriteria={acceptanceCriteria}
            setAcceptanceCriteria={setAcceptanceCriteria}
            durationCalculation={durationCalculation}
          />
        )}

        {/* Receiving Warehouse (WMS) */}
        {wmsInstalled && procurementType !== "services" && (
          <div className="space-y-1">
            <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
              <Building size={12} /> Receiving Warehouse
            </label>
            <HuntrSelect
              value={warehouseId}
              onChange={(e) => onWarehouseChange(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
            >
              <option value="">No WMS warehouse selected</option>
              {warehouses
                .filter((warehouse: any) => warehouse.status === "active")
                .map((warehouse: any) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} · {warehouse.code}
                    {warehouse.address ? ` · ${warehouse.address}` : ""}
                  </option>
                ))}
            </HuntrSelect>
            <p className="text-[11px] text-[var(--ui-text-muted)]">
              Goods Receipt for this PR will automatically enter the selected WMS
              warehouse. Its address becomes the delivery point.
            </p>
          </div>
        )}

        {/* Delivery Point / Service Location */}
        <div className="space-y-1">
          <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
            <MapPin size={12} />{" "}
            {procurementType === "services"
              ? "Service Location *"
              : "Delivery Point *"}
          </label>
          {companyAddresses.length > 0 ? (
            <HuntrSelect
              value={deliveryPoint}
              onChange={(e) => {
                setDeliveryPoint(e.target.value);
                if (procurementType === "services") {
                  setServiceLocation(e.target.value);
                }
              }}
              disabled={Boolean(warehouseId)}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all disabled:cursor-not-allowed disabled:opacity-60"
            >
              {warehouseId && (
                <option value={warehouseDeliveryPoint}>
                  Warehouse: {warehouseDeliveryPoint || "Address not recorded"}
                </option>
              )}
              {companyAddresses.map((address) => (
                <option key={address.id} value={address.value}>
                  {address.label}: {address.value}
                </option>
              ))}
            </HuntrSelect>
          ) : (
            <HuntrTextarea
              placeholder="e.g. Jl. Sudirman No. 123, Jakarta"
              value={deliveryPoint}
              onChange={(e) => {
                setDeliveryPoint(e.target.value);
                if (procurementType === "services") {
                  setServiceLocation(e.target.value);
                }
              }}
              disabled={Boolean(warehouseId)}
              rows={2}
              className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all resize-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          )}
        </div>

        {/* Tender Duration & Supporting Document */}
        {procurementMode === "tender" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                <Calendar size={12} /> Tender Duration (Days)
              </label>
              <HuntrSelect
                value={prDuration}
                onChange={(e) => setPrDuration(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-[var(--ui-text-primary)] outline-none focus:border-orange-400/60 transition-all"
              >
                {TENDER_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </HuntrSelect>
            </div>

            <div className="space-y-1">
              <label className="font-bold uppercase tracking-wider text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1">
                <Paperclip size={12} /> Supporting Doc (Optional)
              </label>
              <div>
                <HuntrInput
                  type="file"
                  id="pr-document"
                  onChange={(e) => setPrDocument(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <HuntrButton
                  type="button"
                  onClick={() =>
                    document.getElementById("pr-document")?.click()
                  }
                  className="w-full p-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border)] text-left text-xs text-[var(--ui-text-muted)] flex items-center gap-2 hover:border-orange-400/50 transition-all truncate cursor-pointer"
                >
                  {prDocument ? (
                    <>
                      <FileText
                        size={14}
                        className="text-orange-500 shrink-0"
                      />{" "}
                      <span className="truncate text-orange-500 font-semibold">
                        {prDocument.name}
                      </span>
                    </>
                  ) : (
                    "Choose file..."
                  )}
                </HuntrButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


