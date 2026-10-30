import { Button as HuntrButton } from "~/shared/ui/Button";
import React from "react";
import Layout from "~/components/Layout";
import { ArrowLeft, Loader2 } from "lucide-react";
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
      title="Checkout Purchase Request"
      subtitle={
        revisionRfqId
          ? "Update the rejected PR, then submit it again for approval."
          : "Review your selected items and submit for approval."
      }
    >
      <div className="w-full space-y-4">
        {revisionLoading && (
          <div className="flex items-center gap-2 border border-[var(--ui-border)] bg-[var(--ui-bg-card)] px-4 py-3 text-sm text-[var(--ui-text-secondary)]">
            <Loader2 size={16} className="animate-spin" /> Loading PR for
            revision…
          </div>
        )}
        {revisionRfqId && !revisionLoading && !error && (
          <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-[var(--ui-text-secondary)]">
            You are revising a rejected PR. Update its details and items, then
            submit it for approval again.
          </div>
        )}

        {/* Back Link */}
        <HuntrButton
          onClick={() => navigate(`${getCompanyPrefix()}/marketplace`)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Marketplace
        </HuntrButton>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content Area (Items + PR Form) */}
          <div className="lg:col-span-2 space-y-4">
            <CheckoutItemsTable
              cart={cart}
              cartTotal={cartTotal}
              procurementType={procurementType}
              procurementMode={procurementMode}
              onAddManualItem={addManualItem}
              onAddServiceLine={addServiceLine}
              onUpdateManualItem={updateManualItem}
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

          {/* Right Summary Sidebar */}
          <CheckoutSummarySidebar
            procurementType={procurementType}
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
    </Layout>
  );
}
