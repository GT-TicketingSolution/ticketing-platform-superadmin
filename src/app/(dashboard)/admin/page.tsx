"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  Building,
  Globe,
  Phone,
  Mail,
  MapPin,
  History,
  Filter,
  Building2,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { INITIAL_ADMINS, AdminUser } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmDelete, confirmAdd } from "@/lib/notify";
import { addAdminSchema, AddAdminFormData } from "./schema";
import { DataTable, Column } from "@/components/ui/DataTable";
import { META_CONSTANTS } from "@/lib/metaConstant";

// ─── Field-level error helper ──────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      style={{
        fontSize: "12px",
        color: colors.status.error,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        marginTop: "4px",
        fontFamily: typography.fontFamily.sans,
      }}
    >
      <AlertCircle size={12} />
      {message}
    </span>
  );
}

// ─── Styled input helper ───────────────────────────────────────────────────────
const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  height: "40px",
  border: `1.5px solid ${hasError ? colors.status.error : colors.login.inputBorder}`,
  borderRadius: "8px",
  padding: "0 12px",
  marginTop: "4px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: typography.fontFamily.sans,
  transition: "border-color 0.18s",
});

// ─── All available module roles (matching sidebar) ────────────────────────────
const ALL_ROLES: string[] = [
  "Ticket Booking",
  "Bookings",
  "Transactions",
  "Invoices",
  "Inventory / Capacity",
  "CCTV Monitoring",
  "Attraction Management",
  "Customer Management",
  "Complimentary Passes",
  "Reports",
  "User Management",
  "Settings",
  "Backup",
];

// ─── Date calculation helpers ───────────────────────────────────────────────
const getTodayDateStr = () => new Date().toISOString().slice(0, 10);

const calculateNextRenewalDate = (startDateStr: string) => {
  if (!startDateStr) return "";
  const [y, m, d] = startDateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dateObj = new Date(y, m - 1, d);
  dateObj.setFullYear(dateObj.getFullYear() + 1);
  const rY = dateObj.getFullYear();
  const rM = String(dateObj.getMonth() + 1).padStart(2, "0");
  const rD = String(dateObj.getDate()).padStart(2, "0");
  return `${rY}-${rM}-${rD}`;
};

interface RenewalHistoryItem {
  id: string;
  count: number;
  date: string;
  amount: number;
}

const getRenewalHistory = (
  joinedDateStr: string,
  nextRenewalStr?: string,
  amount: number = 0
): RenewalHistoryItem[] => {
  if (!joinedDateStr) return [];
  const [jY, jM, jD] = joinedDateStr.split("-").map(Number);
  if (!jY || !jM || !jD) return [];

  let endYear = new Date().getFullYear();
  if (nextRenewalStr) {
    const [nY] = nextRenewalStr.split("-").map(Number);
    if (nY) endYear = nY - 1;
  }

  const history: RenewalHistoryItem[] = [];
  let currentYear = jY + 1;
  let count = 1;

  while (currentYear <= endYear) {
    const dateObj = new Date(currentYear, jM - 1, jD);
    const rY = dateObj.getFullYear();
    const rM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const rD = String(dateObj.getDate()).padStart(2, "0");
    history.push({
      id: `REN-HIST-${count}`,
      count: count++,
      date: `${rY}-${rM}-${rD}`,
      amount: amount,
    });
    currentYear++;
  }

  return history;
};

