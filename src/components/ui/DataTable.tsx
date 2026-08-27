"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { colors, typography } from "@/lib/theme";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface ServerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
  pagination?: ServerPagination;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize = 5,
  emptyMessage = "No records found.",
  isLoading = false,
  pagination,
}: DataTableProps<T>) {
  const [clientPage, setClientPage] = useState(1);

  const isServer = Boolean(pagination);
  const totalEntries = isServer ? pagination!.total : data.length;
  const effectivePageSize = isServer ? pagination!.limit : pageSize;
  const totalPages = isServer
    ? pagination!.totalPages
    : Math.max(1, Math.ceil(totalEntries / effectivePageSize));

  const safeClientPage =
    clientPage > totalPages && totalPages > 0 ? 1 : clientPage;
  const activePage = isServer ? pagination!.page : safeClientPage;

  const startIndex = (activePage - 1) * effectivePageSize;
  const displayData = isServer
    ? data
    : data.slice(startIndex, startIndex + effectivePageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === activePage) return;
    if (isServer && pagination?.onPageChange) {
      pagination.onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const hasPrev = isServer
    ? (pagination?.hasPreviousPage ?? activePage > 1)
    : activePage > 1;
  const hasNext = isServer
    ? (pagination?.hasNextPage ?? activePage < totalPages)
    : activePage < totalPages;

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (activePage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (activePage >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(activePage - 1);
      pages.push(activePage);
      pages.push(activePage + 1);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        overflow: "hidden",
        border: `1px solid ${colors.header.border}`,
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontFamily: typography.fontFamily.sans,
            fontSize: "14px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "#F8FAFC",
                borderBottom: `1px solid ${colors.header.border}`,
                color: colors.text.muted,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {/* Mandatory S.No Header */}
              <th style={{ padding: "14px 16px", width: "60px", textAlign: "center" }}>
                S.No
              </th>

              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 20px",
                    textAlign: col.align || "left",
                    width: col.width,
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: effectivePageSize }).map((_, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: `1px solid ${colors.header.border}`,
                  }}
                >
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "14px",
                        borderRadius: "4px",
                        background: "linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite",
                        margin: "0 auto",
                      }}
                    />
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: "16px 20px" }}>
                      <div
                        style={{
                          width: cIdx === 0 ? "130px" : cIdx % 2 === 0 ? "90px" : "110px",
                          height: "14px",
                          borderRadius: "4px",
                          background: "linear-gradient(90deg, #f0f4f8 25%, #e2e8f0 50%, #f0f4f8 75%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    color: colors.text.muted,
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => {
                const globalIndex = startIndex + idx + 1;
                return (
                  <tr
                    key={keyExtractor(row)}
                    style={{
                      borderBottom: `1px solid ${colors.header.border}`,
                      transition: "background 0.15s ease",
                    }}
                  >
                    {/* S.No Data Cell */}
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: colors.text.muted,
                        fontSize: "13px",
                      }}
                    >
                      {globalIndex}
                    </td>

                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: "14px 20px",
                          textAlign: col.align || "left",
                        }}
                      >
                        {col.cell
                          ? col.cell(row, globalIndex)
                          : col.accessorKey
                          ? (row[col.accessorKey] as React.ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination UI */}
      {totalEntries > 0 && totalPages > 1 && (
        <div
          style={{
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${colors.header.border}`,
            background: "#F8FAFC",
            fontSize: "13px",
            fontFamily: typography.fontFamily.sans,
            color: colors.text.muted,
          }}
        >
          <div>
            Showing <strong style={{ color: colors.text.primary }}>{startIndex + 1}</strong> to{" "}
            <strong style={{ color: colors.text.primary }}>
              {Math.min(startIndex + effectivePageSize, totalEntries)}
            </strong>{" "}
            of <strong style={{ color: colors.text.primary }}>{totalEntries}</strong> entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={!hasPrev}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.header.border}`,
                background: "#FFFFFF",
                cursor: !hasPrev ? "not-allowed" : "pointer",
                opacity: !hasPrev ? 0.5 : 1,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {getPageNumbers().map((pageNum, pIdx) => {
              if (pageNum === "...") {
                return (
                  <span
                    key={`ellipsis-${pIdx}`}
                    style={{
                      padding: "0 4px",
                      color: colors.text.muted,
                      fontWeight: 600,
                    }}
                  >
                    ...
                  </span>
                );
              }

              const num = Number(pageNum);
              const isActive = num === activePage;

              return (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    border: isActive
                      ? `1px solid ${colors.brand.primary}`
                      : `1px solid ${colors.header.border}`,
                    background: isActive ? colors.brand.primary : "#FFFFFF",
                    color: isActive ? colors.sidebar.activeText : colors.text.primary,
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {num}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={!hasNext}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.header.border}`,
                background: "#FFFFFF",
                cursor: !hasNext ? "not-allowed" : "pointer",
                opacity: !hasNext ? 0.5 : 1,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
