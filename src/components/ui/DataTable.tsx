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

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize = 5,
  emptyMessage = "No records found.",
  isLoading = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalRows = data.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  // If current page is beyond total pages (e.g. after filter), reset to 1
  const safePage = currentPage > totalPages && totalPages > 0 ? 1 : currentPage;

  const startIndex = (safePage - 1) * pageSize;
  const paginatedData = data.slice(startIndex, startIndex + pageSize);

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
              Array.from({ length: pageSize }).map((_, rIdx) => (
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
              paginatedData.map((row, idx) => {
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

      {/* Pagination UI — Shown ONLY IF totalRows > pageSize (5) */}
      {totalRows > pageSize && (
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
              {Math.min(startIndex + pageSize, totalRows)}
            </strong>{" "}
            of <strong style={{ color: colors.text.primary }}>{totalRows}</strong> entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={safePage === 1}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.header.border}`,
                background: "#FFFFFF",
                cursor: safePage === 1 ? "not-allowed" : "pointer",
                opacity: safePage === 1 ? 0.5 : 1,
                fontSize: "13px",
                fontWeight: 600,
                color: colors.text.primary,
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  border:
                    pageNum === safePage
                      ? `1px solid ${colors.brand.primary}`
                      : `1px solid ${colors.header.border}`,
                  background: pageNum === safePage ? colors.brand.primary : "#FFFFFF",
                  color: pageNum === safePage ? colors.sidebar.activeText : colors.text.primary,
                  fontWeight: pageNum === safePage ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={safePage === totalPages}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "6px",
                border: `1px solid ${colors.header.border}`,
                background: "#FFFFFF",
                cursor: safePage === totalPages ? "not-allowed" : "pointer",
                opacity: safePage === totalPages ? 0.5 : 1,
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
