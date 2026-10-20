import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { 
  getMyCompanies, updateCompany, uploadCompanyLogo, verifyNpwp,
  inviteUser, getTeamMembers, getCsrfCookie,
  uploadCompanyDocument, deleteCompanyDocument 
} from "../../../lib/api";

interface CompanyCapacity {
  used: number;
  limit: number;
  remaining: number;
  plan_name: string;
}

export const useCompanyViewModel = () => {
  const navigate = useNavigate();
  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") || params.get("section");
      if (tabParam === "documents" || tabParam === "legal") return "documents";
      if (tabParam && ["profile", "location", "banking", "documents", "performance", "team"].includes(tabParam)) {
        return tabParam;
      }
    }
    return "profile";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleLocationChange = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") || params.get("section");
        if (tabParam === "documents" || tabParam === "legal") setActiveTab("documents");
        else if (tabParam && ["profile", "location", "banking", "documents", "performance", "team"].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      };

      handleLocationChange();
      window.addEventListener("popstate", handleLocationChange);
      return () => window.removeEventListener("popstate", handleLocationChange);
    }
  }, []);
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyCapacity, setCompanyCapacity] = useState<CompanyCapacity | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [showCompanyWorkspace, setShowCompanyWorkspace] = useState(false);
  const [companyListLoading, setCompanyListLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingCompany, setUpdatingCompany] = useState(false);
  const [npwpVerification, setNpwpVerification] = useState<{
    state: "idle" | "loading" | "valid" | "invalid";
    message: string | null;
    taxpayerName: string | null;
  }>({ state: "idle", message: null, taxpayerName: null });

  // Logo state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Document upload state
  const [docUploading, setDocUploading] = useState(false);
  const [docDeletingId, setDocDeletingId] = useState<string | number | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [docSuccess, setDocSuccess] = useState<string | null>(null);

  // Team state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "" });
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const syncActiveCompany = useCallback((found: any) => {
    setCompany(found);
    localStorage.setItem("active_company", JSON.stringify(found));
    setEditForm({
      name: found.name || "",
      tax_id: found.tax_id || "",
      country: found.country || "ID",
      email: found.email || "",
      phone: found.phone || "",
      website: found.website || "",
      provincy_country: found.provincy_country || "Indonesia",
      region: found.region || "",
      regency: found.regency || "",
      city: found.city || "",
      zip_code: found.zip_code || "",
      address: found.address || "",
      bank_name: found.bank_name || "",
      bank_account: found.bank_account || "",
      bank_account_name: found.bank_account_name || "",
      about: found.about || "",
      keywords: Array.isArray(found.keywords) ? found.keywords.join(", ") : (found.keywords || ""),
      industry_type: found.industry_type || "",
      hq_addresses: Array.isArray(found.hq_addresses) ? found.hq_addresses : (found.hq_addresses ? [found.hq_addresses] : [""]),
    });
  }, []);

  const fetchCompanyList = async (userId?: number, activeId?: number) => {
    setCompanyListLoading(true);
    try {
      const data = await getMyCompanies();
      const list = data.companies || [];
      setCompanies(list);
      setCompanyCapacity(data.company_capacity ?? null);
      if (activeId) {
        const current = list.find((c: any) => c.id === activeId);
        if (current) {
          setSelectedWorkspace(current);
          syncActiveCompany(current);
        }
      }
    } catch (err) {
      console.error("Failed to load company list", err);
    } finally {
      setCompanyListLoading(false);
    }
  };

  const fetchTeamMembers = async (companyId: string | number) => {
    setTeamLoading(true);
    try {
      const res = await getTeamMembers(companyId);
      setTeamMembers(res.members || []);
    } catch (err) {
      console.error("Failed to fetch team members", err);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    const userSession = localStorage.getItem("user_session");
    const activeComp = localStorage.getItem("active_company");
    if (!userSession) {
      navigate("/login");
      return;
    }

    const u = JSON.parse(userSession);
    const ac = activeComp ? JSON.parse(activeComp) : null;
    setUser(u);

    getCsrfCookie().catch(err => console.warn("Failed to initialize CSRF cookie:", err));

    fetchCompanyList(u.id, ac?.id).finally(() => setLoading(false));
  }, [navigate, syncActiveCompany]);

  useEffect(() => {
    if (activeTab === "team" && company?.id) {
      fetchTeamMembers(company.id);
    }
  }, [activeTab, company?.id]);

  const handleLogoUpload = async (file: File) => {
    if (!company) return;
    setLogoUploading(true);
    setLogoError(null);
    const fd = new FormData();
    fd.append("company_id", String(company.id));
    fd.append("logo", file);
    try {
      const res = await uploadCompanyLogo(fd);
      const updated = {
        ...company,
        logo_path: res.file_path || company.logo_path,
        logo_url: res.url || company.logo_url,
      };
      syncActiveCompany(updated);
    } catch (err: any) {
      setLogoError(err.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const clearNpwpVerification = () => {
    setNpwpVerification({ state: "idle", message: null, taxpayerName: null });
  };

  const handleVerifyNpwp = async () => {
    const npwp = String(editForm.tax_id || "").replace(/[^0-9]/g, "");
    if (npwp.length !== 15 && npwp.length !== 16) {
      setNpwpVerification({
        state: "invalid",
        message: "Nomor NPWP harus terdiri dari 15 atau 16 digit.",
        taxpayerName: null,
      });
      return;
    }

    setNpwpVerification({ state: "loading", message: null, taxpayerName: null });
    try {
      const result: any = await verifyNpwp(npwp, editForm.country || "ID");
      if (Number(result?.status) !== 1 || !result?.data) {
        throw new Error(result?.message || "NPWP tidak dapat diverifikasi.");
      }

      const data = result.data;
      const taxpayerName = data.company_name || data.nama || null;
      setNpwpVerification({
        state: "valid",
        message: result.message || "NPWP berhasil diverifikasi melalui Pajak Express.",
        taxpayerName,
      });
      setEditForm((current: any) => ({
        ...current,
        tax_id: npwp,
        name: current.name || taxpayerName || "",
        address: current.address || data.alamat || "",
        city: current.city || data.city || "",
        regency: current.regency || data.regency || "",
        provincy_country: current.provincy_country || data.provincy_country || "",
        zip_code: current.zip_code || data.zip_code || "",
      }));
    } catch (error: any) {
      setNpwpVerification({
        state: "invalid",
        message: error?.message || "NPWP tidak dapat diverifikasi saat ini.",
        taxpayerName: null,
      });
    }
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setUpdatingCompany(true);
    setUpdateError(null);
    try {
      // Serialize hq_addresses as JSON string for backend compatibility
      const payload = {
        ...editForm,
        hq_addresses: Array.isArray(editForm.hq_addresses)
          ? editForm.hq_addresses.filter((a: string) => a.trim() !== "")
          : [],
      };
      const res = await updateCompany(company.id, payload);
      const updated = res.company || res;
      syncActiveCompany(updated);
      setIsEditing(false);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update company info.");
    } finally {
      setUpdatingCompany(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const res = await inviteUser({
        company_id: company.id,
        email: inviteForm.email,
        role: inviteForm.role,
      });
      setInviteSuccess(res.message || `Undangan berhasil dikirim ke email ${inviteForm.email}!`);
      setInviteForm({ email: "", role: "" });
      fetchTeamMembers(company.id);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  /**
   * Mengupdate HQ Addresses array secara dinamis
   */
  const updateHqAddress = useCallback((index: number, value: string) => {
    setEditForm((prev: { hq_addresses: any; }) => {
      const newAddresses = [...(prev.hq_addresses || [""])];
      newAddresses[index] = value;
      return { ...prev, hq_addresses: newAddresses };
    });
  }, []);

  /**
   * Menambah HQ Address baru
   */
  const addHqAddress = useCallback(() => {
    setEditForm((prev: { hq_addresses: any; }) => ({
      ...prev,
      hq_addresses: [...(prev.hq_addresses || [""]), ""]
    }));
  }, []);

  /**
   * Menghapus HQ Address
   */
  const removeHqAddress = useCallback((index: number) => {
    setEditForm((prev: { hq_addresses: any; }) => ({
      ...prev,
      hq_addresses: (prev.hq_addresses || [""]).filter((_: any, i: number) => i !== index)
    }));
  }, []);

  /**
   * Mengunggah dokumen legalitas perusahaan baru
   */
  const handleUploadDocument = async (file: File, type: string) => {
    if (!company?.id) return;
    setDocUploading(true);
    setDocError(null);
    setDocSuccess(null);
    try {
      const fd = new FormData();
      fd.append("document", file);
      fd.append("company_id", String(company.id));
      fd.append("type", type);
      const res = await uploadCompanyDocument(fd);
      const uploadedDoc = res.document || {
        id: res.id || Date.now().toString(),
        name: file.name,
        type: type,
        file_path: res.file_path,
        url: res.url,
      };

      const updatedDocs = [...(company.documents || []), uploadedDoc];
      const updatedCompany = {
        ...company,
        documents: updatedDocs,
        status: company.status === "starter" ? "pending" : company.status,
        verification_tier: company.status === "starter" ? "standard" : company.verification_tier,
      };

      setCompany(updatedCompany);
      localStorage.setItem("active_company", JSON.stringify(updatedCompany));
      setDocSuccess(`Dokumen ${type} berhasil diunggah.`);
      setTimeout(() => setDocSuccess(null), 3500);
    } catch (err: any) {
      console.error("Failed to upload document", err);
      setDocError(err.message || "Gagal mengunggah dokumen.");
    } finally {
      setDocUploading(false);
    }
  };

  /**
   * Menghapus dokumen legalitas perusahaan
   */
  const handleDeleteDocument = async (docId: string | number) => {
    if (!company?.id) return;
    setDocDeletingId(docId);
    setDocError(null);
    try {
      await deleteCompanyDocument(company.id, docId);
      const updatedDocs = (company.documents || []).filter((d: any) => d.id !== docId);
      const updatedCompany = {
        ...company,
        documents: updatedDocs,
      };
      setCompany(updatedCompany);
      localStorage.setItem("active_company", JSON.stringify(updatedCompany));
    } catch (err: any) {
      console.error("Failed to delete document", err);
      setDocError(err.message || "Gagal menghapus dokumen.");
    } finally {
      setDocDeletingId(null);
    }
  };

  return {
    navigate,
    activeTab, setActiveTab,
    user, company, loading, refreshing,
    companies, companyCapacity, selectedWorkspace, showCompanyWorkspace, setShowCompanyWorkspace, companyListLoading,
    isEditing, setIsEditing, editForm, setEditForm, updateError, updatingCompany, handleSaveCompany,
    npwpVerification, handleVerifyNpwp, clearNpwpVerification,
    logoUploading, logoError, logoInputRef, handleLogoUpload,
    docUploading, docDeletingId, docError, docSuccess, handleUploadDocument, handleDeleteDocument,
    teamMembers, teamLoading, isInviting, inviteForm, setInviteForm, handleInviteUser, inviteError, inviteSuccess,
    fetchTeamMembers, // Export for role change callback
    updateHqAddress, addHqAddress, removeHqAddress,
    openCompanyWorkspace: (workspace: any) => {
      setShowCompanyWorkspace(true);
      setSelectedWorkspace(workspace);
      syncActiveCompany(workspace);
    }
  };
};
