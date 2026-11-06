import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import Layout from "~/components/Layout";
import { ArrowLeft, Loader2, AlertTriangle, ShieldCheck, ShoppingCart } from "lucide-react";
import {
  useCheckout,
  CheckoutSuccess,
  CheckoutItemsTable,
  CheckoutForm,
  CheckoutSummarySidebar,
  SERVICE_PROJECT_TYPES,
} from "~/features/checkout";

export { SERVICE_PROJECT_TYPES };

export default function Checkout() {
  const {
    navigate,
    getCompanyPrefix,
    cart,
    cartTotal,
    loading,
    success,
    error,
    prTitle,
    setPrTitle,
    prDesc,
    setPrDesc,
    prDuration,
    setPrDuration,
    prDepartment,
    setPrDepartment,
    prDocument,
    setPrDocument,
    deliveryPoint,
    setDeliveryPoint,
    companyAddresses,
    wmsInstalled,
    warehouses,
    warehouseId,
    warehouseDeliveryPoint,
    handleWarehouseChange,
    procurementMode,
    setProcurementMode,
    procurementType,
    setProcurementType,
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
    revisionRfqId,
    revisionLoading,
    updateEstimatedPrice,
    updateQuantity,
    addManualItem,
    addServiceLine,
    updateManualItem,
    removeItem,
    handleSubmitPR,
  } = useCheckout();

  if (success) {
    return (
      <CheckoutSuccess
        revisionRfqId={revisionRfqId}
        prTitle={prTitle}
        onGoToRequests={() => navigate(`${getCompanyPrefix()}/my-pr`)}
      />
    );
  }

  return (
    <Layout
      title="Create Purchase Request"
      subtitle={
        revisionRfqId
          ? "Perbarui rincian PR yang ditolak, lalu ajukan kembali untuk approval."
          : "Tinjau daftar kebutuhan pengadaan barang/jasa dan lengkapi data approval."
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bar Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--ui-border)]">
          <div className="flex items-center gap-2">
            <HuntrButton
              onClick={() => navigate(`${getCompanyPrefix()}/marketplace`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] hover:bg-[var(--ui-bg-input)] text-xs font-semibold text-[var(--ui-text-secondary)] hover:text-[var(--ui-text-primary)] transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeft size={14} className="text-orange-500" />
              Kembali ke Katalog
            </HuntrButton>
            <span className="text-xs text-[var(--ui-text-muted)] hidden sm:inline">/</span>
            <span className="text-xs font-medium text-[var(--ui-text-muted)] hidden sm:inline">
              Pengajuan PR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <ShoppingCart size={13} />
              {cart.length} Kebutuhan Terpilih
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ShieldCheck size={13} />
              Approval Siap
            </span>
          </div>
        </div>

        {/* Loading Revision PR */}
        {revisionLoading && (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-5 py-4 text-sm text-[var(--ui-text-secondary)] shadow-sm">
            <Loader2 size={18} className="animate-spin text-orange-500" />
            <span>Memuat data Purchase Request untuk revisi…</span>
          </div>
        )}

        {/* Rejection Revision Banner */}
        {revisionRfqId && !revisionLoading && !error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-xs text-[var(--ui-text-secondary)]">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-500">Mode Revisi PR yang Ditolak</p>
              <p className="leading-relaxed">
                Anda sedang memperbarui PR yang sebelumnya membutuhkan revisi. Sesuaikan spesifikasi, harga estimasi, atau justifikasi sebelum mengajukan ulang ke reviewer.
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column: Items Table + Full PR Form */}
          <div className="lg:col-span-8 space-y-6">
            <CheckoutItemsTable
              cart={cart}
              cartTotal={cartTotal}
              procurementType={procurementType}
              procurementMode={procurementMode}
              onAddManualItem={addManualItem}
              onAddServiceLine={addServiceLine}
              onUpdateManualItem={updateManualItem}
              onRemoveItem={removeItem}
              onUpdateQuantity={updateQuantity}
              onUpdateEstimatedPrice={updateEstimatedPrice}
            />

            <CheckoutForm
              procurementType={procurementType}
              setProcurementType={setProcurementType}
              procurementMode={procurementMode}
              setProcurementMode={setProcurementMode}
              cart={cart}
              prTitle={prTitle}
              setPrTitle={setPrTitle}
              prDepartment={prDepartment}
              setPrDepartment={setPrDepartment}
              prDesc={prDesc}
              setPrDesc={setPrDesc}
              prDuration={prDuration}
              setPrDuration={setPrDuration}
              prDocument={prDocument}
              setPrDocument={setPrDocument}
              deliveryPoint={deliveryPoint}
              setDeliveryPoint={setDeliveryPoint}
              companyAddresses={companyAddresses}
              wmsInstalled={wmsInstalled}
              warehouses={warehouses}
              warehouseId={warehouseId}
              warehouseDeliveryPoint={warehouseDeliveryPoint}
              onWarehouseChange={handleWarehouseChange}
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
              serviceLocation={serviceLocation}
              setServiceLocation={setServiceLocation}
              acceptanceCriteria={acceptanceCriteria}
              setAcceptanceCriteria={setAcceptanceCriteria}
              durationCalculation={durationCalculation}
            />
          </div>

          {/* Sidebar Column: Sticky Order & Budget Summary */}
          <div className="lg:col-span-4">
            <CheckoutSummarySidebar
              procurementType={procurementType}
              procurementMode={procurementMode}
              cartTotal={cartTotal}
              cartLength={cart.length}
              error={error}
              loading={loading}
              revisionLoading={revisionLoading}
              revisionRfqId={revisionRfqId}
              onSubmit={handleSubmitPR}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
