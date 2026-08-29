"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "@/hooks/useDebounce";
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
  MessageSquare,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { colors, typography } from "@/lib/theme";
import { PendingRequest } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmDelete } from "@/lib/notify";
import { addRequestSchema, AddRequestFormData } from "./schema";
import { DataTable, Column } from "@/components/ui/DataTable";
import { META_CONSTANTS } from "@/lib/metaConstant";
import { SkeletonNotesHistory, AdminRequestsSkeleton } from "@/components/ui/Skeleton";

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

// Helper to parse note timestamp and content
const parseNote = (raw: string) => {
  const match = raw.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return { time: match[1], text: match[2] };
  }
  return { time: "", text: raw };
};

export interface NoteHistoryItem {
  id: string;
  note: string;
  createdAt: string;
  actorId?: string | null;
  actorName?: string | null;
}

export type ExtendedPendingRequest = PendingRequest & {
  requestNumber?: string;
  notesHistory?: NoteHistoryItem[];
};

// Formatter for note timestamps (handles ISO strings and formatted dates)
const formatNoteDate = (rawDate: string | undefined) => {
  if (!rawDate) return "";
  try {
    const d = new Date(rawDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {
    // fallback
  }
  return rawDate;
};

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
type ApiAdminRequest = {
  id: string;
  requestNumber: string;
  adminId: string | null;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  description: string;
  internalNotes: string | null;
  notes?: string | NoteHistoryItem[] | null;
  notesHistory?: NoteHistoryItem[];
  status: "PENDING" | "IN_PROGRESS" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

type AdminRequestsResponse = {
  success: boolean;
  data: ApiAdminRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  message?: string;
};

const API_URL = "/api/admin-requests";

const statusToApi = (status: PendingRequest["status"]) => {
  switch (status) {
    case "Pending":
      return "PENDING";
    case "In-progress":
      return "IN_PROGRESS";
    case "Accepted":
      return "ACCEPTED";
    case "Canceled":
      return "CANCELLED";
    default:
      return "PENDING";
  }
};

const normalizeRequest = (
  request:
    | ApiAdminRequest
    | {
        id: string;
        requestNumber?: string;
        adminId?: string | null;
        fullName?: string;
        name?: string;
        requestName?: string;
        phone?: string;
        requestPhone?: string;
        email?: string;
        requestEmail?: string;
        city?: string;
        requestCity?: string;
        description?: string;
        desc?: string;
        internalNotes?: string | null;
        notes?: string | NoteHistoryItem[] | null;
        notesHistory?: NoteHistoryItem[];
        status:
          | "PENDING"
          | "IN_PROGRESS"
          | "ACCEPTED"
          | "REJECTED"
          | "CANCELLED"
          | "Pending"
          | "In-progress"
          | "Accepted"
          | "Rejected"
          | "Canceled";
        createdAt?: string;
        updatedAt?: string;
        createdDate?: string;
      },
): ExtendedPendingRequest => {
  let status: PendingRequest["status"];

  switch (request.status) {
    case "PENDING":
    case "Pending":
      status = "Pending";
      break;

    case "IN_PROGRESS":
    case "In-progress":
      status = "In-progress";
      break;

    case "ACCEPTED":
    case "Accepted":
      status = "Accepted";
      break;

    case "CANCELLED":
    case "Canceled":
    case "REJECTED":
    case "Rejected":
      status = "Canceled";
      break;

    default:
      status = "Pending";
  }

  // Support both old (name/desc/notes) and new (fullName/description/internalNotes) field names
  const name =
    (request as { fullName?: string }).fullName ??
    (request as { name?: string }).name ??
    (request as { requestName?: string }).requestName ??
    "";
  const desc =
    (request as { description?: string }).description ??
    (request as { desc?: string }).desc ??
    "";
  const rawNotes =
    (request as { internalNotes?: string | null }).internalNotes ??
    (request as { notes?: string | NoteHistoryItem[] | null }).notes ??
    "";

  const notesStr = typeof rawNotes === "string" ? rawNotes : "";

  let notesHistory: NoteHistoryItem[] = [];
  if (Array.isArray((request as { notesHistory?: NoteHistoryItem[] }).notesHistory)) {
    notesHistory = (request as { notesHistory: NoteHistoryItem[] }).notesHistory;
  } else if (Array.isArray(rawNotes)) {
    notesHistory = rawNotes;
  }

  const rawPhone = (request as { phone?: string }).phone ?? (request as { requestPhone?: string }).requestPhone ?? "";
  const rawEmail = (request as { email?: string }).email ?? (request as { requestEmail?: string }).requestEmail ?? "";
  const rawCity = (request as { city?: string }).city ?? (request as { requestCity?: string }).requestCity ?? "";
  const rawCreatedAt = (request as { createdAt?: string }).createdAt ?? "";
  const createdDate =
    (request as { createdDate?: string }).createdDate ??
    (rawCreatedAt ? (typeof rawCreatedAt === "string" ? rawCreatedAt.slice(0, 10) : "") : "");

  return {
    id: request.id,
    requestNumber: (request as { requestNumber?: string }).requestNumber ?? "",
    name,
    phone: rawPhone,
    email: rawEmail,
    desc,
    notes: notesStr,
    notesHistory,
    status,
    city: rawCity,
    createdDate,
  };
};

function PendingRequestsPageContent() {
  const searchParams = useSearchParams();
  const rawStatus = searchParams.get("status");
  const initialStatus = rawStatus
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase()
    : "All";

  const { showToast } = useToast();
  const [requests, setRequests] = useState<ExtendedPendingRequest[]>([]);
  const [originalRequest, setOriginalRequest] =
    useState<ExtendedPendingRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>(initialStatus);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 5;

  // Set page title & sync state when searchParams change
  useEffect(() => {
    document.title = META_CONSTANTS.pendingRequests.fullTitle;
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const s = statusParam.charAt(0).toUpperCase() + statusParam.slice(1).toLowerCase();
      setSelectedStatusFilter(s);
    } else {
      setSelectedStatusFilter("All");
    }
  }, [searchParams]);

  const fetchRequestIdRef = useRef(0);

  const fetchRequests = useCallback(
    async (page = 1) => {
      const requestId = ++fetchRequestIdRef.current;
      try {
        setIsLoading(true);

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        if (selectedStatusFilter !== "All") {
          params.set(
            "status",
            statusToApi(selectedStatusFilter as PendingRequest["status"]),
          );
        }

        if (selectedCityFilter !== "All" && selectedCityFilter.trim()) {
          params.set("city", selectedCityFilter.trim());
        }

        if (selectedDateFilter.trim()) {
          params.set("createdAt", selectedDateFilter.trim());
        }

        const response = await fetch(`${API_URL}?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result: AdminRequestsResponse = await response.json();

        if (requestId !== fetchRequestIdRef.current) {
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to fetch admin requests",
          );
        }

        const apiData: ApiAdminRequest[] = Array.isArray(result.data)
          ? result.data
          : [];

        setRequests(apiData.map(normalizeRequest));
        setCurrentPage(result.pagination?.page ?? page);
        setTotalPages(result.pagination?.totalPages ?? 1);
        setTotalCount(result.pagination?.total ?? apiData.length);
      } catch (err) {
        if (requestId !== fetchRequestIdRef.current) return;
        showToast(
          err instanceof Error
            ? err.message
            : "Failed to fetch admin requests",
          "error",
        );
        setRequests([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        if (requestId === fetchRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [
      debouncedSearch,
      selectedStatusFilter,
      selectedCityFilter,
      selectedDateFilter,
      showToast,
    ],
  );

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const handleStatusFilterChange = (newStatus: string) => {
    setSelectedStatusFilter(newStatus);
    if (typeof window !== "undefined") {
      if (newStatus === "All") {
        window.history.replaceState(null, "", window.location.pathname);
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set("status", newStatus);
        window.history.replaceState(null, "", url.toString());
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatusFilter("All");
    setSelectedCityFilter("All");
    setSelectedDateFilter("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedStatusFilter !== "All" ||
    selectedCityFilter !== "All" ||
    Boolean(selectedDateFilter);

  const [selectedRequest, setSelectedRequest] =
    useState<ExtendedPendingRequest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);
  const [noteActionLoadingIndex, setNoteActionLoadingIndex] = useState<number | null>(null);
  const [noteActionType, setNoteActionType] = useState<"edit" | "delete" | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>("");
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch full details for a single request (including notes & notesHistory)
  const fetchRequestById = useCallback(
    async (id: string) => {
      try {
        setIsDetailLoading(true);
        const response = await fetch(`${API_URL}/${id}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        if (response.status === 401) {
          showToast("Please login to continue", "error");
          return null;
        }

        if (response.status === 404) {
          showToast("Admin request not found", "error");
          return null;
        }

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || "Failed to fetch request details");
        }

        const normalized = normalizeRequest(result.data);
        setSelectedRequest(normalized);
        setOriginalRequest({ ...normalized });

        // Auto-scroll to bottom of notes history (like WhatsApp)
        setTimeout(() => {
          if (notesContainerRef.current) {
            notesContainerRef.current.scrollTo({
              top: notesContainerRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }, 150);

        return normalized;
      } catch (err) {
        console.error("FETCH_REQUEST_BY_ID_ERROR:", err);
        showToast(
          err instanceof Error ? err.message : "Failed to load request details",
          "error",
        );
        return null;
      } finally {
        setIsDetailLoading(false);
      }
    },
    [showToast],
  );

  // Helper to persist updated internal notes directly to backend
  const saveNotesToApi = async (updatedNotes: string) => {
    if (!selectedRequest) return false;
    try {
      setIsUpdatingNote(true);
      const response = await fetch(`${API_URL}/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          internalNotes: updatedNotes.trim() ? updatedNotes : null,
        }),
      });
      const result = await response.json();

      if (response.status === 401) {
        showToast("Please login to continue", "error");
        return false;
      }

      if (response.status === 400) {
        showToast(result.message || "Invalid request", "error");
        return false;
      }

      if (response.status === 404) {
        showToast("Admin request not found", "error");
        return false;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update notes");
      }

      await fetchRequestById(selectedRequest.id);
      fetchRequests(currentPage);

      return true;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to save note",
        "error",
      );
      return false;
    } finally {
      setIsUpdatingNote(false);
    }
  };

  // Add a new note using the `note` field via PATCH /api/admin-requests/:id
  const handleAddDetailNote = async () => {
    if (!newNoteInput.trim() || !selectedRequest || isAddingNote) return;
    try {
      setIsAddingNote(true);
      const response = await fetch(`${API_URL}/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          note: newNoteInput.trim(),
        }),
      });

      const result = await response.json();

      if (response.status === 401) {
        showToast("Please login to continue", "error");
        return;
      }

      if (response.status === 400) {
        showToast(result.message || "Note cannot be empty", "error");
        return;
      }

      if (response.status === 404) {
        showToast("Admin request not found", "error");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to add note");
      }

      setNewNoteInput("");
      showToast(result.message || "Admin request note added successfully", "success");

      // Re-fetch full details to get updated notes & notesHistory
      await fetchRequestById(selectedRequest.id);

      // Refresh table list
      fetchRequests(currentPage);

      // Auto-scroll to bottom of notes history (like WhatsApp)
      setTimeout(() => {
        if (notesContainerRef.current) {
          notesContainerRef.current.scrollTo({
            top: notesContainerRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 200);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to add note",
        "error",
      );
    } finally {
      setIsAddingNote(false);
    }
  };

  // Start editing a note
  const handleStartEditNote = (idx: number, currentText: string) => {
    setEditingNoteIndex(idx);
    setEditingNoteText(currentText);
  };

  // Save an edited note
  const handleSaveEditedNote = async (idx: number, origTime: string) => {
    if (!selectedRequest || !editingNoteText.trim() || isUpdatingNote) return;

    let updatedNotes = "";
    if (selectedRequest.notesHistory && selectedRequest.notesHistory.length > 0) {
      const sorted = [...selectedRequest.notesHistory].sort((a, b) => {
        const tA = new Date(a.createdAt).getTime() || 0;
        const tB = new Date(b.createdAt).getTime() || 0;
        return tA - tB;
      });
      sorted[idx] = {
        ...sorted[idx],
        note: editingNoteText.trim(),
      };
      updatedNotes = sorted
        .map((item) => (item.createdAt ? `[${formatNoteDate(item.createdAt)}] ${item.note}` : item.note))
        .join("\n");
    } else {
      const noteLines = selectedRequest.notes.split("\n").filter(Boolean);
      const updatedLine = origTime
        ? `[${origTime}] ${editingNoteText.trim()}`
        : editingNoteText.trim();
      noteLines[idx] = updatedLine;
      updatedNotes = noteLines.join("\n");
    }

    try {
      setNoteActionLoadingIndex(idx);
      setNoteActionType("edit");
      const success = await saveNotesToApi(updatedNotes);
      if (success) {
        setEditingNoteIndex(null);
        setEditingNoteText("");
        showToast("Note updated successfully!", "success");
      }
    } finally {
      setNoteActionLoadingIndex(null);
      setNoteActionType(null);
    }
  };

  // Delete a specific note
  const handleDeleteNote = async (idx: number) => {
    if (!selectedRequest || isUpdatingNote) return;

    let updatedNotes = "";
    if (selectedRequest.notesHistory && selectedRequest.notesHistory.length > 0) {
      const sorted = [...selectedRequest.notesHistory].sort((a, b) => {
        const tA = new Date(a.createdAt).getTime() || 0;
        const tB = new Date(b.createdAt).getTime() || 0;
        return tA - tB;
      });
      sorted.splice(idx, 1);
      updatedNotes = sorted
        .map((item) => (item.createdAt ? `[${formatNoteDate(item.createdAt)}] ${item.note}` : item.note))
        .join("\n");
    } else {
      const noteLines = selectedRequest.notes.split("\n").filter(Boolean);
      noteLines.splice(idx, 1);
      updatedNotes = noteLines.join("\n");
    }

    try {
      setNoteActionLoadingIndex(idx);
      setNoteActionType("delete");
      const success = await saveNotesToApi(updatedNotes);
      if (success) {
        if (editingNoteIndex === idx) {
          setEditingNoteIndex(null);
          setEditingNoteText("");
        }
        showToast("Note deleted successfully!", "info");
      }
    } finally {
      setNoteActionLoadingIndex(null);
      setNoteActionType(null);
    }
  };

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
      city: "",
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

  // Since filtering is handled server-side via API params, just use requests directly
  const filteredRequests = requests;

  // Add request with confirm
  const onAddSubmit = async (data: AddRequestFormData) => {
    try {
      setIsSaving(true);

      /* -------------------------------------------------------------------- */
      /* Create Admin Request                                                 */
      /* -------------------------------------------------------------------- */
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: data.name.trim(),
          phone: data.phone.trim(),
          email: data.email.trim().toLowerCase(),
          city: data.city || "Jaipur",
          description: data.desc.trim(),
          internalNotes: data.notes?.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to create admin request");
      }

      const createdRequest = normalizeRequest(result.data);

      setRequests((prev) => [createdRequest, ...prev]);

      reset();

      showToast(
        `Request from "${createdRequest.name}" created successfully!`,
        "success",
      );
      setIsAddModalOpen(false);

      // Re-fetch page 1 to show newest entry
      fetchRequests(1);
    } catch (error) {
      console.error("CREATE_ADMIN_REQUEST_ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Failed to create admin request",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change with confirm
  const handleStatusChange = async (
    id: string,
    newStatus: PendingRequest["status"],
  ) => {
    const target = requests.find((r) => r.id === id);

    if (!target) return;

    try {
      setIsSaving(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: statusToApi(newStatus),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update request status");
      }

      const updatedRequest = normalizeRequest(result.data);

      setRequests((prev) =>
        prev.map((request) => (request.id === id ? updatedRequest : request)),
      );

      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(updatedRequest);
      }

      const toastType =
        newStatus === "Accepted"
          ? "success"
          : newStatus === "Canceled"
            ? "error"
            : "info";

      showToast(`"${target.name}" status updated to ${newStatus}`, toastType);

      // Re-fetch current page from backend
      fetchRequests(currentPage);
    } catch (error) {
      console.error("UPDATE_REQUEST_STATUS_ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Failed to update request status",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Save edited request
  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      setIsSaving(true);

      const response = await fetch(`${API_URL}/${selectedRequest.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fullName: selectedRequest.name?.trim(),
          phone: selectedRequest.phone?.trim(),
          email: selectedRequest.email?.trim().toLowerCase(),
          city: selectedRequest.city?.trim(),
          description: selectedRequest.desc,
          status: statusToApi(selectedRequest.status),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update request");
      }

      const updatedRequest = normalizeRequest(result.data);

      setRequests((prev) =>
        prev.map((request) =>
          request.id === updatedRequest.id ? updatedRequest : request,
        ),
      );

      setSelectedRequest(updatedRequest);
      setOriginalRequest(updatedRequest);
      setIsEditing(false);

      showToast(
        `Request "${updatedRequest.name}" updated successfully!`,
        "success",
      );

      // Re-fetch current page from backend
      fetchRequests(currentPage);
    } catch (error) {
      console.error("UPDATE_ADMIN_REQUEST_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to update request",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Delete request
  const handleDeleteRequest = async (id: string) => {
    const target = requests.find((r) => r.id === id);

    const prev = selectedRequest;

    setSelectedRequest(null);

    const confirmed = await confirmDelete(
      `request from "${target?.name ?? id}"`,
    );

    if (!confirmed) {
      setSelectedRequest(prev);
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete request");
      }

      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== id),
      );

      showToast(
        `Request from "${target?.name ?? id}" has been deleted.`,
        "error",
      );

      // Re-fetch current page; if we deleted the last item on this page, go back one
      fetchRequests(currentPage);
    } catch (error) {
      console.error("DELETE_ADMIN_REQUEST_ERROR:", error);

      if (prev) {
        setSelectedRequest(prev);
      }

      showToast(
        error instanceof Error ? error.message : "Failed to delete request",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── DataTable Columns ──────────────────────────────────────────────────────
  const columns: Column<PendingRequest>[] = [
    {
      header: "Admin Name",
      cell: (req) => (
        <div>
          <div style={{ fontWeight: 600 }}>{req.name}</div>
          <div
            style={{
              fontSize: "12px",
              color: colors.brand.accent,
              fontWeight: 500,
            }}
          >
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
        <span
          style={{
            maxWidth: "200px",
            display: "inline-block",
            fontSize: "13px",
          }}
        >
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
            setOriginalRequest({ ...req });
            setIsEditing(false);
            fetchRequestById(req.id);
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
              onClick={() => {
                setSelectedRequest(null);
                setOriginalRequest(null);
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
              <span>Back to Requests</span>
            </button>

            <div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
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
                {selectedRequest.city} • Created on{" "}
                {selectedRequest.createdDate}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    if (originalRequest) {
                      setSelectedRequest({ ...originalRequest });
                    }
                    setIsEditing(false);
                  }}
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
                  onClick={() => {
                    if (selectedRequest) {
                      setOriginalRequest({ ...selectedRequest });
                    }
                    setIsEditing(true);
                  }}
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
            <h2
              style={{
                fontSize: "16px",
                margin: 0,
                fontWeight: 700,
                fontFamily: typography.fontFamily.sans,
                color: colors.text.primary,
              }}
            >
              Edit Request Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Admin Name
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Enter admin name"
                  value={selectedRequest.name}
                  onChange={(e) =>
                    setSelectedRequest({
                      ...selectedRequest,
                      name: e.target.value.slice(0, 50),
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={selectedRequest.city}
                  onChange={(e) =>
                    setSelectedRequest({
                      ...selectedRequest,
                      city: e.target.value,
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={selectedRequest.phone}
                  onKeyDown={(e) => {
                    if (
                      e.key.length === 1 &&
                      !/\d/.test(e.key) &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                    }
                  }}
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
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={selectedRequest.email}
                  onChange={(e) =>
                    setSelectedRequest({
                      ...selectedRequest,
                      email: e.target.value,
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                Request Status
              </label>
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
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                Request Description
              </label>
              <textarea
                rows={3}
                value={selectedRequest.desc}
                onChange={(e) =>
                  setSelectedRequest({
                    ...selectedRequest,
                    desc: e.target.value,
                  })
                }
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

          </div>
        ) : (
          /* ── Read Only Detail Cards ── */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingBottom: "12px",
                    borderBottom: `1px solid ${colors.header.border}`,
                  }}
                >
                  <Phone size={18} color={colors.brand.accent} />
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: typography.fontFamily.sans,
                      color: colors.text.primary,
                    }}
                  >
                    Contact Information
                  </h3>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Phone size={12} /> Phone Number
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedRequest.phone}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Mail size={12} /> Email Address
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedRequest.email}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPin size={12} /> City Location
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                        color: colors.brand.accent,
                      }}
                    >
                      {selectedRequest.city}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Calendar size={12} /> Created Date
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedRequest.createdDate}
                    </strong>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingBottom: "12px",
                    borderBottom: `1px solid ${colors.header.border}`,
                  }}
                >
                  <CheckCircle size={18} color={colors.brand.accent} />
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: typography.fontFamily.sans,
                      color: colors.text.primary,
                    }}
                  >
                    Request Status
                  </h3>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Current Status
                    </span>
                    {renderStatusBadge(selectedRequest.status)}
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Update Status
                    </span>
                    <select
                      value={selectedRequest.status}
                      onChange={(e) =>
                        handleStatusChange(
                          selectedRequest.id,
                          e.target.value as PendingRequest["status"],
                        )
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${colors.header.border}`,
                }}
              >
                <FileText size={18} color={colors.brand.accent} />
                <h3
                  style={{
                    fontSize: "15px",
                    margin: 0,
                    fontWeight: 700,
                    fontFamily: typography.fontFamily.sans,
                    color: colors.text.primary,
                  }}
                >
                  Request Description
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: colors.text.primary,
                  lineHeight: "1.7",
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {selectedRequest.desc}
              </p>
            </div>

            {/* Notes History Card */}
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
              {/* Header */}
              {(() => {
                // Combine notesHistory and string notes
                const hasNotesHistory =
                  Array.isArray(selectedRequest.notesHistory) &&
                  selectedRequest.notesHistory.length > 0;
                const stringNotesList = selectedRequest.notes
                  ? selectedRequest.notes.split("\n").filter(Boolean)
                  : [];

                const totalNotesCount = hasNotesHistory
                  ? selectedRequest.notesHistory!.length
                  : stringNotesList.length;

                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "12px",
                      borderBottom: `1px solid ${colors.header.border}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <StickyNote size={18} color={colors.brand.accent} />
                      <h3
                        style={{
                          fontSize: "15px",
                          margin: 0,
                          fontWeight: 700,
                          fontFamily: typography.fontFamily.sans,
                          color: colors.text.primary,
                        }}
                      >
                        Notes History
                      </h3>
                    </div>
                    {totalNotesCount > 0 && (
                      <span
                        style={{
                          fontSize: "12px",
                          color: colors.brand.accent,
                          fontFamily: typography.fontFamily.sans,
                          background: "rgba(35,114,165,0.08)",
                          padding: "2px 10px",
                          borderRadius: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {totalNotesCount} note{totalNotesCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Notes scrollable list — shows ~10 items viewport, auto-scrolls to bottom like WhatsApp */}
              <div style={{ position: "relative" }}>
                <div
                  ref={notesContainerRef}
                  className="notes-scroll-container"
                  onScroll={() => {
                    if (notesContainerRef.current) {
                      setShowScrollTop(notesContainerRef.current.scrollTop > 60);
                    }
                  }}
                  style={{
                    height: "420px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0",
                    border: `1px solid ${colors.header.border}`,
                    borderRadius: "12px",
                    background: "#F7F8FA",
                    scrollBehavior: "smooth",
                  }}
                >
                  {isDetailLoading ? (
                    <SkeletonNotesHistory count={4} />
                  ) : (
                    (() => {
                      const hasNotesHistory =
                        Array.isArray(selectedRequest.notesHistory) &&
                        selectedRequest.notesHistory.length > 0;

                    let notesToRender: {
                      id: string;
                      text: string;
                      time: string;
                      actorName?: string | null;
                      rawIndex: number;
                    }[] = [];

                    if (hasNotesHistory) {
                      // Sort oldest to newest (WhatsApp chronological order: latest at bottom)
                      notesToRender = [...selectedRequest.notesHistory!]
                        .sort((a, b) => {
                          const tA = new Date(a.createdAt).getTime() || 0;
                          const tB = new Date(b.createdAt).getTime() || 0;
                          return tA - tB;
                        })
                        .map((item, idx) => ({
                          id: item.id || `hist-${idx}`,
                          text: item.note,
                          time: formatNoteDate(item.createdAt),
                          actorName: item.actorName,
                          rawIndex: idx,
                        }));
                    } else if (selectedRequest.notes) {
                      const noteLines = selectedRequest.notes.split("\n").filter(Boolean);
                      notesToRender = noteLines.map((note, idx) => {
                        const { time, text } = parseNote(note);
                        return {
                          id: `str-${idx}`,
                          text,
                          time: formatNoteDate(time) || time,
                          actorName: undefined,
                          rawIndex: idx,
                        };
                      });
                    }

                    if (notesToRender.length === 0) {
                      return (
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: "10px",
                            color: colors.text.muted,
                            fontFamily: typography.fontFamily.sans,
                            fontSize: "13px",
                          }}
                        >
                          <MessageSquare size={32} color={colors.header.border} />
                          No internal notes added for this request.
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Spacer so note lists push to bottom */}
                        <div style={{ flex: 1 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px" }}>
                          {notesToRender.map((noteItem, idx) => {
                            const isEditingThisNote = editingNoteIndex === noteItem.rawIndex;
                            const isThisNoteSaving =
                              noteActionLoadingIndex === noteItem.rawIndex &&
                              noteActionType === "edit";
                            const isThisNoteDeleting =
                              noteActionLoadingIndex === noteItem.rawIndex &&
                              noteActionType === "delete";

                            return (
                              <div
                                key={noteItem.id || idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "16px",
                                  padding: "12px 16px",
                                  background: isEditingThisNote
                                    ? "rgba(35, 114, 165, 0.05)"
                                    : "#FFFFFF",
                                  border: isEditingThisNote
                                    ? `1.5px solid ${colors.brand.accent}`
                                    : `1px solid ${colors.header.border}`,
                                  borderRadius: "10px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                  animation: "fadeSlideIn 0.2s ease",
                                  transition: "all 0.15s ease",
                                  opacity: isThisNoteDeleting ? 0.5 : 1,
                                }}
                              >
                                {/* Left Side: Note Content, Author & Timestamp */}
                                <div
                                  style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    minWidth: 0,
                                  }}
                                >
                                  {isEditingThisNote ? (
                                    <input
                                      type="text"
                                      value={editingNoteText}
                                      onChange={(e) => setEditingNoteText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleSaveEditedNote(noteItem.rawIndex, noteItem.time);
                                        } else if (e.key === "Escape") {
                                          setEditingNoteIndex(null);
                                          setEditingNoteText("");
                                        }
                                      }}
                                      disabled={isUpdatingNote}
                                      autoFocus
                                      style={{
                                        width: "100%",
                                        height: "34px",
                                        border: `1.5px solid ${colors.brand.accent}`,
                                        borderRadius: "6px",
                                        padding: "0 10px",
                                        fontSize: "14px",
                                        fontFamily: typography.fontFamily.sans,
                                        outline: "none",
                                        background: "#FFFFFF",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: "14px",
                                        color: colors.text.primary,
                                        fontWeight: 500,
                                        fontFamily: typography.fontFamily.sans,
                                        lineHeight: "1.5",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {noteItem.text}
                                    </div>
                                  )}

                                  {/* Left sub-row: Timestamp & Author */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      fontSize: "12px",
                                      color: colors.text.muted,
                                      fontFamily: typography.fontFamily.sans,
                                      marginTop: "2px",
                                    }}
                                  >
                                    {noteItem.actorName && (
                                      <span
                                        style={{
                                          fontWeight: 600,
                                          color: colors.brand.accent,
                                          background: "rgba(35, 114, 165, 0.08)",
                                          padding: "1px 6px",
                                          borderRadius: "4px",
                                          fontSize: "11px",
                                        }}
                                      >
                                        {noteItem.actorName}
                                      </span>
                                    )}
                                    {noteItem.time && (
                                      <span>
                                        {noteItem.time}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right Side: Actions (Edit & Delete or Save & Cancel) */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {isEditingThisNote ? (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isUpdatingNote}
                                        onClick={() => handleSaveEditedNote(noteItem.rawIndex, noteItem.time)}
                                        title="Save note"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "5px",
                                          height: "30px",
                                          padding: "0 10px",
                                          borderRadius: "6px",
                                          border: "none",
                                          background: colors.brand.primary,
                                          color: colors.sidebar.activeText,
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          cursor: isUpdatingNote ? "not-allowed" : "pointer",
                                          fontFamily: typography.fontFamily.sans,
                                          opacity: isThisNoteSaving ? 0.8 : isUpdatingNote ? 0.5 : 1,
                                        }}
                                      >
                                        {isThisNoteSaving ? (
                                          <Loader2
                                            size={13}
                                            style={{ animation: "spin 1s linear infinite" }}
                                          />
                                        ) : (
                                          <Check size={14} />
                                        )}
                                        <span>{isThisNoteSaving ? "Saving…" : "Save"}</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isUpdatingNote}
                                        onClick={() => {
                                          setEditingNoteIndex(null);
                                          setEditingNoteText("");
                                        }}
                                        title="Cancel edit"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "4px",
                                          height: "30px",
                                          padding: "0 10px",
                                          borderRadius: "6px",
                                          border: `1px solid ${colors.login.inputBorder}`,
                                          background: "#FFFFFF",
                                          color: colors.text.muted,
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          cursor: isUpdatingNote ? "not-allowed" : "pointer",
                                          fontFamily: typography.fontFamily.sans,
                                        }}
                                      >
                                        <X size={14} />
                                        <span>Cancel</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isUpdatingNote}
                                        onClick={() => handleStartEditNote(noteItem.rawIndex, noteItem.text)}
                                        title="Edit note"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "4px",
                                          height: "28px",
                                          padding: "0 9px",
                                          borderRadius: "6px",
                                          border: `1px solid rgba(35, 114, 165, 0.25)`,
                                          background: "rgba(35, 114, 165, 0.08)",
                                          color: colors.brand.accent,
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          cursor: isUpdatingNote ? "not-allowed" : "pointer",
                                          fontFamily: typography.fontFamily.sans,
                                          transition: "background 0.15s",
                                          opacity: isUpdatingNote ? 0.5 : 1,
                                        }}
                                      >
                                        <Edit2 size={12} />
                                        <span>Edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isUpdatingNote}
                                        onClick={() => handleDeleteNote(noteItem.rawIndex)}
                                        title="Delete note"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: "5px",
                                          height: "28px",
                                          padding: "0 9px",
                                          borderRadius: "6px",
                                          border: `1px solid rgba(239, 68, 68, 0.25)`,
                                          background: "rgba(239, 68, 68, 0.08)",
                                          color: colors.status.error,
                                          fontSize: "12px",
                                          fontWeight: 600,
                                          cursor: isUpdatingNote ? "not-allowed" : "pointer",
                                          fontFamily: typography.fontFamily.sans,
                                          transition: "background 0.15s",
                                          opacity: isThisNoteDeleting ? 0.8 : isUpdatingNote ? 0.5 : 1,
                                        }}
                                      >
                                        {isThisNoteDeleting ? (
                                          <Loader2
                                            size={12}
                                            style={{ animation: "spin 1s linear infinite" }}
                                          />
                                        ) : (
                                          <Trash2 size={12} />
                                        )}
                                        <span>{isThisNoteDeleting ? "Deleting…" : "Delete"}</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()
                )}
                </div>

                {/* Scroll to Top floating button — appears after scrolling down */}
                {showScrollTop && (
                  <button
                    type="button"
                    title="Scroll to top"
                    onClick={() => {
                      if (notesContainerRef.current) {
                        notesContainerRef.current.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }
                    }}
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      border: "none",
                      background: colors.brand.accent,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(35,114,165,0.35)",
                      transition: "opacity 0.2s, transform 0.2s",
                      zIndex: 10,
                    }}
                  >
                    <ArrowUp size={16} />
                  </button>
                )}
              </div>

              {/* Add note input bar */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  background: "#F7F8FA",
                  border: `1.5px solid ${colors.login.inputBorder}`,
                  borderRadius: "12px",
                  padding: "6px 6px 6px 14px",
                }}
              >
                <input
                  type="text"
                  placeholder="Type a note and press Enter or click Add…"
                  value={newNoteInput}
                  onChange={(e) => setNewNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDetailNote();
                    }
                  }}
                  disabled={isAddingNote}
                  style={{
                    flex: 1,
                    height: "36px",
                    border: "none",
                    outline: "none",
                    fontSize: "14px",
                    fontFamily: typography.fontFamily.sans,
                    background: "transparent",
                    color: isAddingNote ? colors.text.muted : colors.text.primary,
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddDetailNote}
                  disabled={isAddingNote || !newNoteInput.trim()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    height: "36px",
                    padding: "0 18px",
                    borderRadius: "8px",
                    background:
                      isAddingNote || !newNoteInput.trim()
                        ? "rgba(244, 188, 67, 0.4)"
                        : colors.brand.primary,
                    color: colors.sidebar.activeText,
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: isAddingNote || !newNoteInput.trim() ? "not-allowed" : "pointer",
                    fontFamily: typography.fontFamily.sans,
                    flexShrink: 0,
                    boxShadow: isAddingNote || !newNoteInput.trim() ? "none" : "0 2px 6px rgba(244, 188, 67, 0.35)",
                    transition: "background 0.2s, box-shadow 0.2s",
                    opacity: isAddingNote ? 0.6 : 1,
                  }}
                >
                  {isAddingNote ? "Adding…" : "+ Add"}
                </button>
              </div>
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
            Review and act on pending domain setup, role permission, and system
            upgrade requests submitted by admins.
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
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            Filter Status:
          </span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
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
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: typography.fontFamily.sans,
              color: colors.text.muted,
            }}
          >
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

        {/* Filter Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} color={colors.brand.accent} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: typography.fontFamily.sans,
              color: colors.text.muted,
            }}
          >
            Created Date:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              style={{
                height: "36px",
                borderRadius: "8px",
                border: `1px solid ${colors.header.border}`,
                padding: "0 10px",
                fontSize: "13px",
                fontFamily: typography.fontFamily.sans,
                background: "#FFFFFF",
                outline: "none",
                fontWeight: 600,
                color: colors.brand.accent,
                cursor: "pointer",
              }}
            />
            {selectedDateFilter && (
              <button
                type="button"
                onClick={() => setSelectedDateFilter("")}
                title="Clear date filter"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "22px",
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: colors.status.error,
                  padding: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
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
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              title="Clear search"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                color: colors.text.muted,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Clear / Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              border: `1px solid ${colors.status.error}`,
              background: "rgba(239, 68, 68, 0.08)",
              color: colors.status.error,
              transition: "all 0.15s ease",
              fontFamily: typography.fontFamily.sans,
              height: "36px",
            }}
          >
            <X size={12} />
            Clear Filters
          </button>
        )}
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={requests}
        keyExtractor={(r) => r.id}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        emptyMessage="No admin requests found."
        pagination={{
          page: currentPage,
          limit: PAGE_SIZE,
          total: totalCount,
          totalPages: totalPages,
          onPageChange: (p) => {
            setCurrentPage(p);
            fetchRequests(p);
          },
        }}
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
              <h2
                style={{
                  fontSize: "18px",
                  margin: 0,
                  fontWeight: 700,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Create Admin Request
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  reset();
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#FFFFFF",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onAddSubmit)}
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {/* Admin Name */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Admin Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Enter admin name"
                  {...register("name")}
                  style={inputStyle(!!errors.name)}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    Phone Number <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Enter phone number"
                    {...register("phone")}
                    onKeyDown={(e) => {
                      if (
                        e.key.length === 1 &&
                        !/\d/.test(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onInput={(e) => {
                      const val = e.currentTarget.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      e.currentTarget.value = val;
                      setValue("phone", val, { shouldValidate: true });
                    }}
                    style={inputStyle(!!errors.phone)}
                  />
                  <FieldError message={errors.phone?.message} />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    City <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    {...register("city")}
                    style={inputStyle(!!errors.city)}
                  />
                  <FieldError message={errors.city?.message} />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Email Address <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  {...register("email")}
                  style={inputStyle(!!errors.email)}
                />
                <FieldError message={errors.email?.message} />
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Request Description{" "}
                  <span style={{ color: "#EF4444" }}>*</span>
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

              {/* Internal Notes */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
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
                  onClick={() => {
                    setIsAddModalOpen(false);
                    reset();
                  }}
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
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    height: "42px",
                    border: "none",
                    borderRadius: "8px",
                    background: isSaving ? "#D1D5DB" : colors.brand.primary,
                    color: colors.sidebar.activeText,
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    fontFamily: typography.fontFamily.sans,
                    boxShadow: isSaving ? "none" : "0 4px 12px rgba(244, 188, 67, 0.3)",
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? "Creating..." : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendingRequestsPage() {
  return (
    <Suspense fallback={<AdminRequestsSkeleton />}>
      <PendingRequestsPageContent />
    </Suspense>
  );
}

