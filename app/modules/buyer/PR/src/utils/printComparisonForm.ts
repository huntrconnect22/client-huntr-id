/**
 * Utility to print the Comparison Form (比较表) matching the standard procurement
 * comparison sheet format from Comparison Seal Oil_ditandatangani.pdf.
 */

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return "0";
  return Number(num).toLocaleString("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(Number(num))) return "0.00%";
  const formatted = Number(num).toFixed(2);
  return `${Number(num) > 0 ? "+" : ""}${formatted}%`;
}

interface PrintComparisonParams {
  request: any;
  rankings: any[];
  awardedProposal: any;
  overallAnalysis?: string;
  companyName?: string;
}

export function printComparisonForm({
  request,
  rankings = [],
  awardedProposal,
  overallAnalysis = "",
  companyName,
}: PrintComparisonParams) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=1200,height=850");
  if (!printWindow) {
    alert("Pop-up blocked. Please allow pop-ups for this site to print the comparison form.");
    return;
  }

  const buyerCompany = companyName || request?.company?.name || "HUNTR PROCUREMENT WORKSPACE";
  const prNumber = request?.reference_number || `PR-${String(request?.id || "").slice(0, 8).toUpperCase()}`;
  const currency = request?.currency || "IDR";
  const department = request?.department || "General Procurement";
  const costCenter = request?.cost_center || request?.department || "001";
  const deliveryPoint = request?.delivery_point || "Jakarta / Franco Site";
  const dateFormatted = request?.created_at
    ? new Date(request.created_at).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  const items: any[] = request?.items || [];

  // Determine vendor list from rankings or request.proposals
  const allProposals: any[] = (rankings.length > 0
    ? rankings.map((r: any) => ({
        ...r.proposal,
        company: r.proposal?.company || { name: r.vendor },
        rank: r.rank,
        is_winner: r.is_winner,
        items: r.proposal?.items || [],
      }))
    : request?.proposals || []
  ).filter(Boolean);

  // Determine awarded proposal
  const awarded =
    awardedProposal?.proposal ||
    awardedProposal ||
    allProposals.find((p: any) => p?.is_winner || p?.winner_status === "awarded" || p?.winner_status === "approved") ||
    allProposals[0] ||
    null;

  const awardedVendorName = awarded?.company?.name || awarded?.vendor || "—";

  // Per-item calculations
  let totalLastPrice = 0;
  let totalAwardedPrice = 0;
  const vendorTotals: { [vendorId: string]: number } = {};

  allProposals.forEach((p) => {
    vendorTotals[p.id] = 0;
  });

  // Helper to extract initial offer (penawaran awal) and negotiated deal offer for a vendor
  const getVendorItemOffers = (p: any, item: any, qty: number) => {
    const pItemOffer = p.items?.find(
      (pi: any) => String(pi.rfq_item_id) === String(item.id)
    );
    const acceptedNeg =
      p.acceptedNegotiation ||
      p.accepted_negotiation ||
      (p.negotiations || []).find((n: any) => n.status === "accepted");
    const negItem = acceptedNeg?.items?.find(
      (ni: any) =>
        String(ni.proposal_item_id) === String(pItemOffer?.id) ||
        String(ni.proposal_item_id) === String(item.id)
    );

    // Initial price offer submitted by vendor at bid time (Kotak Biru)
    let initialPrice = 0;
    if (pItemOffer?.initial_price_offer !== undefined && pItemOffer?.initial_price_offer !== null) {
      initialPrice = Number(pItemOffer.initial_price_offer);
    } else if (negItem?.original_price !== undefined && negItem?.original_price !== null) {
      initialPrice = Number(negItem.original_price);
    } else if (pItemOffer?.price_offer !== undefined && pItemOffer?.price_offer !== null) {
      initialPrice = Number(pItemOffer.price_offer);
    } else if (p.initial_price_offer) {
      initialPrice = Number(p.initial_price_offer) / (items.length || 1) / qty;
    } else if (p.price_offer) {
      initialPrice = Number(p.price_offer) / (items.length || 1) / qty;
    }

    // Effective / negotiated deal price (Kotak Kuning)
    let effectivePrice = Number(pItemOffer?.price_offer ?? initialPrice);
    if (negItem && negItem.negotiated_price !== undefined && negItem.negotiated_price !== null) {
      effectivePrice = Number(negItem.negotiated_price);
    }

    return {
      initial: initialPrice,
      effective: effectivePrice > 0 ? effectivePrice : initialPrice,
      itemOffer: pItemOffer,
      acceptedNeg,
    };
  };

  const tableRows = items.map((item, idx) => {
    const qty = Number(item.qty || 1);
    const uom = item.uom || item.catalogue?.uom || "Pcs";
    const itemName = item.item_name || item.catalogue?.name || `Item #${idx + 1}`;
    const specs = item.specifications || item.catalogue?.specifications || item.service_scope || "";
    const fullDescription = specs ? `${itemName} - ${specs}` : itemName;

    // Find best vendor for this item (lowest price automatically goes to Kotak Kuning)
    let bestVendor: any = null;
    let bestEffectivePrice = Infinity;
    let bestInitialPrice = 0;

    // Check if this item is explicitly checklisted/awarded to a specific vendor
    const explicitlyAwardedVendor = allProposals.find((p: any) => {
      const pi = p.items?.find((i: any) => String(i.rfq_item_id) === String(item.id));
      return pi?.is_awarded;
    });

    if (explicitlyAwardedVendor) {
      const off = getVendorItemOffers(explicitlyAwardedVendor, item, qty);
      bestVendor = explicitlyAwardedVendor;
      bestEffectivePrice = off.effective;
      bestInitialPrice = off.initial;
    } else {
      // Automatically select the vendor with lowest effective price for this item
      for (const p of allProposals) {
        const off = getVendorItemOffers(p, item, qty);
        if (off.effective > 0 && off.effective < bestEffectivePrice) {
          bestEffectivePrice = off.effective;
          bestInitialPrice = off.initial;
          bestVendor = p;
        }
      }
    }

    // Fallback if no prices found
    if (bestEffectivePrice === Infinity) {
      const defAwarded = awarded || allProposals[0];
      const off = defAwarded ? getVendorItemOffers(defAwarded, item, qty) : { effective: 0, initial: 0 };
      bestEffectivePrice = off.effective;
      bestInitialPrice = off.initial;
      bestVendor = defAwarded;
    }

    const itemAwardedUnitPrice = bestEffectivePrice;
    const itemAwardedTotalPrice = itemAwardedUnitPrice * qty;
    const itemAwardedVendorName = bestVendor?.company?.name || bestVendor?.vendor || "—";
    totalAwardedPrice += itemAwardedTotalPrice;

    // Last price resolution:
    // Priority 1: Historical last purchase price
    // Priority 2: Target price from PR (estimated_price)
    // Priority 3: Vendor's initial submitted price before negotiation
    let lastPrice = 0;
    let lastPriceSource = "none";
    if (Number(item.last_price) > 0) {
      lastPrice = Number(item.last_price);
      lastPriceSource = "historical";
    } else if (Number(item.estimated_price) > 0) {
      lastPrice = Number(item.estimated_price);
      lastPriceSource = "target_price";
    } else if (bestInitialPrice > 0) {
      lastPrice = bestInitialPrice;
      lastPriceSource = "initial_bid";
    }
    totalLastPrice += lastPrice * qty;

    // Deviation calculation (shows savings / penghematan)
    let deviation = 0;
    if (lastPrice > 0) {
      deviation = ((itemAwardedUnitPrice - lastPrice) / lastPrice) * 100;
    }

    // Build per-vendor cells (Kotak Biru: always displays INITIAL offer submitted at bid time)
    const vendorCellsHtml = allProposals
      .map((p) => {
        const off = getVendorItemOffers(p, item, qty);
        const unitPrice = off.initial;
        const lineTotal = unitPrice * qty;
        vendorTotals[p.id] = (vendorTotals[p.id] || 0) + lineTotal;

        return `
          <td class="text-right num">${formatCurrency(unitPrice)}</td>
          <td class="text-right num">${formatCurrency(lineTotal)}</td>
        `;
      })
      .join("");

    return `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>
          <div class="font-bold">${escapeHtml(fullDescription)}</div>
          ${item.sku ? `<div class="subtext">SKU: ${escapeHtml(item.sku)}</div>` : ""}
        </td>
        <td class="text-center font-bold">${qty}</td>
        <td class="text-center">${escapeHtml(uom)}</td>
        <td class="text-right num font-bold ${lastPrice === 0 ? "text-muted" : ""}">${formatCurrency(lastPrice)}</td>
        <td class="text-right num font-bold text-success">${formatCurrency(itemAwardedUnitPrice)}</td>
        <td class="text-right num font-bold text-success">${formatCurrency(itemAwardedTotalPrice)}</td>
        <td class="text-center vendor-badge font-bold">${escapeHtml(itemAwardedVendorName)}</td>
        <td class="text-right num font-bold ${deviation < 0 ? "text-success" : deviation > 0 ? "text-danger" : ""}">${lastPrice > 0 ? formatPercent(deviation) : "0.00%"}</td>
        ${vendorCellsHtml}
      </tr>
    `;
  }).join("");

  // Summary row totals
  const vatRate = 0.11;
  const pphRate = 0.0; // 0% unless specified

  const vatAwarded = totalAwardedPrice * vatRate;
  const pphAwarded = totalAwardedPrice * pphRate;
  const grandTotalAwarded = totalAwardedPrice + vatAwarded - pphAwarded;

  let avgDeviation = 0;
  if (totalLastPrice > 0) {
    avgDeviation = ((totalAwardedPrice - totalLastPrice) / totalLastPrice) * 100;
  }

  // Footer vendor totals
  const vendorFooterCells = (type: "total" | "vat" | "pph" | "grand") =>
    allProposals
      .map((p) => {
        const tot = vendorTotals[p.id] || 0;
        let val = tot;
        if (type === "vat") val = tot * vatRate;
        if (type === "pph") val = tot * pphRate;
        if (type === "grand") val = tot + tot * vatRate - tot * pphRate;
        return `
          <td class="text-right num font-bold" colspan="2">${formatCurrency(val)}</td>
        `;
      })
      .join("");

  // Terms and conditions rows (Kotak Kuning adapts if negotiated terms exist)
  const awardedNeg =
    awarded?.acceptedNegotiation ||
    awarded?.accepted_negotiation ||
    (awarded?.negotiations || []).find((n: any) => n.status === "accepted");

  const awardedPaymentVal =
    awardedNeg?.payment_scheme || awarded?.payment_term || "Cash before delivery / TOP 30 Days";
  const awardedDeliveryVal = awardedNeg?.delivery_terms
    ? `${awardedNeg.delivery_terms} working days after PO`
    : awarded?.delivery_days
    ? `${awarded.delivery_days} working days after PO`
    : "Prompt";

  const termsList = [
    {
      title: "1. Payment Scheme / 付款方式",
      awardedVal: awardedPaymentVal,
      getVendorVal: (p: any) => p.payment_term || "—",
    },
    {
      title: "2. Franco Delivery / 交货地点",
      awardedVal: deliveryPoint,
      getVendorVal: () => deliveryPoint,
    },
    {
      title: "3. Delivery Time / 交货期",
      awardedVal: awardedDeliveryVal,
      getVendorVal: (p: any) => (p.delivery_days ? `${p.delivery_days} working days` : "—"),
    },
    {
      title: "4. Warranty / 保修期",
      awardedVal: awarded?.warranty_months ? `${awarded.warranty_months} Months` : "Standard Warranty",
      getVendorVal: (p: any) => (p.warranty_months ? `${p.warranty_months} Months` : "—"),
    },
    {
      title: "5. Contact Person / 联系人",
      awardedVal: awarded?.company?.email || awarded?.company?.phone || "Purchasing Dept",
      getVendorVal: (p: any) => p.company?.email || p.company?.phone || "—",
    },
  ];

  const termsRowsHtml = termsList
    .map(
      (term) => `
      <tr>
        <td class="font-bold" colspan="5">${escapeHtml(term.title)}</td>
        <td class="font-bold text-center" colspan="4">${escapeHtml(term.awardedVal)}</td>
        ${allProposals
          .map(
            (p) => `
          <td class="text-center" colspan="2">${escapeHtml(term.getVendorVal(p))}</td>
        `
          )
          .join("")}
      </tr>
    `
    )
    .join("");

  // Reason for selection
  const reasonText =
    awarded?.recommendation ||
    awarded?.reasons ||
    overallAnalysis ||
    `${awardedVendorName} price is competitive, satisfies the technical requirements, and offers acceptable delivery lead time.`;

  // HTML template
  const docHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>COMPARISON FORM - ${escapeHtml(prNumber)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.25;
      color: #0f172a;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .company-title {
      font-size: 14pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .form-title {
      font-size: 13pt;
      font-weight: 900;
      text-align: right;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .subtext {
      font-size: 7.5pt;
      color: #64748b;
    }

    /* Meta Grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 24px;
      row-gap: 4px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      margin-bottom: 8px;
      font-size: 8pt;
    }
    .meta-row {
      display: flex;
      align-items: baseline;
    }
    .meta-label {
      width: 140px;
      font-weight: 700;
      color: #475569;
    }
    .meta-value {
      flex: 1;
      font-weight: 800;
      color: #0f172a;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 4px 5px;
      vertical-align: middle;
      font-size: 8pt;
    }
    th {
      background: #f1f5f9;
      font-weight: 800;
      color: #1e293b;
      text-align: center;
      line-height: 1.15;
    }
    th.group-awarded {
      background: #e0f2fe;
      color: #0369a1;
      border-bottom: 2px solid #0284c7;
    }
    th.group-vendor {
      background: #f8fafc;
      color: #334155;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .font-bold { font-weight: 700; }
    .num { font-family: "Courier New", Courier, monospace; font-size: 7.8pt; }
    .text-success { color: #15803d; }
    .text-danger { color: #b91c1c; }
    .text-muted { color: #94a3b8; }
    .vendor-badge {
      background: #f0fdf4;
      color: #166534;
    }

    .tfoot-label {
      font-weight: 800;
      background: #f8fafc;
    }
    .tfoot-val {
      font-weight: 800;
      background: #f8fafc;
    }
    .grand-total-row th, .grand-total-row td {
      background: #e2e8f0;
      font-weight: 900;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
    }

    /* Reason box */
    .reason-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 6px 10px;
      margin-bottom: 10px;
      font-size: 8pt;
    }
    .reason-header {
      font-weight: 800;
      margin-bottom: 3px;
      color: #0f172a;
    }

    /* Signatures */
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 40px;
      margin-top: 10px;
      page-break-inside: avoid;
    }
    .sig-card {
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      height: 95px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }
    .sig-role {
      font-weight: 800;
      font-size: 8pt;
      color: #334155;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .sig-name {
      font-weight: 800;
      font-size: 8.5pt;
      color: #0f172a;
      border-top: 1px dashed #94a3b8;
      padding-top: 3px;
    }

    .btn-print {
      display: inline-block;
      padding: 8px 16px;
      background: #ef7d00;
      color: #fff;
      font-weight: 700;
      border-radius: 6px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      margin: 10px 0;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #f1f5f9; padding: 10px 16px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>Ready to Print / Simpan PDF</strong> (Pilih Landscape, Ukuran A4, Margin Default/None)</div>
    <div>
      <button class="btn-print" onclick="window.print()">Print / Save PDF</button>
      <button class="btn-print" style="background: #64748b;" onclick="window.close()">Close</button>
    </div>
  </div>

  <div style="padding: 4px;">
    <!-- Top Header -->
    <div class="header-box">
      <div>
        <div class="company-title">${escapeHtml(buyerCompany)}</div>
        <div class="subtext">SUPPLY CHAIN & PROCUREMENT DIVISION</div>
      </div>
      <div>
        <div class="form-title">COMPARISON FORM / 比较表</div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="meta-grid">
      <div class="meta-row">
        <span class="meta-label">Request Title:</span>
        <span class="meta-value">${escapeHtml(request?.title || "—")}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Date:</span>
        <span class="meta-value">${escapeHtml(dateFormatted)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Department / Area:</span>
        <span class="meta-value">${escapeHtml(department)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Delivery Point:</span>
        <span class="meta-value">${escapeHtml(deliveryPoint)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Cost Centre:</span>
        <span class="meta-value">${escapeHtml(costCenter)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">PR Reff. Number:</span>
        <span class="meta-value font-bold">${escapeHtml(prNumber)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Currency:</span>
        <span class="meta-value">${escapeHtml(currency)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Status:</span>
        <span class="meta-value">${escapeHtml(request?.status || "Active").toUpperCase()}</span>
      </div>
    </div>

    <!-- Comparison Table -->
    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width: 28px;">No.</th>
          <th rowspan="2">Item Description / 物品描述</th>
          <th rowspan="2" style="width: 38px;">Qty</th>
          <th rowspan="2" style="width: 44px;">UoM</th>
          <th rowspan="2" style="width: 82px;">Last Price /<br/>最后价格</th>
          <th colspan="4" class="group-awarded">Vendor Awarded and Negotiation Result / 供应商中标及谈判结果</th>
          ${allProposals
            .map(
              (p) => `
            <th colspan="2" class="group-vendor">${escapeHtml(p.company?.name || p.vendor || "Vendor")}</th>
          `
            )
            .join("")}
        </tr>
        <tr>
          <th class="group-awarded" style="width: 80px;">Unit Price Awarded</th>
          <th class="group-awarded" style="width: 85px;">Total Price Awarded</th>
          <th class="group-awarded" style="width: 100px;">Vendor Awarded</th>
          <th class="group-awarded" style="width: 58px;">Deviation /<br/>偏差</th>
          ${allProposals
            .map(
              () => `
            <th class="group-vendor" style="width: 78px;">Unit Price /<br/>单价</th>
            <th class="group-vendor" style="width: 82px;">Total Price /<br/>总价</th>
          `
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <!-- Total -->
        <tr>
          <td colspan="4" class="tfoot-label font-bold text-right">Total / 总计:</td>
          <td class="text-right num font-bold">${formatCurrency(totalLastPrice)}</td>
          <td class="text-right num font-bold text-success" colspan="2">${formatCurrency(totalAwardedPrice)}</td>
          <td class="text-center font-bold" colspan="2">${escapeHtml(awardedVendorName)}</td>
          ${vendorFooterCells("total")}
        </tr>
        <!-- VAT 11% -->
        <tr>
          <td colspan="4" class="tfoot-label text-right">VAT 11% / PPN:</td>
          <td class="text-right num">${formatCurrency(totalLastPrice * vatRate)}</td>
          <td class="text-right num text-success" colspan="2">${formatCurrency(vatAwarded)}</td>
          <td colspan="2"></td>
          ${vendorFooterCells("vat")}
        </tr>
        <!-- PPH 2% -->
        <tr>
          <td colspan="4" class="tfoot-label text-right">PPH 2% / PPh:</td>
          <td class="text-right num">${formatCurrency(totalLastPrice * pphRate)}</td>
          <td class="text-right num text-success" colspan="2">${formatCurrency(pphAwarded)}</td>
          <td colspan="2"></td>
          ${vendorFooterCells("pph")}
        </tr>
        <!-- Grand Total -->
        <tr class="grand-total-row">
          <td colspan="4" class="text-right font-bold">Grand Total / 最终总额:</td>
          <td class="text-right num font-bold">${formatCurrency(totalLastPrice + totalLastPrice * vatRate)}</td>
          <td class="text-right num font-bold text-success" colspan="2">${formatCurrency(grandTotalAwarded)}</td>
          <td colspan="2" class="text-center font-bold">AWARDED</td>
          ${vendorFooterCells("grand")}
        </tr>
        <!-- Average Deviation -->
        <tr>
          <td colspan="4" class="tfoot-label text-right font-bold">Average Deviation Percentage / 平均偏差百分比:</td>
          <td class="text-right num font-bold ${avgDeviation < 0 ? "text-success" : avgDeviation > 0 ? "text-danger" : ""}" colspan="5">
            ${totalLastPrice > 0 ? formatPercent(avgDeviation) : "0.00%"} (Against Last Price)
          </td>
          <td colspan="${allProposals.length * 2}"></td>
        </tr>
        <!-- Terms and Condition comparison -->
        <tr>
          <th colspan="${9 + allProposals.length * 2}" style="background: #e2e8f0; text-align: left; padding: 6px;">
            Terms &amp; Condition Comparison / 条款和条件比较
          </th>
        </tr>
        ${termsRowsHtml}
      </tfoot>
    </table>

    <!-- Reason for Selection -->
    <div class="reason-box">
      <div class="reason-header">Reason for Selection / 选择理由:</div>
      <div>${escapeHtml(reasonText)}</div>
    </div>

    <!-- Signatures -->
    <div class="sig-grid">
      <div class="sig-card">
        <div class="sig-role">Applied by / 应用者: (Purchasing Staff)</div>
        <div style="flex: 1;"></div>
        <div class="sig-name">
          <div>Name: ${escapeHtml(request?.user?.name || "Purchasing Officer")}</div>
          <div class="subtext">Date: ${escapeHtml(dateFormatted)}</div>
        </div>
      </div>
      <div class="sig-card">
        <div class="sig-role">Approved by / 批示: (Purchasing Manager)</div>
        <div style="flex: 1;"></div>
        <div class="sig-name">
          <div>Name: ${escapeHtml(request?.approved_by || request?.approver?.name || "Purchasing Manager")}</div>
          <div class="subtext">Date: ${escapeHtml(dateFormatted)}</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto trigger print dialog after page renders
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
}

