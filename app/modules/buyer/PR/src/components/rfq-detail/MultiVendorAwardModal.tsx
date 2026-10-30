import { Button as HuntrButton } from "~/shared/ui/Button";
import { Table as HuntrTable, TableHead as HuntrTableHead, TableRow as HuntrTableRow, TableHeaderCell as HuntrTableHeaderCell, TableBody as HuntrTableBody, TableCell as HuntrTableCell } from "~/shared/ui/Table";
import React, { useState, useMemo } from "react";
import {
  X,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Building2,
  Loader2,
  Ban,
  Tag,
} from "lucide-react";
import Swal from "sweetalert2";

interface MultiVendorAwardModalProps {
  rfq: any;
  rankings: any[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    awards: Array<{ proposal_id: string; item_ids: string[] }>,
    awardMode: "multi_vendor"
  ) => Promise<void>;
  isProcessing: boolean;
}

export function MultiVendorAwardModal({
  rfq,
  rankings,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: MultiVendorAwardModalProps) {
  const rfqItems = useMemo(() => rfq?.items || [], [rfq]);

  // Selected vendor proposal IDs (must be > 1 and <= 5)
  const [selectedProposalIds, setSelectedProposalIds] = useState<string[]>(() => {
    // Default: select top 2 vendors if available
    const initial = rankings.slice(0, 2).map((r) => String(r.proposal.id));
    return initial;
  });

  // Active tab in vendor checklist review
  const [activeVendorId, setActiveVendorId] = useState<string>(() => {
    return rankings[0]?.proposal?.id ? String(rankings[0].proposal.id) : "";
  });

  // Helper map: items offered by each proposal: { [proposalId]: Set<rfq_item_id> }
  const vendorOfferedItemMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    rankings.forEach((r) => {
      const pId = String(r.proposal.id);
      const itemSet = new Set<string>();
      (r.proposal.items || []).forEach((pi: any) => {
        itemSet.add(String(pi.rfq_item_id));
      });
      map[pId] = itemSet;
    });
    return map;
  }, [rankings]);

  // State: checked items per vendor proposal id: { [proposalId]: rfq_item_id[] }
  const [vendorItemChecklists, setVendorItemChecklists] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    rankings.forEach((r) => {
      const pId = String(r.proposal.id);
      // Pre-populate with items that THIS vendor actually offered
      const offeredItemIds = (r.proposal.items || []).map((pi: any) => String(pi.rfq_item_id));
      initial[pId] = offeredItemIds;
    });
    return initial;
  });

  if (!isOpen) return null;

  const toggleProposalSelection = (proposalId: string) => {
    setSelectedProposalIds((prev) => {
      if (prev.includes(proposalId)) {
        if (prev.length <= 1) {
          return prev;
        }
        const next = prev.filter((id) => id !== proposalId);
        if (activeVendorId === proposalId && next.length > 0) {
          setActiveVendorId(next[0]);
        }
        return next;
      } else {
        if (prev.length >= 5) {
          Swal.fire({
            icon: "warning",
            title: "Maksimal 5 Vendor",
            text: "Skema multi-vendor maksimal dapat memilih 5 vendor pemenang.",
          });
          return prev;
        }
        const next = [...prev, proposalId];
        // Ensure vendor has their offered items initialized
        if (!vendorItemChecklists[proposalId]) {
          const rankingObj = rankings.find((r) => String(r.proposal.id) === proposalId);
          const offeredItemIds = (rankingObj?.proposal?.items || []).map((pi: any) => String(pi.rfq_item_id));
          setVendorItemChecklists((old) => ({
            ...old,
            [proposalId]: offeredItemIds,
          }));
        }
        setActiveVendorId(proposalId);
        return next;
      }
    });
  };

  const toggleItemForVendor = (proposalId: string, rfqItemId: string) => {
    const offeredSet = vendorOfferedItemMap[proposalId];
    if (!offeredSet || !offeredSet.has(rfqItemId)) {
      // Vendor did not bid for this item!
      return;
    }

    setVendorItemChecklists((prev) => {
      const currentList = prev[proposalId] || [];
      const isChecked = currentList.includes(rfqItemId);
      const nextList = isChecked
        ? currentList.filter((id) => id !== rfqItemId)
        : [...currentList, rfqItemId];
      return {
        ...prev,
        [proposalId]: nextList,
      };
    });
  };

  const selectAllOfferedItemsForVendor = (proposalId: string) => {
    const offeredSet = vendorOfferedItemMap[proposalId] || new Set();
    setVendorItemChecklists((prev) => ({
      ...prev,
      [proposalId]: Array.from(offeredSet),
    }));
  };

  const deselectAllItemsForVendor = (proposalId: string) => {
    setVendorItemChecklists((prev) => ({
      ...prev,
      [proposalId]: [],
    }));
  };

  // Smart helper: Auto-assign best price per item across selected vendors (only among vendors who offered that item)
  const handleAutoAssignBestPrice = () => {
    if (selectedProposalIds.length < 2) {
      Swal.fire({
        icon: "info",
        title: "Pilih Minimal 2 Vendor",
        text: "Silakan pilih minimal 2 vendor terlebih dahulu untuk pembagian harga terbaik otomatis.",
      });
      return;
    }

    const newChecklists: Record<string, string[]> = {};
    selectedProposalIds.forEach((id) => {
      newChecklists[id] = [];
    });

    rfqItems.forEach((rfqItem: any) => {
      const rfqItemId = String(rfqItem.id);
      let lowestPrice = Infinity;
      let winningProposalId: string | null = null;

      selectedProposalIds.forEach((pId) => {
        const rankingObj = rankings.find((r) => String(r.proposal.id) === pId);
        const pItem = rankingObj?.proposal?.items?.find(
          (pi: any) => String(pi.rfq_item_id) === rfqItemId
        );
        // ONLY consider vendors who actually offered this item!
        if (pItem) {
          const price = Number(pItem.price_offer);
          if (price < lowestPrice) {
            lowestPrice = price;
            winningProposalId = pId;
          }
        }
      });

      if (winningProposalId && newChecklists[winningProposalId]) {
        newChecklists[winningProposalId].push(rfqItemId);
      }
    });

    setVendorItemChecklists((prev) => ({
      ...prev,
      ...newChecklists,
    }));

    Swal.fire({
      icon: "success",
      title: "Alokasi Otomatis Selesai",
      text: "Setiap barang telah dialokasikan ke vendor yang menawarkan barang tersebut dengan harga penawaran terendah.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  // Validation rules
  const vendorCount = selectedProposalIds.length;
  const isCountValid = vendorCount >= 2 && vendorCount <= 5;

  const vendorsWithoutItems = selectedProposalIds.filter((pId) => {
    const list = vendorItemChecklists[pId] || [];
    return list.length === 0;
  });

  const allSelectedVendorsHaveItems = vendorsWithoutItems.length === 0;

  // Calculate totals per vendor
  const vendorSummaries = useMemo(() => {
    return selectedProposalIds.map((pId) => {
      const rankingObj = rankings.find((r) => String(r.proposal.id) === pId);
      const proposal = rankingObj?.proposal;
      const checkedIds = vendorItemChecklists[pId] || [];

      let vendorTotal = 0;
      checkedIds.forEach((itemId) => {
        const rItem = rfqItems.find((i: any) => String(i.id) === itemId);
        const pItem = proposal?.items?.find((pi: any) => String(pi.rfq_item_id) === itemId);
        const price = pItem ? Number(pItem.price_offer) : 0;
        const qty = rItem?.qty || 1;
        vendorTotal += price * qty;
      });

      const totalOfferedByVendor = (proposal?.items || []).length;

      return {
        proposalId: pId,
        companyName: proposal?.company?.name || "Vendor",
        itemCount: checkedIds.length,
        totalOfferedByVendor,
        totalAmount: vendorTotal,
      };
    });
  }, [selectedProposalIds, vendorItemChecklists, rankings, rfqItems]);

  const grandTotal = vendorSummaries.reduce((sum, v) => sum + v.totalAmount, 0);

  // Check unique items covered
  const coveredItemIds = new Set<string>();
  selectedProposalIds.forEach((pId) => {
    (vendorItemChecklists[pId] || []).forEach((id) => coveredItemIds.add(id));
  });
  const unallocatedCount = rfqItems.length - coveredItemIds.size;

  const handleSubmit = async () => {
    if (!isCountValid) {
      Swal.fire({
        icon: "error",
        title: "Jumlah Vendor Tidak Valid",
        text: "Pemenang tender harus lebih dari 1 vendor (minimal 2) dan maksimal 5 vendor pemenang.",
      });
      return;
    }

    if (!allSelectedVendorsHaveItems) {
      Swal.fire({
        icon: "error",
        title: "Item Belum Terpilih",
        text: "Setiap vendor pemenang harus memiliki minimal 1 item yang di-checklist untuk diterbitkan ke PO.",
      });
      return;
    }

    const confirmRes = await Swal.fire({
      icon: "question",
      title: "Konfirmasi Pemenang Multi-Vendor",
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p>Anda akan menetapkan <b>${vendorCount} vendor pemenang</b> dengan item masing-masing:</p>
          <ul style="margin: 8px 0; padding-left: 20px;">
            ${vendorSummaries
              .map(
                (v) =>
                  `<li><b>${v.companyName}</b>: ${v.itemCount} item (Rp ${v.totalAmount.toLocaleString("id-ID")})</li>`
              )
              .join("")}
          </ul>
          <p style="margin-top: 10px; color: #f97316;">
            <b>Catatan:</b> Purchase Order (PO) akan diterbitkan terpisah untuk masing-masing vendor hanya dengan item-item yang di-checklist.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      confirmButtonText: "Ya, Tetapkan Pemenang & Terbitkan PO",
      cancelButtonText: "Batal",
    });

    if (!confirmRes.isConfirmed) return;

    const awards = selectedProposalIds.map((pId) => ({
      proposal_id: pId,
      item_ids: vendorItemChecklists[pId] || [],
    }));

    await onConfirm(awards, "multi_vendor");
  };

  const activeRanking = rankings.find((r) => String(r.proposal.id) === activeVendorId);
  const activeProposal = activeRanking?.proposal;
  const activeCheckedList = vendorItemChecklists[activeVendorId] || [];
  const activeOfferedSet = vendorOfferedItemMap[activeVendorId] || new Set();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--ui-bg-card)] border border-[var(--ui-border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--ui-border)] flex items-center justify-between gap-3 bg-[var(--ui-bg-input)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--ui-text-primary)] flex items-center gap-2">
                Skema Multi-Vendor Split Award
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-500">
                  2 - 5 Pemenang
                </span>
              </h3>
              <p className="text-[11px] text-[var(--ui-text-muted)] mt-0.5">
                Tetapkan vendor pemenang untuk barang yang mereka ikuti dalam tender, dan checklist item untuk penerbitan PO.
              </p>
            </div>
          </div>
          <HuntrButton
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-border)] transition-colors"
          >
            <X size={18} />
          </HuntrButton>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Rules Banner */}
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-3 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2.5 min-w-0">
              <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
              <div className="text-xs text-[var(--ui-text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--ui-text-primary)]">Aturan Tender Multi-Vendor:</span>
                {" "}Pemenang tender <b>harus lebih dari 1 vendor (minimal 2)</b> dan <b>maksimal 5 vendor</b>. Setiap vendor hanya dapat memenangkan barang yang <b>memang ditawarkan oleh vendor tersebut</b>. Hanya item yang di-checklist yang diterbitkan ke PO.
              </div>
            </div>
            <HuntrButton
              type="button"
              onClick={handleAutoAssignBestPrice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all shrink-0"
            >
              <Sparkles size={13} /> Alokasi Otomatis (Best Price)
            </HuntrButton>
          </div>

          {/* Section 1: Vendor Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                Langkah 1: Pilih Vendor Pemenang ({vendorCount}/5 Terpilih)
              </span>
              {!isCountValid && (
                <span className="text-[11px] font-semibold text-amber-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {vendorCount < 2 ? "Wajib memilih lebih dari 1 vendor (min. 2)" : "Maksimal 5 vendor"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {rankings.map((r) => {
                const p = r.proposal;
                const pId = String(p.id);
                const isSelected = selectedProposalIds.includes(pId);
                const checkedItemsCount = (vendorItemChecklists[pId] || []).length;
                const offeredCount = (p.items || []).length;

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProposalSelection(pId)}
                    className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-2.5 select-none ${
                      isSelected
                        ? "border-orange-500 bg-orange-500/10 shadow-sm"
                        : "border-[var(--ui-border)] bg-[var(--ui-bg-input)] hover:border-orange-500/40 opacity-75"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare size={16} className="text-orange-500 shrink-0" />
                      ) : (
                        <Square size={16} className="text-[var(--ui-text-muted)] shrink-0" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[var(--ui-text-primary)] truncate">
                          {p.company?.name || "Vendor"}
                        </span>
                        <span className="text-[10px] font-extrabold text-[var(--ui-text-muted)]">
                          #{r.rank}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-orange-500 mt-0.5">
                        Rp {Number(p.price_offer).toLocaleString("id-ID")}
                      </div>
                      <div className="text-[10px] text-[var(--ui-text-muted)] mt-1 flex items-center justify-between gap-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-blue-400">
                          <Tag size={10} /> Menawarkan {offeredCount}/{rfqItems.length} Barang
                        </span>
                        {isSelected && (
                          <span className={`font-semibold ${checkedItemsCount > 0 ? "text-emerald-500" : "text-amber-500"}`}>
                            {checkedItemsCount} item dipilih
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Items Checklist Matrix per Vendor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                Langkah 2: Checklist Barang yang Dimenangkan per Vendor
              </span>
              {unallocatedCount > 0 && (
                <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⚠️ {unallocatedCount} barang belum dialokasikan ke vendor manapun
                </span>
              )}
            </div>

            {/* Vendor Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--ui-border)]">
              {selectedProposalIds.map((pId) => {
                const rankingObj = rankings.find((r) => String(r.proposal.id) === pId);
                const compName = rankingObj?.proposal?.company?.name || "Vendor";
                const count = (vendorItemChecklists[pId] || []).length;
                const offeredCount = (rankingObj?.proposal?.items || []).length;
                const isActive = activeVendorId === pId;

                return (
                  <HuntrButton
                    key={pId}
                    type="button"
                    onClick={() => setActiveVendorId(pId)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold transition-all whitespace-nowrap border-b-2 ${
                      isActive
                        ? "border-orange-500 text-orange-500 bg-orange-500/10"
                        : "border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:bg-[var(--ui-bg-input)]"
                    }`}
                  >
                    <Building2 size={13} />
                    <span>{compName}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        count > 0 ? "bg-orange-500 text-white" : "bg-[var(--ui-border)] text-[var(--ui-text-muted)]"
                      }`}
                      title={`${count} item di-checklist dari ${offeredCount} item yang ditawarkan`}
                    >
                      {count}
                    </span>
                  </HuntrButton>
                );
              })}
            </div>

            {/* Active Vendor Item Checklist Table */}
            {activeProposal ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap bg-[var(--ui-bg-input)] px-3 py-2 rounded-lg border border-[var(--ui-border)]">
                  <div className="text-xs text-[var(--ui-text-secondary)]">
                    Mengatur barang untuk <b>{activeProposal.company?.name}</b>{" "}
                    <span className="text-[11px] text-[var(--ui-text-muted)]">
                      (Vendor ini ikut tender untuk <b>{activeOfferedSet.size} dari {rfqItems.length}</b> barang)
                    </span>:{" "}
                    <span className="text-orange-500 font-bold ml-1">
                      {activeCheckedList.length} item dicentang
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HuntrButton
                      type="button"
                      onClick={() => selectAllOfferedItemsForVendor(activeVendorId)}
                      className="text-[11px] font-semibold text-orange-500 hover:underline"
                    >
                      Pilih Semua Barang yang Ditawarkan
                    </HuntrButton>
                    <span className="text-[var(--ui-text-muted)]">·</span>
                    <HuntrButton
                      type="button"
                      onClick={() => deselectAllItemsForVendor(activeVendorId)}
                      className="text-[11px] font-semibold text-[var(--ui-text-muted)] hover:underline"
                    >
                      Hapus Pilihan
                    </HuntrButton>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-card)] huntr-table-scroll">
                  <HuntrTable className="w-full text-sm border-collapse min-w-[620px]">
                    <HuntrTableHead>
                      <HuntrTableRow className="border-b border-[var(--ui-border)] bg-[var(--ui-bg-input)]">
                        <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-10">
                          Check
                        </HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
                          Produk / Barang RFQ
                        </HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-24">
                          Qty
                        </HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-36">
                          Harga Penawaran
                        </HuntrTableHeaderCell>
                        <HuntrTableHeaderCell className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)] w-36">
                          Subtotal PO
                        </HuntrTableHeaderCell>
                      </HuntrTableRow>
                    </HuntrTableHead>
                    <HuntrTableBody className="divide-y divide-[var(--ui-border)]">
                      {rfqItems.map((item: any, idx: number) => {
                        const itemId = String(item.id);
                        const isOfferedByVendor = activeOfferedSet.has(itemId);
                        const isChecked = isOfferedByVendor && activeCheckedList.includes(itemId);
                        const cat = item.catalogue;
                        const pItem = activeProposal.items?.find(
                          (pi: any) => String(pi.rfq_item_id) === itemId
                        );
                        const unitPrice = pItem ? Number(pItem.price_offer) : 0;
                        const lineSubtotal = unitPrice * (item.qty || 1);

                        // Check which other vendor has selected this item
                        const otherVendors = selectedProposalIds
                          .filter((pId) => pId !== activeVendorId && (vendorItemChecklists[pId] || []).includes(itemId))
                          .map((pId) => {
                            const r = rankings.find((rk) => String(rk.proposal.id) === pId);
                            return r?.proposal?.company?.name || "Vendor";
                          });

                        return (
                          <HuntrTableRow
                            key={item.id ?? idx}
                            onClick={() => {
                              if (isOfferedByVendor) {
                                toggleItemForVendor(activeVendorId, itemId);
                              }
                            }}
                            className={`transition-colors ${
                              !isOfferedByVendor
                                ? "bg-[var(--ui-bg-input)]/40 opacity-50 cursor-not-allowed"
                                : isChecked
                                ? "cursor-pointer bg-orange-500/5 hover:bg-orange-500/10"
                                : "cursor-pointer hover:bg-[var(--ui-bg-input)]"
                            }`}
                          >
                            <HuntrTableCell className="px-3 py-2.5 text-center">
                              {!isOfferedByVendor ? (
                                <span title="Vendor tidak menawarkan barang ini">
                                  <Ban size={14} className="text-[var(--ui-text-muted)] inline" />
                                </span>
                              ) : isChecked ? (
                                <CheckSquare size={16} className="text-orange-500 inline" />
                              ) : (
                                <Square size={16} className="text-[var(--ui-text-muted)] inline" />
                              )}
                            </HuntrTableCell>
                            <HuntrTableCell className="px-3 py-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[var(--ui-text-primary)]">
                                  {cat?.name || item.item_name || "Item #" + (idx + 1)}
                                </span>
                                {!isOfferedByVendor ? (
                                  <span className="text-[9px] font-bold text-[var(--ui-text-muted)] bg-[var(--ui-border)] px-1.5 py-0.2 rounded">
                                    Tidak Ditawarkan Vendor
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                                    Ditawarkan
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[var(--ui-text-muted)] flex items-center gap-1.5 mt-0.5">
                                <span>Code: {cat?.item_code || item.item_code || "—"}</span>
                                {otherVendors.length > 0 && (
                                  <span className="text-purple-400 font-semibold">
                                    · (Juga dialokasikan ke: {otherVendors.join(", ")})
                                  </span>
                                )}
                              </div>
                            </HuntrTableCell>
                            <HuntrTableCell className="px-3 py-2.5 text-xs text-[var(--ui-text-primary)] whitespace-nowrap">
                              {item.qty} {cat?.uom || "pcs"}
                            </HuntrTableCell>
                            <HuntrTableCell className="px-3 py-2.5 text-xs whitespace-nowrap">
                              {!isOfferedByVendor ? (
                                <span className="text-[var(--ui-text-muted)] italic">—</span>
                              ) : (
                                <span className="text-[var(--ui-text-secondary)] font-semibold">
                                  Rp {unitPrice.toLocaleString("id-ID")}
                                </span>
                              )}
                            </HuntrTableCell>
                            <HuntrTableCell className="px-3 py-2.5 text-right text-xs font-bold whitespace-nowrap">
                              {!isOfferedByVendor ? (
                                <span className="text-[10px] text-[var(--ui-text-muted)] italic">
                                  Tidak ikut tender
                                </span>
                              ) : isChecked ? (
                                <span className="text-orange-500 font-extrabold">
                                  Rp {lineSubtotal.toLocaleString("id-ID")}
                                </span>
                              ) : (
                                <span className="text-[var(--ui-text-muted)] line-through opacity-50">
                                  Rp {lineSubtotal.toLocaleString("id-ID")}
                                </span>
                              )}
                            </HuntrTableCell>
                          </HuntrTableRow>
                        );
                      })}
                    </HuntrTableBody>
                  </HuntrTable>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Summary & Actions */}
        <div className="p-4 border-t border-[var(--ui-border)] bg-[var(--ui-bg-input)] flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Total Estimasi Tender ({vendorCount} Vendor Pemenang)
            </div>
            <div className="text-base font-extrabold text-orange-500">
              Rp {grandTotal.toLocaleString("id-ID")}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HuntrButton
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--ui-border)] bg-[var(--ui-bg-card)] text-[var(--ui-text-secondary)] hover:border-orange-500/30 transition-colors disabled:opacity-50"
            >
              Batal
            </HuntrButton>
            <HuntrButton
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || !isCountValid || !allSelectedVendorsHaveItems}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Menetapkan Pemenang...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Tetapkan {vendorCount} Pemenang & Terbitkan PO
                </>
              )}
            </HuntrButton>
          </div>
        </div>
      </div>
    </div>
  );
}
