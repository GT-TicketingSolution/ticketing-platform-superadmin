"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "@/hooks/useDebounce";
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
import { AdminUser } from "@/types/superadmin";
import { useToast } from "@/components/ui/Toast";
import { confirmDelete } from "@/lib/notify";
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

// ─── Permission-based module roles (Excludes default modules)
const ALL_ROLES: string[] = [
  "Complimentary Management",
  "Customer Management",
  "CCTV Monitoring",
];

const DEFAULT_MODULE_NAMES = [
  "manager management",
  "staff management",
  "attraction management",
  "seat management",
  "bookings",
  "transactions",
  "invoices",
  "inventory and capacity",
  "inventory / capacity",
  "inventory",
  "reports",
  "settings",
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
  amount: number = 0,
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

// ─── Admin API helpers

type ApiAdmin = {
  id: string;
  fullName: string;
  businessName?: string | null;
  phone: string;
  email: string;
  city: string;
  subdomain?: string | null;
  renewalAmount: string | number;
  joinedAt: string;
  lastRenewalDate?: string | null;
  nextRenewalDate: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  rolesAccess?: string[];
};

const mapApiAdminToAdminUser = (admin: ApiAdmin): AdminUser => {
  const statusMap: Record<ApiAdmin["status"], AdminUser["status"]> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Expired",
  };

  return {
    id: admin.id,
    name: admin.fullName,
    businessName: admin.businessName || "",
    phone: admin.phone,
    email: admin.email,
    city: admin.city,
    subDomain: admin.subdomain || "",
    renewalAmount: Number(admin.renewalAmount) || 0,
    joinedDate: admin.joinedAt
      ? new Date(admin.joinedAt).toISOString().slice(0, 10)
      : "",
    lastRenewalDate: admin.lastRenewalDate
      ? new Date(admin.lastRenewalDate).toISOString().slice(0, 10)
      : admin.joinedAt
        ? new Date(admin.joinedAt).toISOString().slice(0, 10)
        : "",
    nextRenewalDate: admin.nextRenewalDate
      ? new Date(admin.nextRenewalDate).toISOString().slice(0, 10)
      : "",
    rolesAccess: admin.rolesAccess || [],
    status: statusMap[admin.status] || "Inactive",
  };
};

