"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  X,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ArrowLeft,
  Check,
  Phone,
  Mail,
  MapPin,
  FileText,
  StickyNote,
  Calendar,
  Building2,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { INITIAL_PENDING_REQUESTS, PendingRequest } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmAdd, confirmDelete, confirmStatusChange } from "@/lib/notify";
import { addRequestSchema, AddRequestFormData } from "./schema";
import { DataTable, Column } from "@/components/ui/DataTable";
import { META_CONSTANTS } from "@/lib/metaConstant";

//  Field-level error helper
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

// Styled input helper
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

export default function PendingRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PendingRequest[]>(INITIAL_PENDING_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("All");

  // Read URL query parameter + set page title
  useEffect(() => {
    document.title = META_CONSTANTS.pendingRequests.fullTitle;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam) {
        setSelectedStatusFilter(statusParam);
      }
      const searchParam = params.get("search");
      if (searchParam) {
        setSearchQuery(searchParam);
      }
    }
  }, []);

  // Selected request for details view
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // react-hook-form for Add Request
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddRequestFormData>({
    resolver: zodResolver(addRequestSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      desc: "",
      notes: "",
      status: "Pending",
      city: "Jaipur",
    },
  });

  // Status Badge Rendering Helper
  const renderStatusBadge = (status: PendingRequest["status"]) => {
    let bg: string = "rgba(244, 188, 67, 0.15)";
    let fg: string = colors.brand.primary;
    let icon = <Clock size={14} />;

    if (status === "Accepted") {
      bg = "rgba(34, 197, 94, 0.15)";
      fg = "#16A34A";
      icon = <CheckCircle size={14} />;
    } else if (status === "In-progress") {
      bg = "rgba(35, 114, 165, 0.15)";
      fg = colors.brand.accent;
      icon = <AlertCircle size={14} />;
    } else if (status === "Canceled") {
      bg = "rgba(239, 68, 68, 0.15)";
      fg = "#DC2626";
      icon = <XCircle size={14} />;
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: bg,
          color: fg,
          padding: "4px 12px",
          borderRadius: "20px",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {icon}
        {status}
      </span>
    );
  };

  // Filter requests by status, city, and search
  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      selectedStatusFilter === "All" || req.status === selectedStatusFilter;
    const matchesCity =
      selectedCityFilter === "All" || req.city === selectedCityFilter;
    const matchesSearch =
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.phone.includes(searchQuery) ||
      req.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCity && matchesSearch;
  });

  // Add request with confirm
  const onAddSubmit = async (data: AddRequestFormData) => {
    setIsAddModalOpen(false);
    const confirmed = await confirmAdd(`request from "${data.name}"`);
    if (!confirmed) {
      setIsAddModalOpen(true);
      return;
    }

    const item: PendingRequest = {
      id: `REQ-${100 + requests.length + 1}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      desc: data.desc,
      notes: data.notes || "",
      status: data.status,
      createdDate: new Date().toISOString().slice(0, 10),
      city: data.city,
    };

    setRequests([item, ...requests]);
    reset();
    showToast(`Request from "${item.name}" created successfully!`, "success");
  };

  // Handle status change with confirm
  const handleStatusChange = async (id: string, newStatus: PendingRequest["status"]) => {
    const target = requests.find((r) => r.id === id);
    if (!target) return;

    const confirmed = await confirmStatusChange(target.name, newStatus);
    if (!confirmed) return;

    const updated = requests.map((r) => (r.id === id ? { ...r, status: newStatus } : r));
    setRequests(updated);

    // Also update selectedRequest if open
    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest({ ...selectedRequest, status: newStatus });
    }

    const toastType =
      newStatus === "Accepted" ? "success" : newStatus === "Canceled" ? "error" : "info";

    showToast(`"${target.name}" status updated to ${newStatus}`, toastType);
  };

  // Save edited request
  const handleSaveEdit = () => {
    if (!selectedRequest) return;
    setRequests(requests.map((r) => (r.id === selectedRequest.id ? selectedRequest : r)));
    setIsEditing(false);
    showToast(`Request "${selectedRequest.name}" updated successfully!`, "success");
  };

  // Delete request
  const handleDeleteRequest = async (id: string) => {
    const target = requests.find((r) => r.id === id);
    const prev = selectedRequest;
    setSelectedRequest(null);

    const confirmed = await confirmDelete(`request from "${target?.name ?? id}"`);
    if (!confirmed) {
      setSelectedRequest(prev);
      return;
    }

    setRequests(requests.filter((r) => r.id !== id));
    showToast(`Request from "${target?.name ?? id}" has been deleted.`, "error");
  };

  // ── DataTable Columns ──────────────────────────────────────────────────────
  const columns: Column<PendingRequest>[] = [
    {
      header: "Admin Name",
      cell: (req) => (
        <div>
          <div style={{ fontWeight: 600 }}>{req.name}</div>
          <div style={{ fontSize: "12px", color: colors.brand.accent, fontWeight: 500 }}>
            {req.city}
          </div>
        </div>
      ),
    },
    { header: "Number", accessorKey: "phone" },
    { header: "Email", accessorKey: "email" },
    {
      header: "Description",
      cell: (req) => (
        <span style={{ maxWidth: "200px", display: "inline-block", fontSize: "13px" }}>
          {req.desc}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (req) => renderStatusBadge(req.status),
    },
    {
      header: "Action",
      align: "right",
      cell: (req) => (
        <button
          onClick={() => {
            setSelectedRequest(req);
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

  // ── Full Details Page when a request is selected ───────────────────────────
  if (selectedRequest) {
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
              onClick={() => { setSelectedRequest(null); setIsEditing(false); }}
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
              <span>Back to Requests</span>
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
                  {selectedRequest.name}
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
                  {selectedRequest.id}
                </span>
                {renderStatusBadge(selectedRequest.status)}
              </div>
              <p
                style={{
                  fontFamily: typography.fontFamily.sans,
                  fontSize: "13px",
                  color: colors.text.muted,
                  margin: "2px 0 0 0",
                }}
              >
                {selectedRequest.city} • Created on {selectedRequest.createdDate}
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
                  <span>Edit Request</span>
                </button>
                <button
                  onClick={() => handleDeleteRequest(selectedRequest.id)}
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
                  <span>Delete Request</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content: Edit Mode vs View Mode */}
        {isEditing ? (
          /* ── Edit Form ── */
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
              Edit Request Information
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Admin Name</label>
                <input
                  type="text"
                  value={selectedRequest.name}
                  onChange={(e) => setSelectedRequest({ ...selectedRequest, name: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>City</label>
                <select
                  value={selectedRequest.city}
                  onChange={(e) => setSelectedRequest({ ...selectedRequest, city: e.target.value })}
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
                  value={selectedRequest.phone}
                  onChange={(e) =>
                    setSelectedRequest({
                      ...selectedRequest,
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
                  value={selectedRequest.email}
                  onChange={(e) => setSelectedRequest({ ...selectedRequest, email: e.target.value })}
                  style={inputStyle(false)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Request Status</label>
              <select
                value={selectedRequest.status}
                onChange={(e) =>
                  setSelectedRequest({
                    ...selectedRequest,
                    status: e.target.value as PendingRequest["status"],
                  })
                }
                style={{ ...inputStyle(false), background: "#FFFFFF" }}
              >
                <option value="Pending">Pending</option>
                <option value="In-progress">In-progress</option>
                <option value="Accepted">Accepted</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Request Description</label>
              <textarea
                rows={3}
                value={selectedRequest.desc}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, desc: e.target.value })}
                style={{
                  width: "100%",
                  border: `1.5px solid ${colors.login.inputBorder}`,
                  borderRadius: "8px",
                  padding: "8px 12px",
                  marginTop: "4px",
                  fontSize: "14px",
                  fontFamily: typography.fontFamily.sans,
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>Internal Notes</label>
              <input
                type="text"
                value={selectedRequest.notes}
                onChange={(e) => setSelectedRequest({ ...selectedRequest, notes: e.target.value })}
                style={inputStyle(false)}
              />
            </div>
          </div>
        ) : (
          /* ── Read Only Detail Cards ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                  <Phone size={18} color={colors.brand.accent} />
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                    Contact Information
                  </h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={12} /> Phone Number
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block" }}>{selectedRequest.phone}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Mail size={12} /> Email Address
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block" }}>{selectedRequest.email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} /> City Location
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block", color: colors.brand.accent }}>
                      {selectedRequest.city}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} /> Created Date
                    </span>
                    <strong style={{ fontSize: "14px", marginTop: "2px", display: "block" }}>{selectedRequest.createdDate}</strong>
                  </div>
                </div>
              </div>

              {/* Status Card */}
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
                  <CheckCircle size={18} color={colors.brand.accent} />
                  <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                    Request Status
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "block", marginBottom: "6px" }}>Current Status</span>
                    {renderStatusBadge(selectedRequest.status)}
                  </div>

                  <div>
                    <span style={{ fontSize: "12px", color: colors.text.muted, display: "block", marginBottom: "6px" }}>Update Status</span>
                    <select
                      value={selectedRequest.status}
                      onChange={(e) =>
                        handleStatusChange(selectedRequest.id, e.target.value as PendingRequest["status"])
                      }
                      style={{
                        height: "38px",
                        borderRadius: "8px",
                        border: `1px solid ${colors.header.border}`,
                        padding: "0 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "#FFFFFF",
                        fontFamily: typography.fontFamily.sans,
                        width: "100%",
                      }}
                    >
                      <option value="Pending">Set Pending</option>
                      <option value="In-progress">Set In-progress</option>
                      <option value="Accepted">Set Accepted</option>
                      <option value="Canceled">Set Canceled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
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
                <FileText size={18} color={colors.brand.accent} />
                <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                  Request Description
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: colors.text.primary, lineHeight: "1.7", fontFamily: typography.fontFamily.sans }}>
                {selectedRequest.desc}
              </p>
            </div>

            {/* Notes Card */}
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
                <StickyNote size={18} color={colors.brand.accent} />
                <h3 style={{ fontSize: "15px", margin: 0, fontWeight: 700, fontFamily: typography.fontFamily.sans, color: colors.text.primary }}>
                  Internal Notes
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: selectedRequest.notes ? colors.text.primary : colors.text.muted, lineHeight: "1.7", fontFamily: typography.fontFamily.sans }}>
                {selectedRequest.notes || "No internal notes added for this request."}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main List View ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Header Bar */}
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
            Admin Requests ({requests.length})
          </h1>
          <p
            style={{
              fontFamily: typography.fontFamily.sans,
              fontSize: "14px",
              color: colors.text.muted,
              margin: "4px 0 0 0",
            }}
          >
            Review and act on pending domain setup, role permission, and system upgrade requests submitted by admins.
          </p>
        </div>

        {/* Add Request Button */}
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
          <Plus size={18} />
          <span>New Admin Request</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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
        {/* Filter Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color={colors.brand.accent} />
          <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: typography.fontFamily.sans }}>
            Filter Status:
          </span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            style={{
              height: "36px",
              borderRadius: "8px",
              border: `1px solid ${colors.header.border}`,
              padding: "0 12px",
              fontSize: "13px",
              fontFamily: typography.fontFamily.sans,
              background: "#FFFFFF",
              outline: "none",
            }}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In-progress">In-progress</option>
            <option value="Accepted">Accepted</option>
            <option value="Canceled">Canceled</option>
          </select>
        </div>

        {/* Filter City */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={16} color={colors.text.muted} />
          <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: typography.fontFamily.sans, color: colors.text.muted }}>
            City:
          </span>
          <select
            value={selectedCityFilter}
            onChange={(e) => setSelectedCityFilter(e.target.value)}
            style={{
              height: "36px",
              borderRadius: "8px",
              border: `1px solid ${colors.header.border}`,
              padding: "0 12px",
              fontSize: "13px",
              fontFamily: typography.fontFamily.sans,
              background: "#FFFFFF",
              outline: "none",
              fontWeight: 600,
              color: colors.brand.accent,
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: `1px solid ${colors.header.border}`,
            borderRadius: "8px",
            padding: "0 12px",
            height: "36px",
            flex: 1,
            minWidth: "220px",
          }}
        >
          <Search size={16} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Search by admin name, number, email, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "13px",
              fontFamily: typography.fontFamily.sans,
            }}
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        keyExtractor={(r) => r.id}
        pageSize={5}
        emptyMessage="No admin requests found."
      />

      {/* ── Add Request Modal ── */}
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
              maxWidth: "500px",
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
                Create Admin Request
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
              style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Admin Name */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Admin Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter admin name"
                  {...register("name")}
                  style={inputStyle(!!errors.name)}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                    Email Address <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@domain.com"
                    {...register("email")}
                    style={inputStyle(!!errors.email)}
                  />
                  <FieldError message={errors.email?.message} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Request Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the admin request details (min 10 characters)..."
                  {...register("desc")}
                  style={{
                    width: "100%",
                    border: `1.5px solid ${errors.desc ? colors.status.error : colors.login.inputBorder}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    marginTop: "4px",
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.sans,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <FieldError message={errors.desc?.message} />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600, color: colors.text.primary, fontFamily: typography.fontFamily.sans }}>
                  Internal Notes
                </label>
                <input
                  type="text"
                  placeholder="Add internal notes or status follow-up..."
                  {...register("notes")}
                  style={inputStyle(false)}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
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
                  Save Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
