import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  MessageSquareCode,
  Camera,
  User,
  CreditCard,
  Phone,
  CalendarDays,
  Globe,
  MapPin,
  Home,
  Hash,
  Save,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  sendOtp,
  verifyOtp,
  updateWhatsapp,
  loadOtpSession,
  clearOtpSession,
  getProfile,
  updateUserProfile,
} from "../../../lib/api";
import { useLanguage } from "../../../context/LanguageContext";

interface AccountProfileTabProps {
  user: any;
  onUserUpdate: (updatedUser: any) => void;
  onError: (msg: string | null) => void;
  onSuccess: (msg: string | null) => void;
}

const FIELD_CLASS =
  "w-full px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none focus:border-orange-400/80 transition-colors";

const LABEL_CLASS =
  "text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wider flex items-center gap-1.5";

function FieldRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.FC<any>;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div className="sm:w-1/3 pt-0.5">
        <label className={LABEL_CLASS}>
          <Icon size={13} />
          {label}
        </label>
      </div>
      <div className="sm:w-2/3">{children}</div>
    </div>
  );
}

export function AccountProfileTab({
  user,
  onUserUpdate,
  onError,
  onSuccess,
}: AccountProfileTabProps) {
  const { t } = useLanguage();

  // WhatsApp OTP states
  const [loading, setLoading] = useState(false);
  const [newWhatsapp, setNewWhatsapp] = useState(user?.whatsapp || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [canonicalWhatsapp, setCanonicalWhatsapp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Profile form states
  const [saving, setSaving] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    nik: "",
    npwp: "",
    phone: "",
    birth_place: "",
    birth_date: "",
    country: "Indonesia",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    full_address: "",
  });

  const [userRole, setUserRole] = useState<string>(user?.role || "");
  const [userRoles, setUserRoles] = useState<any[]>(user?.roles || []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load full profile from API on mount
  useEffect(() => {
    getProfile()
      .then((res) => {
        const u = res.user;
        setForm({
          name: u.name || "",
          email: u.email || "",
          nik: u.nik || "",
          npwp: u.npwp || "",
          phone: u.phone || "",
          birth_place: u.birth_place || "",
          birth_date: u.birth_date || "",
          country: u.country || "Indonesia",
          province: u.province || "",
          city: u.city || "",
          district: u.district || "",
          postal_code: u.postal_code || "",
          full_address: u.full_address || "",
        });
        if (u.role) setUserRole(u.role);
        if (u.roles) setUserRoles(u.roles);
        if (u.profile_photo_url) setPhotoPreview(u.profile_photo_url);
        setNewWhatsapp(u.whatsapp || "");
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const setF = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onError("Ukuran foto maks. 5MB.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    onError(null);
    onSuccess(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, v);
      });
      if (photoFile) fd.append("profile_photo", photoFile);

      const res = await updateUserProfile(fd);
      const updatedUser = { ...user, ...res.user };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);
      if (res.user?.profile_photo_url) setPhotoPreview(res.user.profile_photo_url);
      if (res.user?.role) setUserRole(res.user.role);
      if (res.user?.roles) setUserRoles(res.user.roles);
      setPhotoFile(null);
      onSuccess("Profil berhasil disimpan.");
    } catch (err: any) {
      onError(err.message || "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  // WhatsApp OTP handlers
  const handleSendOtp = async () => {
    if (sendingOtp || (resendCooldown > 0 && otpSent)) return;
    if (!newWhatsapp) { onError("Masukkan nomor WhatsApp."); return; }
    setSendingOtp(true);
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const res = await sendOtp({ whatsapp: newWhatsapp });
      setOtpSent(true);
      setCanonicalWhatsapp(res.whatsapp || newWhatsapp);
      setOtpToken(res.otp_token || "");
      setResendCooldown(60);
      onSuccess(t("settings.profile.otpSentSuccess"));
      if (res.otp) setDebugOtp(String(res.otp));
    } catch (err: any) {
      onError(err.message);
    } finally {
      setSendingOtp(false);
      setLoading(false);
    }
  };

  const handleUpdateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { onError(t("settings.profile.otpLengthError")); return; }
    setLoading(true);
    onError(null);
    onSuccess(null);
    try {
      const session = loadOtpSession();
      const phone = session?.whatsapp || canonicalWhatsapp || newWhatsapp;
      await verifyOtp({ whatsapp: phone, otp, otp_token: otpToken || session?.otp_token });
      clearOtpSession();
      const data = await updateWhatsapp({ whatsapp: phone });
      const updatedUser = { ...user, whatsapp: data.user?.whatsapp || phone };
      localStorage.setItem("user_session", JSON.stringify(updatedUser));
      onUserUpdate(updatedUser);
      onSuccess(t("settings.profile.updateSuccess"));
      setOtpSent(false); setOtp(""); setCanonicalWhatsapp(""); setOtpToken(""); clearOtpSession(); setDebugOtp(null);
    } catch (err: any) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avatarDisplay = photoPreview || user?.avatar || null;
  const initials = (form.name || user?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const formatRoleLabel = (slug: string) => {
    switch (slug) {
      case "buyer":
        return "Buyer Representative";
      case "vendor":
        return "Vendor Representative";
      case "manager":
        return "Company Manager";
      case "admin":
        return "Administrator";
      case "super-admin":
        return "Super Administrator";
      case "finance":
        return "Finance";
      case "staff":
        return "Staff";
      case "warehouse_admin":
        return "Warehouse Admin";
      default:
        return slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Member";
    }
  };

  if (!profileLoaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-[var(--ui-text-primary)] m-0">
          Kelola Profil Pengguna
        </h2>
        <p className="text-sm text-[var(--ui-text-muted)] mt-1">
          Kelola informasi identitas, kontak, alamat, dan foto akun Anda.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* ── Photo + Name & Role ─────────────────────────────── */}
        <section className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <div className="p-4 px-5 flex items-center gap-5">
            <div className="relative shrink-0 group">
              {avatarDisplay ? (
                <img
                  src={avatarDisplay}
                  alt="Foto profil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-[var(--ui-border)] shadow"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-[var(--ui-border)] flex items-center justify-center text-xl font-bold text-orange-500 shadow">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Ganti foto"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--ui-text-primary)]">
                Foto Profil
              </p>
              <p className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                Format JPG, PNG, atau WebP (Maks 5 MB).
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs font-semibold text-orange-500 hover:underline cursor-pointer"
                >
                  Pilih Foto Baru
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoFile(null);
                    }}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Role Badge */}
          <FieldRow label="Role Akses" icon={ShieldCheck}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <ShieldCheck size={13} />
                {formatRoleLabel(userRole)}
              </span>
              {userRoles.length > 1 &&
                userRoles
                  .filter((r) => r.slug !== userRole)
                  .map((r) => (
                    <span
                      key={r.id || r.slug}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--ui-bg-card)] text-[var(--ui-text-muted)] border border-[var(--ui-border)]"
                    >
                      {r.name || r.slug}
                    </span>
                  ))}
            </div>
            <p className="text-[11px] text-[var(--ui-text-muted)] mt-1.5">
              Role ditetapkan oleh sistem dan administrator perusahaan Anda.
            </p>
          </FieldRow>

          {/* Full Name */}
          <FieldRow label="Nama Lengkap" icon={User}>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setF("name", e.target.value)}
              placeholder="contoh: Budi Santoso"
              className={FIELD_CLASS}
            />
          </FieldRow>
        </section>

        {/* ── Identitas & Kontak ─────────────────────────────── */}
        <section className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <div className="px-5 py-3 bg-[var(--ui-bg-card)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Identitas & Kontak
            </h3>
          </div>

          <FieldRow label="Email" icon={Mail}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setF("email", e.target.value)}
              placeholder="nama@perusahaan.com"
              className={FIELD_CLASS}
            />
            <p className="text-[11px] text-[var(--ui-text-muted)] mt-1">
              Digunakan untuk notifikasi transaksi, PR, RFQ, dan pemulihan akun.
            </p>
          </FieldRow>

          <FieldRow label="NIK (KTP)" icon={CreditCard}>
            <input
              type="text"
              maxLength={16}
              value={form.nik}
              onChange={(e) => setF("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder="16 digit Nomor Induk Kependudukan"
              className={FIELD_CLASS}
            />
            <p className="text-[11px] text-[var(--ui-text-muted)] mt-1">
              Nomor Induk Kependudukan resmi 16 digit sesuai e-KTP.
            </p>
          </FieldRow>

          <FieldRow label="NPWP (Opsional)" icon={Hash}>
            <input
              type="text"
              maxLength={25}
              value={form.npwp}
              onChange={(e) => setF("npwp", e.target.value)}
              placeholder="contoh: 00.000.000.0-000.000"
              className={FIELD_CLASS}
            />
            <p className="text-[11px] text-[var(--ui-text-muted)] mt-1">
              NPWP pribadi jika diperlukan untuk faktur pajak dan transaksi.
            </p>
          </FieldRow>

          <FieldRow label="No. Telepon" icon={Phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setF("phone", e.target.value)}
              placeholder="contoh: 081234567890"
              className={FIELD_CLASS}
            />
          </FieldRow>
        </section>

        {/* ── Data Pribadi ─────────────────────────────────── */}
        <section className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <div className="px-5 py-3 bg-[var(--ui-bg-card)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Data Pribadi
            </h3>
          </div>

          <FieldRow label="Tempat & Tanggal Lahir" icon={CalendarDays}>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={form.birth_place}
                onChange={(e) => setF("birth_place", e.target.value)}
                placeholder="Tempat lahir (contoh: Jakarta)"
                className={`${FIELD_CLASS} flex-1`}
              />
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setF("birth_date", e.target.value)}
                className={`${FIELD_CLASS} sm:w-44`}
              />
            </div>
          </FieldRow>
        </section>

        {/* ── Alamat & Domisili ──────────────────────────────── */}
        <section className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <div className="px-5 py-3 bg-[var(--ui-bg-card)]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)]">
              Domisili & Alamat
            </h3>
          </div>

          <FieldRow label="Negara" icon={Globe}>
            <input
              type="text"
              value={form.country}
              onChange={(e) => setF("country", e.target.value)}
              placeholder="Indonesia"
              className={FIELD_CLASS}
            />
          </FieldRow>

          <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="sm:w-1/3 pt-0.5">
              <label className={LABEL_CLASS}>
                <MapPin size={13} />
                Wilayah Domisili
              </label>
            </div>
            <div className="sm:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-[var(--ui-text-muted)] block mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => setF("province", e.target.value)}
                  placeholder="contoh: Jawa Barat"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--ui-text-muted)] block mb-1">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setF("city", e.target.value)}
                  placeholder="contoh: Bandung"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--ui-text-muted)] block mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setF("district", e.target.value)}
                  placeholder="contoh: Coblong"
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--ui-text-muted)] block mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={form.postal_code}
                  onChange={(e) => setF("postal_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
                  placeholder="contoh: 40132"
                  className={FIELD_CLASS}
                />
              </div>
            </div>
          </div>

          <FieldRow label="Alamat Lengkap" icon={Home}>
            <textarea
              rows={3}
              value={form.full_address}
              onChange={(e) => setF("full_address", e.target.value)}
              placeholder="Jl. Nama Jalan No. XX, RT 01/RW 02, Kelurahan..."
              className={`${FIELD_CLASS} resize-none`}
            />
          </FieldRow>
        </section>

        {/* ── Save Action ──────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            style={{ color: "white" }}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm shadow-orange-500/20"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </div>
      </form>

      {/* ── WhatsApp Section ─────────────────────────────── */}
      <div className="space-y-2.5 pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text-muted)] px-1">
          {t("settings.profile.contactInfo")}
        </span>
        <div className="border border-[var(--ui-border)] rounded-xl overflow-hidden bg-[var(--ui-bg-input)] divide-y divide-[var(--ui-border)]">
          <form onSubmit={handleUpdateWhatsapp}>
            <div className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="sm:w-1/3">
                <div className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  {t("settings.profile.whatsappNumber")}
                </div>
                <div className="text-xs text-[var(--ui-text-muted)] mt-0.5">
                  {t("settings.profile.whatsappNumberDesc")}
                </div>
              </div>
              <div className="sm:w-2/3 flex gap-2">
                <input
                  type="tel"
                  placeholder={t("settings.profile.whatsappPlaceholder")}
                  value={newWhatsapp}
                  onChange={(e) => {
                    setNewWhatsapp(e.target.value);
                    if (otpSent) { setOtpSent(false); setCanonicalWhatsapp(""); setOtpToken(""); clearOtpSession(); }
                  }}
                  required
                  disabled={otpSent}
                  className="flex-1 px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-card)] border border-[var(--ui-border-input)] text-[var(--ui-text-primary)] text-sm outline-none disabled:opacity-50"
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading || newWhatsapp === user?.whatsapp}
                    style={{ color: "white" }}
                    className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm disabled:opacity-50 transition-all flex-shrink-0 cursor-pointer"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.profile.verifyBtn")}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="p-5 bg-[var(--ui-bg-card)] space-y-4">
                <label className="text-xs font-semibold text-orange-400 flex items-center gap-2">
                  <MessageSquareCode size={16} /> {t("settings.profile.enterOtpLabel")}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder={t("settings.profile.otpPlaceholder")}
                  required
                  maxLength={6}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-lg bg-[var(--ui-bg-input)] border border-[var(--ui-border-input)] text-sm outline-none"
                />
                {debugOtp && <div className="text-xs text-emerald-400 font-semibold">Debug OTP: {debugOtp}</div>}
                <div className="flex items-center gap-3">
                  <button type="submit" disabled={loading} style={{ color: "white" }} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm cursor-pointer">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : t("settings.profile.confirmUpdateBtn")}
                  </button>
                  <button type="button" onClick={() => setOtpSent(false)} className="text-sm text-[var(--ui-text-muted)] hover:text-[var(--ui-text-primary)] hover:underline font-semibold cursor-pointer">
                    {t("settings.profile.cancelBtn")}
                  </button>
                  {resendCooldown > 0 && (
                    <span className="text-xs text-[var(--ui-text-muted)]">Kirim ulang dalam {resendCooldown}d</span>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