export default function AdminPage() {
  useEffect(() => {
    document.title = META_CONSTANTS.admin.fullTitle;
  }, []);

  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("All");

  // Modals / View state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ── react-hook-form for Add Admin ──────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "Jaipur",
      subDomain: "",
      renewalAmount: 50000,
      rolesAccess: [],
    },
  });

  // Watch rolesAccess for real-time checkbox state in the Add modal
  const watchedRoles = useWatch({ control, name: "rolesAccess", defaultValue: [] });

  // Filtered Admins by search and city
  const filteredAdmins = admins.filter((a) => {
    const matchesCity = selectedCityFilter === "All" || a.city === selectedCityFilter;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.subDomain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCity && matchesSearch;
  });

  // ── Handle Add Admin ───────────────────────────────────────────────────────
  const onAddSubmit = async (data: AddAdminFormData) => {
    setIsAddModalOpen(false);

    const confirmed = await confirmAdd(`admin "${data.name}"`);

    if (!confirmed) {
      setIsAddModalOpen(true);
      return;
    }

    const joined = data.joinedDate || getTodayDateStr();
    const nextRenewal = data.nextRenewalDate || calculateNextRenewalDate(joined);

    const created: AdminUser = {
      id: `ADM-00${admins.length + 1}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      joinedDate: joined,
      lastRenewalDate: joined,
      nextRenewalDate: nextRenewal,
      subDomain:
        data.subDomain ||
        `${data.name.toLowerCase().replace(/\s+/g, "")}.ticketing.com`,
      renewalAmount: data.renewalAmount,
      city: data.city,
      rolesAccess: data.rolesAccess,
      status: "Active",
    };

    setAdmins([created, ...admins]);
    reset();
    showToast(`Admin "${created.name}" added successfully!`, "success");
  };

  // ── Handle Edit Admin ──────────────────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!selectedAdmin) return;
    setAdmins(admins.map((a) => (a.id === selectedAdmin.id ? selectedAdmin : a)));
    setIsEditing(false);
    showToast(`Admin "${selectedAdmin.name}" updated successfully!`, "success");
  };

  // ── Handle Delete Admin ────────────────────────────────────────────────────
  const handleDeleteAdmin = async (id: string) => {
    const target = admins.find((a) => a.id === id);
    const prevAdmin = selectedAdmin;

    setSelectedAdmin(null);

    const confirmed = await confirmDelete(`admin "${target?.name ?? id}"`);

    if (!confirmed) {
      setSelectedAdmin(prevAdmin);
      return;
    }

    setAdmins(admins.filter((a) => a.id !== id));
    showToast(`Admin "${target?.name ?? id}" has been deleted.`, "error");
  };

  // ── DataTable Columns Configuration ───────────────────────────────────────
  const columns: Column<AdminUser>[] = [
    {
      header: "Name",
      cell: (admin) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: colors.sidebar.bg,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {admin.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{admin.name}</div>
            <div style={{ fontSize: "12px", color: colors.brand.accent }}>
              {admin.city}
            </div>
          </div>
        </div>
      ),
    },
    { header: "Number", accessorKey: "phone" },
    { header: "Email", accessorKey: "email" },
    { header: "Joined Date", accessorKey: "joinedDate" },
    { header: "Last Renewal", accessorKey: "lastRenewalDate" },
    {
      header: "Next Renewal",
      cell: (admin) => (
        <span style={{ fontWeight: 600, color: colors.text.primary }}>
          {admin.nextRenewalDate}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (admin) => (
        <button
          onClick={() => {
            setSelectedAdmin(admin);
            setIsEditing(false);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(35, 114, 165, 0.1)",
            color: colors.brand.accent,
            border: `1px solid ${colors.brand.accent}`,
            borderRadius: "6px",
            padding: "6px 12px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: typography.fontFamily.sans,
          }}
        >
          <Eye size={15} />
          <span>View</span>
        </button>
      ),
    },
  ];

  // ── Render Full Admin Details Page View when an admin is selected ─────────
  if (selectedAdmin) {
    const pastRenewals = getRenewalHistory(
      selectedAdmin.joinedDate,
      selectedAdmin.nextRenewalDate,
      selectedAdmin.renewalAmount
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Top Navigation & Action Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            background: "#FFFFFF",
            padding: "18px 24px",
            borderRadius: "16px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => {
                setSelectedAdmin(null);
                setIsEditing(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: colors.bg.page,
                color: colors.text.primary,
                border: `1px solid ${colors.header.border}`,
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: typography.fontFamily.sans,
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Admins</span>
            </button>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1
                  style={{
                    fontFamily: typography.fontFamily.sans,
                    fontWeight: typography.fontWeight.bold,
                    fontSize: typography.fontSize["xl"],
                    color: colors.text.primary,
                    margin: 0,
                  }}
                >
                  {selectedAdmin.name}
                </h1>
                <span
                  style={{
                    background: "rgba(35, 114, 165, 0.1)",
                    color: colors.brand.accent,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {selectedAdmin.id}
                </span>
                <span
                  style={{
                    background: "rgba(34, 197, 94, 0.12)",
                    color: colors.status.success,
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {selectedAdmin.status}
                </span>
              </div>
              <p
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontSize: "13px",
                  color: colors.text.muted,
                  margin: "2px 0 0 0",
                }}
              >
                {selectedAdmin.city} • {selectedAdmin.subDomain}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.login.inputBorder}`,
                    background: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: colors.brand.primary,
                    color: colors.sidebar.activeText,
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                    boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
                  }}
                >
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "8px",
                    background: colors.brand.accent,
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  <Edit2 size={16} />
                  <span>Edit Admin</span>
                </button>
                <button
                  onClick={() => handleDeleteAdmin(selectedAdmin.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    borderRadius: "8px",
                    background: "#FEF2F2",
                    color: colors.status.error,
                    border: `1px solid ${colors.status.error}`,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  <Trash2 size={16} />
                  <span>Delete Admin</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Body: Edit Mode Form vs View Details */}
        {isEditing ? (
          /* ── Full Edit Form View ── */
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
              Edit Admin Information
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  value={selectedAdmin.name}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, name: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>City</label>
                <select
                  value={selectedAdmin.city}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, city: e.target.value })}
                  style={{ ...inputStyle(false), background: "#FFFFFF" }}
                >
                  <option value="Jaipur">Jaipur</option>
                  <option value="Udaipur">Udaipur</option>
                  <option value="Jodhpur">Jodhpur</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Mumbai">Mumbai</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Phone Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={selectedAdmin.phone}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  value={selectedAdmin.email}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, email: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Sub-Domain</label>
                <input
                  type="text"
                  value={selectedAdmin.subDomain}
                  onChange={(e) => setSelectedAdmin({ ...selectedAdmin, subDomain: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Renewal Amount (₹)</label>
                <input
                  type="text"
                  value={selectedAdmin.renewalAmount}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      renewalAmount: Number(e.target.value.replace(/\D/g, "")) || 0,
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
            </div>

            {/* Joined Date & Next Renewal Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Joined Date</label>
                <input
                  type="date"
                  value={selectedAdmin.joinedDate || ""}
                  onChange={(e) => {
                    const newJoined = e.target.value;
                    const autoNextRenewal = calculateNextRenewalDate(newJoined);
                    setSelectedAdmin({
                      ...selectedAdmin,
                      joinedDate: newJoined,
                      nextRenewalDate: autoNextRenewal || selectedAdmin.nextRenewalDate,
                    });
                  }}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Next Renewal Date</label>
                <input
                  type="date"
                  value={selectedAdmin.nextRenewalDate || ""}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      nextRenewalDate: e.target.value,
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
            </div>

            {/* Access Roles (checkbox grid) */}
            <div style={{ border: `1.5px solid ${colors.login.inputBorder}`, borderRadius: "10px", overflow: "hidden" }}>
              <div
                style={{
                  background: colors.sidebar.bg,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", fontFamily: typography.fontFamily.sans }}>
                  Access Roles
                </span>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: colors.brand.primary,
                    fontWeight: 600,
                    fontFamily: typography.fontFamily.sans,
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAdmin.rolesAccess.length === ALL_ROLES.length}
                    onChange={(e) =>
                      setSelectedAdmin({
                        ...selectedAdmin,
                        rolesAccess: e.target.checked ? [...ALL_ROLES] : [],
                      })
                    }
                    style={{ accentColor: colors.brand.primary, width: "14px", height: "14px" }}
                  />
                  Select All
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", background: "#FFFFFF" }}>
                {ALL_ROLES.map((role, idx) => {
                  const isChecked = selectedAdmin.rolesAccess.includes(role);
                  return (
                    <label
                      key={role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        borderTop: idx >= 2 ? `1px solid ${colors.header.border}` : undefined,
                        borderRight: idx % 2 === 0 ? `1px solid ${colors.header.border}` : undefined,
                        background: isChecked ? "rgba(35, 114, 165, 0.06)" : "#FFFFFF",
                        transition: "background 0.15s",
                        userSelect: "none",
                        fontFamily: typography.fontFamily.sans,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...selectedAdmin.rolesAccess, role]
                            : selectedAdmin.rolesAccess.filter((r) => r !== role);
                          setSelectedAdmin({ ...selectedAdmin, rolesAccess: updated });
                        }}
                        style={{ accentColor: colors.brand.accent, width: "14px", height: "14px", flexShrink: 0 }}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked ? colors.brand.accent : colors.text.primary,
                        }}
                      >
                        {role}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div style={{ padding: "8px 16px", background: "#F8FAFC", borderTop: `1px solid ${colors.header.border}`, fontSize: "12px", color: colors.text.muted }}>
                {selectedAdmin.rolesAccess.length} of {ALL_ROLES.length} roles selected
              </div>
            </div>
          </div>
        ) : (
          /* ── Full Details View (Read Only Cards Layout) ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Grid of info cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Contact Info Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: `1px solid ${colors.header.border}` }}>
                  <Building size={18} color={colors.brand.accent} />
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                    Admin Contact Details
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={12} /> Phone Number
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block" }}>{selectedAdmin.phone}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} /> Email Address
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block" }}>{selectedAdmin.email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} /> City Location
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block", color: colors.brand.accent }}>
                      {selectedAdmin.city}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "block" }}>Account Status</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.status.success }}>
                      {selectedAdmin.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Domain & Renewal Info Card */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: `1px solid ${colors.header.border}` }}>
                  <Globe size={18} color={colors.brand.accent} />
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                    Domain & Renewal Information
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "block" }}>Sub-domain</span>
                    <strong style={{ fontSize: "14px", color: colors.brand.accent, marginTop: "2px", display: "block" }}>
                      {selectedAdmin.subDomain}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "block" }}>Renewal Amount</span>
                    <strong style={{ fontSize: "14px", color: colors.text.primary, marginTop: "2px", display: "block" }}>
                      ₹{selectedAdmin.renewalAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> Joined Date
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px", display: "block" }}>
                      {selectedAdmin.joinedDate}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> Next Renewal Date
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: colors.brand.accent, marginTop: "2px", display: "block" }}>
                      {selectedAdmin.nextRenewalDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Past Renewal History Log Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "12px", borderBottom: `1px solid ${colors.header.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <History size={18} color={colors.brand.accent} />
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                    Past Renewals History Log ({pastRenewals.length})
                  </h3>
                </div>
                <span style={{ fontSize: "12px", color: colors.text.muted, fontFamily: typography.fontFamily.sans }}>
                  Annual cycle starting from {selectedAdmin.joinedDate}
                </span>
              </div>

              <DataTable
                columns={[
                  {
                    header: "Renewal Cycle",
                    cell: (item) => (
                      <span style={{ fontWeight: 700, color: colors.brand.accent }}>
                        Renewal #{item.count}
                      </span>
                    ),
                  },
                  {
                    header: "Renewal Date",
                    accessorKey: "date",
                  },
                  {
                    header: "Amount Paid",
                    cell: (item) => (
                      <span style={{ fontWeight: 600, color: colors.text.primary }}>
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    ),
                  },
                  {
                    header: "Status",
                    align: "right",
                    cell: () => (
                      <span
                        style={{
                          background: "rgba(34, 197, 94, 0.12)",
                          color: colors.status.success,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        Completed
                      </span>
                    ),
                  },
                ]}
                data={pastRenewals.slice().reverse()}
                keyExtractor={(item) => item.id}
                pageSize={4}
                emptyMessage="No past renewals recorded (New registration)."
              />
            </div>

            {/* Assigned Access Roles Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "12px", borderBottom: `1px solid ${colors.header.border}` }}>
                <ShieldCheck size={18} color={colors.brand.accent} />
                <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                  Assigned Module Access Roles ({selectedAdmin.rolesAccess.length})
                </h3>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {selectedAdmin.rolesAccess.map((role) => (
                  <span
                    key={role}
                    style={{
                      background: "rgba(35, 114, 165, 0.1)",
                      color: colors.brand.accent,
                      border: `1px solid rgba(35, 114, 165, 0.25)`,
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: 600,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render Admins Table List View when no admin is selected ────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Bar Header & Add Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: typography.fontFamily.sans,
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize["2xl"],
              color: colors.text.primary,
              margin: 0,
            }}
          >
            Admins ({admins.length})
          </h1>
          <p
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: "14px",
              color: colors.text.muted,
              margin: "4px 0 0 0",
            }}
          >
            Manage platform admins — their domains, permissions, and renewal details.
          </p>
        </div>

        {/* Add Admin Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: colors.brand.primary,
            color: colors.sidebar.activeText,
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontFamily: typography.fontFamily.sans,
            fontWeight: typography.fontWeight.bold,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(244, 188, 67, 0.3)",
          }}
        >
          <UserPlus size={18} />
          <span>Add Admin</span>
        </button>
      </div>

      {/* City Filter & Search Bar */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          padding: "14px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Filter by City (First) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color={colors.brand.accent} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: colors.text.muted, fontFamily: typography.fontFamily.sans }}>
            Filter by City:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Building2 size={16} color={colors.text.muted} />
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              style={{
                height: "38px",
                borderRadius: "8px",
                border: `1px solid ${colors.header.border}`,
                padding: "0 12px",
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.brand.accent,
                outline: "none",
                cursor: "pointer",
                background: "#FFFFFF",
              }}
            >
              <option value="All">All Cities</option>
              <option value="Jaipur">Jaipur</option>
              <option value="Udaipur">Udaipur</option>
              <option value="Jodhpur">Jodhpur</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: colors.bg.page,
            padding: "8px 14px",
            borderRadius: "8px",
            border: `1px solid ${colors.header.border}`,
            flex: 1,
            minWidth: "240px",
          }}
        >
          <Search size={18} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Search admin by name, number, email, domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "14px",
              background: "transparent",
              fontFamily: typography.fontFamily.sans,
              color: colors.text.primary,
            }}
          />
        </div>
      </div>

      {/* ── Reusable DataTable UI (with S.No column & 5 items pagination) ── */}
      <DataTable
        columns={columns}
        data={filteredAdmins}
        keyExtractor={(a) => a.id}
        pageSize={5}
        emptyMessage="No admin records found."
      />

      {/* ── Add Admin Modal ── */}
      {isAddModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(1, 27, 47, 0.65)",
            backdropFilter: "blur(4px)",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                background: colors.sidebar.bg,
                color: "#FFFFFF",
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans }}>
                Add New Admin
              </h2>
              <button
                onClick={() => { setIsAddModalOpen(false); reset(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#FFFFFF" }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onAddSubmit)}
              style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "70vh", overflowY: "auto" }}
            >
              {/* Full Name */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Full Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  {...register("name")}
                  style={inputStyle(!!errors.name)}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Phone */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Phone Number <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543210"
                    {...register("phone")}
                    onInput={(e) => {
                      const val = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                      e.currentTarget.value = val;
                      setValue("phone", val);
                    }}
                    style={inputStyle(!!errors.phone)}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>

                {/* City */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    City <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    {...register("city")}
                    style={{ ...inputStyle(!!errors.city), background: "#FFFFFF" }}
                  >
                    <option value="Jaipur">Jaipur</option>
                    <option value="Udaipur">Udaipur</option>
                    <option value="Jodhpur">Jodhpur</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                  <FieldError message={errors.city?.message} />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Email Address <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@business.com"
                  {...register("email")}
                  style={inputStyle(!!errors.email)}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Sub-domain */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Sub-domain
                  </label>
                  <input
                    type="text"
                    placeholder="domain.ticketing.com"
                    {...register("subDomain")}
                    style={inputStyle(!!errors.subDomain)}
                  />
                  <FieldError message={errors.subDomain?.message} />
                </div>

                {/* Renewal Amount */}
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Renewal Amount (₹) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="50000"
                    {...register("renewalAmount", { valueAsNumber: true })}
                    onInput={(e) => {
                      const val = e.currentTarget.value.replace(/\D/g, "");
                      e.currentTarget.value = val;
                      setValue("renewalAmount", Number(val) || 0);
                    }}
                    style={inputStyle(!!errors.renewalAmount)}
                  />
                  <FieldError message={errors.renewalAmount?.message} />
                </div>
              </div>

              {/* Joined Date & Next Renewal Date (Auto-filled & Read-Only during creation) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Joined Date <span style={{ fontSize: "11px", color: colors.text.muted, fontWeight: 400 }}>(Auto-filled)</span>
                  </label>
                  <input
                    type="date"
                    value={getTodayDateStr()}
                    disabled
                    readOnly
                    style={{
                      ...inputStyle(false),
                      background: "#F1F5F9",
                      color: colors.text.muted,
                      cursor: "not-allowed",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Next Renewal Date <span style={{ fontSize: "11px", color: colors.text.muted, fontWeight: 400 }}>(Auto-calculated)</span>
                  </label>
                  <input
                    type="date"
                    value={calculateNextRenewalDate(getTodayDateStr())}
                    disabled
                    readOnly
                    style={{
                      ...inputStyle(false),
                      background: "#F1F5F9",
                      color: colors.text.muted,
                      cursor: "not-allowed",
                    }}
                  />
                </div>
              </div>

              {/* Access Roles */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Access Roles <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div
                  style={{
                    border: `1.5px solid ${!!errors.rolesAccess ? colors.status.error : colors.login.inputBorder}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                    marginTop: "4px",
                  }}
                >
                  <div
                    style={{
                      background: colors.sidebar.bg,
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", fontFamily: typography.fontFamily.sans }}>
                      Module Access
                    </span>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "11px", color: colors.brand.primary, fontWeight: 600, userSelect: "none" }}>
                      <input
                        type="checkbox"
                        onChange={(e) => setValue("rolesAccess", e.target.checked ? [...ALL_ROLES] : [], { shouldValidate: true })}
                        style={{ accentColor: colors.brand.primary, width: "13px", height: "13px" }}
                      />
                      Select All
                    </label>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#FFFFFF" }}>
                    {ALL_ROLES.map((role, idx) => {
                      const isChecked = (watchedRoles ?? []).includes(role);
                      return (
                        <label
                          key={role}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderTop: idx >= 2 ? `1px solid ${colors.header.border}` : undefined,
                            borderRight: idx % 2 === 0 ? `1px solid ${colors.header.border}` : undefined,
                            background: isChecked ? "rgba(35, 114, 165, 0.06)" : "#FFFFFF",
                            transition: "background 0.15s",
                            userSelect: "none",
                            fontFamily: typography.fontFamily.sans,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = watchedRoles ?? [];
                              const updated = e.target.checked
                                ? [...current, role]
                                : current.filter((r) => r !== role);
                              setValue("rolesAccess", updated, { shouldValidate: true });
                            }}
                            style={{ accentColor: colors.brand.accent, width: "13px", height: "13px", flexShrink: 0 }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: isChecked ? 600 : 400,
                              color: isChecked ? colors.brand.accent : colors.text.primary,
                              transition: "color 0.15s",
                            }}
                          >
                            {role}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <FieldError message={errors.rolesAccess?.message as string | undefined} />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); reset(); }}
                  style={{
                    flex: 1,
                    height: "42px",
                    border: `1px solid ${colors.login.inputBorder}`,
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: "42px",
                    border: "none",
                    borderRadius: "8px",
                    background: colors.brand.primary,
                    color: colors.sidebar.activeText,
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