export default function AdminPage() {
  useEffect(() => {
    document.title = META_CONSTANTS.admin.fullTitle;
  }, []);

  const { showToast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("All");

  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const PAGE_SIZE = 5;

  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [originalModules, setOriginalModules] = useState<string[]>([]);
  const [availableModules, setAvailableModules] = useState<
    {
      id: string;
      name: string;
      key: string;
    }[]
  >([]);
  const [isSavingModules, setIsSavingModules] = useState(false);

  const [assignedModules, setAssignedModules] = useState<
    {
      accessId: string;
      moduleId: string;
      key: string;
      name: string;
      description: string | null;
      isActive: boolean;
      sortOrder: number;
      grantedAt: string;
    }[]
  >([]);

  // Modals / View state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<AdminUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ─── Fetch Admins ─────────────────────────────────────────────────────────────

  const DEFAULT_MODULE_KEYS = [
    "MANAGER_MANAGEMENT",
    "STAFF_MANAGEMENT",
    "ATTRACTION_MANAGEMENT",
    "BOOKINGS",
    "TRANSACTIONS",
    "INVOICES",
    "INVENTORY_AND_CAPACITY",
    "REPORTS",
  ];

  const fetchAdmins = useCallback(
    async (page = 1) => {
      try {
        setIsLoadingAdmins(true);

        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (debouncedSearch.trim()) {
          params.set("search", debouncedSearch.trim());
        }

        if (selectedCityFilter !== "All" && selectedCityFilter.trim()) {
          params.set("city", selectedCityFilter.trim());
        }

        if (selectedDateFilter.trim()) {
          params.set("joinedDate", selectedDateFilter.trim());
        }

        if (selectedStatusFilter !== "All") {
          params.set("status", selectedStatusFilter.toUpperCase());
        }

        const response = await fetch(`/api/admins?${params.toString()}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch admins");
        }

        const rawData = result.data;

        const apiAdmins: ApiAdmin[] = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.data)
            ? rawData.data
            : [];

        const paginationInfo = rawData?.pagination || result.pagination;

        setAdmins(apiAdmins.map(mapApiAdminToAdminUser));
        setCurrentPage(paginationInfo?.page ?? page);
        setTotalPages(paginationInfo?.totalPages ?? 1);
        setTotalCount(paginationInfo?.total ?? apiAdmins.length);
        setHasNextPage(paginationInfo?.hasNextPage ?? false);
        setHasPreviousPage(paginationInfo?.hasPreviousPage ?? false);
      } catch (error) {
        console.error("FETCH_ADMINS_ERROR:", error);

        showToast(
          error instanceof Error ? error.message : "Failed to load admins",
          "error",
        );

        setAdmins([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setIsLoadingAdmins(false);
      }
    },
    [
      debouncedSearch,
      selectedCityFilter,
      selectedDateFilter,
      selectedStatusFilter,
    ],
  );

  useEffect(() => {
    fetchAdmins(1);
  }, [fetchAdmins]);

  useEffect(() => {
    fetchAvailableModules();
  }, []);

  const fetchAdminModules = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admins/${adminId}/modules`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch admin modules");
      }

      const modules = Array.isArray(result.data) ? result.data : [];

      // IMPORTANT:
      // This is what the Assigned Module Access Roles section uses.
      setAssignedModules(modules);

      // IDs used by the edit checkboxes
      const moduleIds = modules.map(
        (module: { moduleId: string }) => module.moduleId,
      );

      setOriginalModules(moduleIds);
      setSelectedModules(moduleIds);
    } catch (error) {
      console.error("FETCH_ADMIN_MODULES_ERROR:", error);

      setAssignedModules([]);
      setOriginalModules([]);
      setSelectedModules([]);

      showToast(
        error instanceof Error ? error.message : "Failed to load module access",
        "error",
      );
    }
  };

  const fetchAssignedModules = async (adminId: string) => {
    try {
      const response = await fetch(`/api/admins/${adminId}/modules`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch assigned modules");
      }

      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error("FETCH_ASSIGNED_MODULES_ERROR:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Failed to load assigned modules",
        "error",
      );

      return [];
    }
  };

  const fetchAvailableModules = async () => {
    try {
      const response = await fetch("/api/modules", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch modules");
      }

      const allModules: { id: string; name: string; key: string }[] =
        result.data || [];

      // Filter out default modules so only permission-based modules are shown in Module Access UI
      const permissionOnlyModules = allModules.filter(
        (m) =>
          !DEFAULT_MODULE_NAMES.some(
            (defName) =>
              defName.replace(/[^a-z0-9]/g, "") ===
              m.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
          ),
      );

      setAvailableModules(permissionOnlyModules);
    } catch (error) {
      console.error("FETCH_MODULES_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to load modules",
        "error",
      );
    }
  };

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
    mode: "onChange",
    defaultValues: {
      name: "",
      businessName: "",
      phone: "",
      email: "",
      city: "",
      subDomain: "",
      renewalAmount: undefined as unknown as number,
      rolesAccess: [],
      joinedDate: getTodayDateStr(),
      nextRenewalDate: calculateNextRenewalDate(getTodayDateStr()),
      status: "Active",
    },
  });

  // Watch rolesAccess for real-time checkbox state in the Add modal
  const watchedRoles = useWatch({
    control,
    name: "rolesAccess",
    defaultValue: [],
  });

  const watchedJoinedDate = useWatch({
    control,
    name: "joinedDate",
    defaultValue: getTodayDateStr(),
  });

  const watchedStatus = useWatch({
    control,
    name: "status",
    defaultValue: "Active",
  });

  // Admins from backend (server-side filtered and paginated)
  const filteredAdmins = admins;

  // ── Handle Add Admin ─────────────────────────────────────────────────────────

  const onAddSubmit = async (data: AddAdminFormData) => {
    const joined = data.joinedDate || getTodayDateStr();
    const nextRenewal =
      data.nextRenewalDate || calculateNextRenewalDate(joined);

    const formattedSubdomain = data.subDomain?.trim() || "";

    const statusApi = data.status === "Inactive" ? "INACTIVE" : "ACTIVE";

    try {
      setIsSaving(true);

      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: data.name.trim(),
          businessName: data.businessName.trim(),
          phone: data.phone.trim(),
          email: data.email.trim().toLowerCase(),
          city: data.city.trim(),
          subdomain: formattedSubdomain,
          renewalAmount: String(data.renewalAmount),
          joinedAt: joined,
          nextRenewalDate: nextRenewal,
          status: statusApi,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create admin");
      }

      const createdAdmin = mapApiAdminToAdminUser(result.data);

      if (data.rolesAccess && data.rolesAccess.length > 0 && createdAdmin.id) {
        for (const role of data.rolesAccess) {
          const matchedModule = availableModules.find(
            (m) =>
              m.name.toLowerCase().trim() === role.toLowerCase().trim() ||
              m.key.toLowerCase().trim() === role.toLowerCase().trim(),
          );
          if (matchedModule) {
            try {
              await fetch(`/api/admins/${createdAdmin.id}/modules`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  moduleId: matchedModule.id,
                }),
              });
            } catch (err) {
              console.error("GRANT_MODULE_ACCESS_ON_CREATE_ERROR:", err);
            }
          }
        }
      }

      setAdmins((prev) => [
        {
          ...createdAdmin,
          rolesAccess: data.rolesAccess || [],
        },
        ...prev,
      ]);

      reset();

      showToast(`Admin "${createdAdmin.name}" added successfully!`, "success");
      setIsAddModalOpen(false);

      // Re-fetch fresh table list from backend
      fetchAdmins();
    } catch (error) {
      console.error("CREATE_ADMIN_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to create admin",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Handle Edit Admin ──────────────────────────────────────────────────────
  // ── Handle Edit Admin ─────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!selectedAdmin) return;

    if (!selectedAdmin.name.trim()) {
      showToast("Full name is required", "error");
      return;
    }

    if (!selectedAdmin.businessName?.trim()) {
      showToast("Business name is required", "error");
      return;
    }

    if (!selectedAdmin.phone.trim()) {
      showToast("Phone number is required", "error");
      return;
    }

    if (!selectedAdmin.email.trim()) {
      showToast("Email address is required", "error");
      return;
    }

    if (!selectedAdmin.city.trim()) {
      showToast("City is required", "error");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`/api/admins/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: selectedAdmin.name.trim(),
          businessName: selectedAdmin.businessName.trim(),
          phone: selectedAdmin.phone.trim(),
          email: selectedAdmin.email.trim().toLowerCase(),
          city: selectedAdmin.city.trim(),
          subdomain: selectedAdmin.subDomain.trim() || null,
          renewalAmount: String(selectedAdmin.renewalAmount),
          joinedAt: selectedAdmin.joinedDate,
          nextRenewalDate: selectedAdmin.nextRenewalDate,
          status:
            selectedAdmin.status === "Active"
              ? "ACTIVE"
              : selectedAdmin.status === "Inactive"
                ? "INACTIVE"
                : "SUSPENDED",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update admin");
      }

      await saveAdminModules(
        selectedAdmin.id,
        originalModules,
        selectedModules,
      );

      const updatedAdmin = mapApiAdminToAdminUser(result.data);

      // Fetch latest modules
      const modulesResponse = await fetch(
        `/api/admins/${selectedAdmin.id}/modules`,
      );

      const modulesResult = await modulesResponse.json();

      if (!modulesResponse.ok || !modulesResult.success) {
        throw new Error(
          modulesResult.message || "Failed to fetch updated modules",
        );
      }

      const rolesAccess = modulesResult.data.map(
        (module: { name: string }) => module.name,
      );

      const moduleIds = modulesResult.data.map(
        (module: { moduleId: string }) => module.moduleId,
      );

      const adminWithModules = {
        ...updatedAdmin,
        rolesAccess,
      };

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === adminWithModules.id ? adminWithModules : admin,
        ),
      );

      setSelectedAdmin(adminWithModules);
      setOriginalAdmin(adminWithModules);

      setSelectedModules(moduleIds);
      setOriginalModules(moduleIds);
      setIsEditing(false);

      showToast(
        `Admin "${updatedAdmin.name}" updated successfully!`,
        "success",
      );

      // Re-fetch fresh table list from backend
      fetchAdmins();
    } catch (error) {
      console.error("UPDATE_ADMIN_ERROR:", error);

      showToast(
        error instanceof Error ? error.message : "Failed to update admin",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const saveAdminModules = async (
    adminId: string,
    previousModules: string[],
    newModules: string[],
  ) => {
    const previousSet = new Set(previousModules);
    const newSet = new Set(newModules);

    const modulesToGrant = newModules.filter(
      (moduleId) => !previousSet.has(moduleId),
    );

    const modulesToRevoke = previousModules.filter(
      (moduleId) => !newSet.has(moduleId),
    );

    // Grant newly selected modules
    for (const moduleId of modulesToGrant) {
      const response = await fetch(`/api/admins/${adminId}/modules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to grant module access");
      }
    }

    // Revoke unselected modules
    for (const moduleId of modulesToRevoke) {
      const response = await fetch(`/api/admins/${adminId}/modules`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moduleId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to revoke module access");
      }
    }
  };

  // ── Handle Delete Admin ──────────────────────────────────────────────────────

  const handleDeleteAdmin = async (id: string) => {
    const target = admins.find((admin) => admin.id === id);
    const prevAdmin = selectedAdmin;

    const confirmed = await confirmDelete(`admin "${target?.name ?? id}"`);

    if (!confirmed) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`/api/admins/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete admin");
      }

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));

      setSelectedAdmin(null);
      setIsEditing(false);

      showToast(`Admin "${target?.name ?? id}" has been deleted.`, "error");

      // Re-fetch fresh table list from backend
      fetchAdmins();
    } catch (error) {
      console.error("DELETE_ADMIN_ERROR:", error);

      setSelectedAdmin(prevAdmin);

      showToast(
        error instanceof Error ? error.message : "Failed to delete admin",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
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
    {
      header: "Contact",
      cell: (admin) => (
        <div>
          <div style={{ fontWeight: 500, color: colors.text.primary }}>
            {admin.email}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: colors.text.muted,
              marginTop: "2px",
            }}
          >
            {admin.phone}
          </div>
        </div>
      ),
    },
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
      header: "Status",
      cell: (admin) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: 600,
            background:
              admin.status === "Active"
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(239, 68, 68, 0.12)",
            color:
              admin.status === "Active"
                ? colors.status.success
                : colors.status.error,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background:
                admin.status === "Active"
                  ? colors.status.success
                  : colors.status.error,
            }}
          />
          {admin.status}
        </span>
      ),
    },
    {
      header: "Action",
      align: "right",
      cell: (admin) => (
        <button
          onClick={() => {
            setIsEditing(false);

            // 1. Instantly open View details screen using current table row data (0ms delay)
            setSelectedAdmin({ ...admin });
            setOriginalAdmin({ ...admin });

            // 2. Fetch full admin details + assigned modules in parallel in the background
            Promise.all([
              fetch(`/api/admins/${admin.id}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                cache: "no-store",
              })
                .then(async (res) => {
                  if (!res.ok) return null;
                  const json = await res.json();
                  return json?.success ? json.data : null;
                })
                .catch(() => null),
              fetchAssignedModules(admin.id).catch(() => []),
            ]).then(([apiAdminData, modules]) => {
              const rolesAccess = Array.isArray(modules)
                ? modules.map(
                    (module: { moduleId: string; name: string; key: string }) =>
                      module.name,
                  )
                : [];
              const moduleIds = Array.isArray(modules)
                ? modules.map((module: { moduleId: string }) => module.moduleId)
                : [];

              setOriginalModules(moduleIds);
              setSelectedModules(moduleIds);

              if (apiAdminData) {
                const mappedAdmin = mapApiAdminToAdminUser(apiAdminData);
                const fullAdmin = {
                  ...mappedAdmin,
                  rolesAccess,
                };
                setSelectedAdmin((prev) =>
                  prev?.id === admin.id ? fullAdmin : prev,
                );
                setOriginalAdmin((prev) =>
                  prev?.id === admin.id ? fullAdmin : prev,
                );
              } else {
                setSelectedAdmin((prev) =>
                  prev?.id === admin.id ? { ...prev, rolesAccess } : prev,
                );
                setOriginalAdmin((prev) =>
                  prev?.id === admin.id ? { ...prev, rolesAccess } : prev,
                );
              }
            });
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
      selectedAdmin.renewalAmount,
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
                setOriginalAdmin(null);
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
                  {selectedAdmin.name}
                </h1>

                <span
                  style={{
                    background:
                      selectedAdmin.status === "Active"
                        ? "rgba(34, 197, 94, 0.12)"
                        : "rgba(239, 68, 68, 0.12)",
                    color:
                      selectedAdmin.status === "Active"
                        ? colors.status.success
                        : colors.status.error,
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
                {selectedAdmin.businessName
                  ? `${selectedAdmin.businessName} • `
                  : ""}
                {selectedAdmin.city} •{" "}
                {selectedAdmin.subDomain || "No subdomain"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    if (originalAdmin) {
                      setSelectedAdmin({ ...originalAdmin });
                    }
                    setSelectedModules([...originalModules]);
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
                  disabled={isSaving}
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
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (selectedAdmin) {
                      setOriginalAdmin({ ...selectedAdmin });
                      if (selectedModules.length === 0) {
                        fetchAdminModules(selectedAdmin.id);
                      }
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
            <h2
              style={{
                fontSize: "16px",
                margin: 0,
                fontWeight: 700,
                fontFamily: typography.fontFamily.sans,
                color: colors.text.primary,
              }}
            >
              Edit Admin Information
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
                  Full Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Enter full name"
                  value={selectedAdmin.name}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      name: e.target.value.slice(0, 50),
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Business Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Enter business name"
                  value={selectedAdmin.businessName || ""}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      businessName: e.target.value
                        .replace(/[^a-zA-Z0-9 ]/g, "")
                        .slice(0, 50),
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
                  Phone Number <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="Enter phone number"
                  value={selectedAdmin.phone}
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
                    setSelectedAdmin({
                      ...selectedAdmin,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Email Address <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={selectedAdmin.email}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      email: e.target.value,
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
                  City <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={selectedAdmin.city}
                  onChange={(e) =>
                    setSelectedAdmin({ ...selectedAdmin, city: e.target.value })
                  }
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Sub-Domain
                </label>
                <input
                  type="text"
                  placeholder="domain.ticketingsolution.in"
                  value={selectedAdmin.subDomain}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      subDomain: e.target.value,
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
                  Renewal Amount (₹) <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter renewal amount"
                  value={selectedAdmin.renewalAmount || ""}
                  onChange={(e) =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      renewalAmount:
                        Number(e.target.value.replace(/\D/g, "")) || 0,
                    })
                  }
                  style={inputStyle(false)}
                />
              </div>
            </div>

            {/* Joined Date & Next Renewal Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Joined Date
                </label>
                <input
                  type="date"
                  value={selectedAdmin.joinedDate || ""}
                  onChange={(e) => {
                    const newJoined = e.target.value;
                    const autoNextRenewal = calculateNextRenewalDate(newJoined);
                    // If current nextRenewalDate is before the new joinedDate, reset it
                    const currentNext = selectedAdmin.nextRenewalDate;
                    const clampedNext =
                      currentNext && currentNext >= newJoined
                        ? currentNext
                        : autoNextRenewal || newJoined;
                    setSelectedAdmin({
                      ...selectedAdmin,
                      joinedDate: newJoined,
                      nextRenewalDate: clampedNext,
                    });
                  }}
                  style={inputStyle(false)}
                />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>
                  Next Renewal Date
                </label>
                <input
                  type="date"
                  value={selectedAdmin.nextRenewalDate || ""}
                  min={selectedAdmin.joinedDate || ""}
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

            {/* Status Toggle */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600 }}>
                Status
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedAdmin({
                      ...selectedAdmin,
                      status:
                        selectedAdmin.status === "Active"
                          ? "Inactive"
                          : "Active",
                    })
                  }
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "26px",
                    borderRadius: "13px",
                    border: "none",
                    background:
                      selectedAdmin.status === "Active" ? "#22C55E" : "#D1D5DB",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: "3px",
                      left: selectedAdmin.status === "Active" ? "25px" : "3px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color:
                      selectedAdmin.status === "Active"
                        ? "#22C55E"
                        : colors.text.muted,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  {selectedAdmin.status === "Active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Access Roles (checkbox grid) */}
            <div
              style={{
                border: `1.5px solid ${colors.login.inputBorder}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: colors.sidebar.bg,
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
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
                    checked={
                      availableModules.length > 0 &&
                      availableModules.every((m) =>
                        selectedModules.includes(m.id),
                      )
                    }
                    // onChange={(e) => {
                    //   setSelectedModules(
                    //     e.target.checked
                    //       ? availableModules.map((m) => m.id)
                    //       : [],
                    //   );
                    // }}
                    onChange={(e) => {
                      setSelectedModules(
                        e.target.checked
                          ? [
                              ...new Set([
                                ...originalModules,
                                ...availableModules.map((m) => m.id),
                              ]),
                            ]
                          : originalModules.filter(
                              (moduleId) =>
                                !availableModules.some(
                                  (m) => m.id === moduleId,
                                ),
                            ),
                      );
                    }}
                    style={{
                      accentColor: colors.brand.primary,
                      width: "14px",
                      height: "14px",
                    }}
                  />
                  Select All
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0",
                  background: "#FFFFFF",
                }}
              >
                {availableModules.map((module, idx) => {
                  const isChecked = selectedModules.includes(module.id);

                  return (
                    <label
                      key={module.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        cursor: "pointer",
                        borderTop:
                          idx >= 2
                            ? `1px solid ${colors.header.border}`
                            : undefined,
                        borderRight:
                          idx % 2 === 0
                            ? `1px solid ${colors.header.border}`
                            : undefined,
                        background: isChecked
                          ? "rgba(35, 114, 165, 0.06)"
                          : "#FFFFFF",
                        transition: "background 0.15s",
                        userSelect: "none",
                        fontFamily: typography.fontFamily.sans,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          setSelectedModules((prev) =>
                            e.target.checked
                              ? [...prev, module.id]
                              : prev.filter((id) => id !== module.id),
                          );
                        }}
                        style={{
                          accentColor: colors.brand.accent,
                          width: "14px",
                          height: "14px",
                          flexShrink: 0,
                        }}
                      />

                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked
                            ? colors.brand.accent
                            : colors.text.primary,
                        }}
                      >
                        {module.name}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div
                style={{
                  padding: "8px 16px",
                  background: "#F8FAFC",
                  borderTop: `1px solid ${colors.header.border}`,
                  fontSize: "12px",
                  color: colors.text.muted,
                }}
              >
                {selectedModules.length} of {availableModules.length} modules
                selected
              </div>
            </div>
          </div>
        ) : (
          /* ── Full Details View (Read Only Cards Layout) ── */
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Grid of info cards */}
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
                  <Building size={18} color={colors.brand.accent} />
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: typography.fontFamily.sans,
                      color: colors.text.primary,
                    }}
                  >
                    Admin Contact Details
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
                      <Building2 size={12} /> Business Name
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                        color: colors.text.primary,
                      }}
                    >
                      {selectedAdmin.businessName || "—"}
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
                      <Phone size={12} /> Phone Number
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedAdmin.phone}
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
                      {selectedAdmin.email}
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
                      {selectedAdmin.city}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "block",
                      }}
                    >
                      Account Status
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color:
                          selectedAdmin.status === "Active"
                            ? colors.status.success
                            : colors.status.error,
                      }}
                    >
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingBottom: "12px",
                    borderBottom: `1px solid ${colors.header.border}`,
                  }}
                >
                  <Globe size={18} color={colors.brand.accent} />
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: typography.fontFamily.sans,
                      color: colors.text.primary,
                    }}
                  >
                    Domain & Renewal Information
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
                        display: "block",
                      }}
                    >
                      Sub-domain
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: colors.brand.accent,
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedAdmin.subDomain}
                    </strong>
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: colors.text.muted,
                        display: "block",
                      }}
                    >
                      Renewal Amount
                    </span>
                    <strong
                      style={{
                        fontSize: "14px",
                        color: colors.text.primary,
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      ₹{selectedAdmin.renewalAmount.toLocaleString("en-IN")}
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
                      <Calendar size={12} /> Joined Date
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
                      {selectedAdmin.joinedDate}
                    </span>
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
                      <Calendar size={12} /> Next Renewal Date
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: colors.brand.accent,
                        marginTop: "2px",
                        display: "block",
                      }}
                    >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${colors.header.border}`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <History size={18} color={colors.brand.accent} />
                  <h3
                    style={{
                      fontSize: "15px",
                      margin: 0,
                      fontWeight: 700,
                      fontFamily: typography.fontFamily.sans,
                      color: colors.text.primary,
                    }}
                  >
                    Past Renewals History Log ({pastRenewals.length})
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: colors.text.muted,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Annual cycle starting from {selectedAdmin.joinedDate}
                </span>
              </div>

              <DataTable
                columns={[
                  {
                    header: "Renewal Cycle",
                    cell: (item) => (
                      <span
                        style={{ fontWeight: 700, color: colors.brand.accent }}
                      >
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
                      <span
                        style={{ fontWeight: 600, color: colors.text.primary }}
                      >
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${colors.header.border}`,
                }}
              >
                <ShieldCheck size={18} color={colors.brand.accent} />
                <h3
                  style={{
                    fontSize: "15px",
                    margin: 0,
                    fontWeight: 700,
                    fontFamily: typography.fontFamily.sans,
                    color: colors.text.primary,
                  }}
                >
                  Assigned Module Access Roles (
                  {selectedAdmin.rolesAccess.length})
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
            Manage platform admins — their domains, permissions, and renewal
            details.
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
        {/* Filter by Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color={colors.brand.accent} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            Status:
          </span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
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
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Filter by City */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color={colors.brand.accent} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            City:
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

        {/* Filter by Joined Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Calendar size={16} color={colors.brand.accent} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.sans,
            }}
          >
            Joined Date:
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              style={{
                height: "38px",
                borderRadius: "8px",
                border: `1px solid ${colors.header.border}`,
                padding: "0 10px",
                fontFamily: typography.fontFamily.sans,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.brand.accent,
                outline: "none",
                cursor: "pointer",
                background: "#FFFFFF",
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
            minWidth: "220px",
          }}
        >
          <Search size={18} color={colors.text.muted} />
          <input
            type="text"
            placeholder="Search admin by name, number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: "13px",
              background: "transparent",
              fontFamily: typography.fontFamily.sans,
              color: colors.text.primary,
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
      </div>

      {/* ── Reusable DataTable UI (with S.No column & server-side pagination) ── */}
      <DataTable
        columns={columns}
        data={admins}
        keyExtractor={(a) => a.id}
        pageSize={PAGE_SIZE}
        isLoading={isLoadingAdmins}
        emptyMessage="No admin records found."
        pagination={{
          page: currentPage,
          limit: PAGE_SIZE,
          total: totalCount,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPreviousPage: hasPreviousPage,
          onPageChange: (p) => {
            setCurrentPage(p);
            fetchAdmins(p);
          },
        }}
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
              <h2
                style={{
                  fontSize: "18px",
                  margin: 0,
                  fontWeight: 700,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                Add New Admin
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
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {/* Full Name */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
                  Full Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="Enter full name"
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
                {/* Phone */}
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

                {/* City */}
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

              {/* Email */}
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                {/* Sub-domain */}
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    Sub-domain
                  </label>
                  <input
                    type="text"
                    placeholder="domain.ticketingsolution.in"
                    {...register("subDomain")}
                    style={inputStyle(!!errors.subDomain)}
                  />
                  <FieldError message={errors.subDomain?.message} />
                </div>

                {/* Renewal Amount */}
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    Renewal Amount (₹){" "}
                    <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter renewal amount"
                    {...register("renewalAmount", { valueAsNumber: true })}
                    onInput={(e) => {
                      const val = e.currentTarget.value.replace(/\D/g, "");
                      e.currentTarget.value = val;
                      setValue(
                        "renewalAmount",
                        val ? Number(val) : (undefined as unknown as number),
                        { shouldValidate: true },
                      );
                    }}
                    style={inputStyle(!!errors.renewalAmount)}
                  />
                  <FieldError message={errors.renewalAmount?.message} />
                </div>
              </div>

              {/* Joined Date & Next Renewal Date */}
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
                    Joined Date{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        color: colors.text.muted,
                        fontWeight: 400,
                      }}
                    >
                      (Default Today)
                    </span>
                  </label>
                  <input
                    type="date"
                    {...register("joinedDate")}
                    defaultValue={getTodayDateStr()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setValue("joinedDate", val, { shouldValidate: true });
                      setValue(
                        "nextRenewalDate",
                        calculateNextRenewalDate(val),
                        { shouldValidate: true },
                      );
                    }}
                    style={inputStyle(false)}
                  />
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
                    Next Renewal Date{" "}
                    <span
                      style={{
                        fontSize: "11px",
                        color: colors.text.muted,
                        fontWeight: 400,
                      }}
                    >
                      (Auto-calculated)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={calculateNextRenewalDate(
                      watchedJoinedDate || getTodayDateStr(),
                    )}
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

              {/* Business Name + Admin Status row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  alignItems: "start",
                }}
              >
                {/* Business Name */}
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                    }}
                  >
                    Business Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Enter business name"
                    {...register("businessName")}
                    onInput={(e) => {
                      const val = e.currentTarget.value
                        .replace(/[^a-zA-Z0-9 ]/g, "")
                        .slice(0, 50);
                      e.currentTarget.value = val;
                      setValue("businessName", val, { shouldValidate: true });
                    }}
                    style={inputStyle(!!errors.businessName)}
                  />
                  <FieldError message={errors.businessName?.message} />
                </div>

                {/* Status Toggle (Active / Inactive) */}
                <div>
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: colors.text.primary,
                      fontFamily: typography.fontFamily.sans,
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Admin Status
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      background: "#F8FAFC",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.header.border}`,
                      height: "40px",
                      boxSizing: "border-box",
                      marginTop: "4px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const nextStatus =
                          watchedStatus === "Active" ? "Inactive" : "Active";
                        setValue("status", nextStatus, {
                          shouldValidate: true,
                        });
                      }}
                      style={{
                        position: "relative",
                        width: "44px",
                        height: "24px",
                        background:
                          watchedStatus === "Active" ? "#16A34A" : "#94A3B8",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          background: "#FFFFFF",
                          borderRadius: "50%",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          transform:
                            watchedStatus === "Active"
                              ? "translateX(20px)"
                              : "translateX(0px)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color:
                          watchedStatus === "Active" ? "#16A34A" : "#64748B",
                        fontFamily: typography.fontFamily.sans,
                      }}
                    >
                      {watchedStatus === "Active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Access Roles */}
              <div>
                <label
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.sans,
                  }}
                >
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
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#FFFFFF",
                        fontFamily: typography.fontFamily.sans,
                      }}
                    >
                      Module Access
                    </span>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                        fontSize: "11px",
                        color: colors.brand.primary,
                        fontWeight: 600,
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          watchedRoles.length === ALL_ROLES.length &&
                          ALL_ROLES.length > 0
                        }
                        onChange={(e) =>
                          setValue(
                            "rolesAccess",
                            e.target.checked ? [...ALL_ROLES] : [],
                            { shouldValidate: true },
                          )
                        }
                        style={{
                          accentColor: colors.brand.primary,
                          width: "13px",
                          height: "13px",
                        }}
                      />
                      Select All
                    </label>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      background: "#FFFFFF",
                    }}
                  >
                    {ALL_ROLES.map((role, idx) => {
                      const isChecked = watchedRoles.includes(role);
                      return (
                        <label
                          key={role}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderTop:
                              idx >= 2
                                ? `1px solid ${colors.header.border}`
                                : undefined,
                            borderRight:
                              idx % 2 === 0
                                ? `1px solid ${colors.header.border}`
                                : undefined,
                            background: isChecked
                              ? "rgba(35, 114, 165, 0.06)"
                              : "#FFFFFF",
                            transition: "background 0.15s",
                            userSelect: "none",
                            fontFamily: typography.fontFamily.sans,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...watchedRoles, role]
                                : watchedRoles.filter((r) => r !== role);
                              setValue("rolesAccess", newRoles, {
                                shouldValidate: true,
                              });
                            }}
                            style={{
                              accentColor: colors.brand.accent,
                              width: "13px",
                              height: "13px",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: isChecked ? 600 : 400,
                              color: isChecked
                                ? colors.brand.accent
                                : colors.text.primary,
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
                <FieldError
                  message={errors.rolesAccess?.message as string | undefined}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
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
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
