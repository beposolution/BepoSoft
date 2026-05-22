import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Col,
  Row,
  Input,
  Button,
  Badge,
  Table,
} from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx-js-style";

const DataLog = () => {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("active");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(50);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  document.title = "Data Log Details | Beposoft";

  const parseLooseJSON = (s) => {
    if (typeof s !== "string") return null;

    try {
      return JSON.parse(s);
    } catch (_) {}

    try {
      let t = s.trim();

      if (
        !(
          (t.startsWith("{") && t.endsWith("}")) ||
          (t.startsWith("[") && t.endsWith("]"))
        )
      ) {
        return null;
      }

      t = t.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
      t = t.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

      return JSON.parse(t);
    } catch {
      return null;
    }
  };

  const normalizeAny = (value) => {
    if (value == null) return {};
    if (typeof value === "object") return value;

    if (typeof value === "string") {
      const parsed = parseLooseJSON(value);
      return parsed ?? { value };
    }

    return { value: String(value) };
  };

  const unwrapDataIfLoose = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    for (const key of ["Data", "data"]) {
      if (key in obj && typeof obj[key] === "string") {
        const parsed = parseLooseJSON(obj[key]);

        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    }

    return obj;
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("page_size", perPageData);

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (startDate) {
        params.append("start_date", startDate);
      }

      if (endDate) {
        params.append("end_date", endDate);
      }

      const { data } = await axios.get(
        `${import.meta.env.VITE_APP_KEY}datalog/?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const logsArray = Array.isArray(data) ? data : data.results || [];

      const normalized = logsArray.map((log) => {
        const before = unwrapDataIfLoose(normalizeAny(log.before_data));
        const after = unwrapDataIfLoose(normalizeAny(log.after_data));

        return {
          ...log,
          before_data: before,
          after_data: after,
        };
      });

      setLogs(normalized);
      setTotalCount(data.count || normalized.length);
    } catch (error) {
      console.error(error);
      toast.error("Error fetching logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token, currentPage, searchQuery, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const formatDateTime = (iso) => {
    try {
      const date = new Date(iso);

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return iso || "";
    }
  };

  const safeObj = (maybe) => unwrapDataIfLoose(normalizeAny(maybe));

  const stringifyCell = (value) => {
    if (value == null) return "-";

    if (Array.isArray(value) || typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const buildDetailsRows = (rows) => {
    const details = [];

    rows.forEach((log) => {
      const before = safeObj(log.before_data);
      const after = safeObj(log.after_data);

      const keys = Array.from(
        new Set([
          ...(before ? Object.keys(before) : []),
          ...(after ? Object.keys(after) : []),
        ])
      );

      if (keys.length === 0) {
        details.push({
          Staff: log.user_name || "",
          Invoice: log.order_name || "",
          Field: "-",
          "Data (Before)": "-",
          "Data (After)": "-",
          "Date & Time": formatDateTime(log.created_at),
        });

        return;
      }

      keys.forEach((key) => {
        const beforeValue =
          before && Object.prototype.hasOwnProperty.call(before, key)
            ? before[key]
            : "-";

        const afterValue =
          after && Object.prototype.hasOwnProperty.call(after, key)
            ? after[key]
            : "-";

        details.push({
          Staff: log.user_name || "",
          Invoice: log.order_name || "",
          Field: key,
          "Data (Before)": stringifyCell(beforeValue),
          "Data (After)": stringifyCell(afterValue),
          "Date & Time": formatDateTime(log.created_at),
        });
      });
    });

    return details;
  };

  const buildSummarySheets = (rows) => {
    const byStaffMap = new Map();

    rows.forEach((log) => {
      const staff = log.user_name || "Unknown";
      byStaffMap.set(staff, (byStaffMap.get(staff) || 0) + 1);
    });

    const byStaff = Array.from(byStaffMap.entries()).map(([staff, count]) => ({
      Staff: staff,
      "Log Count": count,
    }));

    const byDateMap = new Map();

    rows.forEach((log) => {
      const dateObj = new Date(log.created_at);

      const day = isNaN(dateObj.getTime())
        ? "Invalid"
        : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(dateObj.getDate()).padStart(2, "0")}`;

      byDateMap.set(day, (byDateMap.get(day) || 0) + 1);
    });

    const byDate = Array.from(byDateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({
        Date: date,
        "Log Count": count,
      }));

    return {
      byStaff,
      byDate,
    };
  };

  const exportToExcel = () => {
    const rows = logs;

    if (!rows || rows.length === 0) {
      toast.warning("No data available to export");
      return;
    }

    toast.info("Exporting current page data only");

    const wb = XLSX.utils.book_new();

    const borderThin = {
      top: { style: "thin", color: { rgb: "CBD5E1" } },
      bottom: { style: "thin", color: { rgb: "CBD5E1" } },
      left: { style: "thin", color: { rgb: "CBD5E1" } },
      right: { style: "thin", color: { rgb: "CBD5E1" } },
    };

    const mainTitleStyle = {
      font: {
        bold: true,
        sz: 18,
        color: { rgb: "111827" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      fill: {
        fgColor: { rgb: "EAF0FB" },
      },
      border: borderThin,
    };

    const subTitleStyle = {
      font: {
        bold: true,
        sz: 11,
        color: { rgb: "475569" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      fill: {
        fgColor: { rgb: "F3F6FB" },
      },
      border: borderThin,
    };

    const headerStyle = {
      font: {
        bold: true,
        sz: 11,
        color: { rgb: "1E293B" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "EAF0FB" },
      },
      border: borderThin,
    };

    const oldHeaderStyle = {
      font: {
        bold: true,
        sz: 11,
        color: { rgb: "991B1B" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "FEE2E2" },
      },
      border: borderThin,
    };

    const newHeaderStyle = {
      font: {
        bold: true,
        sz: 11,
        color: { rgb: "166534" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "DCFCE7" },
      },
      border: borderThin,
    };

    const normalCellStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "0F172A" },
      },
      alignment: {
        vertical: "top",
        wrapText: true,
      },
      border: borderThin,
    };

    const numberCellStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "334155" },
      },
      alignment: {
        horizontal: "center",
        vertical: "top",
        wrapText: true,
      },
      border: borderThin,
    };

    const staffCellStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "1D4ED8" },
      },
      alignment: {
        vertical: "top",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "DBEAFE" },
      },
      border: borderThin,
    };

    const invoiceCellStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "0F172A" },
      },
      alignment: {
        horizontal: "center",
        vertical: "top",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "F1F5F9" },
      },
      border: borderThin,
    };

    const oldDataStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "991B1B" },
      },
      alignment: {
        vertical: "top",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "FFF7F7" },
      },
      border: borderThin,
    };

    const newDataStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "166534" },
      },
      alignment: {
        vertical: "top",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "F0FDF4" },
      },
      border: borderThin,
    };

    const dateCellStyle = {
      font: {
        bold: true,
        sz: 10,
        color: { rgb: "334155" },
      },
      alignment: {
        horizontal: "center",
        vertical: "top",
        wrapText: true,
      },
      fill: {
        fgColor: { rgb: "F8FAFC" },
      },
      border: borderThin,
    };

    const sectionStyle = {
      font: {
        bold: true,
        sz: 12,
        color: { rgb: "FFFFFF" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      fill: {
        fgColor: { rgb: "1D4ED8" },
      },
      border: borderThin,
    };

    const formatExcelValue = (value) => {
      if (value == null) return "-";

      if (Array.isArray(value)) {
        return value.map((item) => formatExcelValue(item)).join(", ");
      }

      if (typeof value === "object") {
        return Object.entries(value)
          .map(([key, val]) => `${key}: ${formatExcelValue(val)}`)
          .join("\n");
      }

      return String(value);
    };

    const formatDataBlock = (data) => {
      const safeData = safeObj(data);

      if (!safeData || typeof safeData !== "object" || Array.isArray(safeData)) {
        return formatExcelValue(safeData);
      }

      const entries = Object.entries(safeData);

      if (entries.length === 0) {
        return "-";
      }

      return entries
        .map(([key, value]) => `${key}: ${formatExcelValue(value)}`)
        .join("\n");
    };

    const excelData = [];

    excelData.push(["Data Log Details", "", "", "", "", ""]);
    excelData.push([
      "Compact audit table with before and after values",
      "",
      "",
      "",
      "",
      "",
    ]);
    excelData.push([
      `Total Logs: ${totalCount}`,
      "",
      `Current Page Showing: ${logs.length}`,
      "",
      `Exported: ${formatDateTime(new Date().toISOString())}`,
      "",
    ]);
    excelData.push([]);
    excelData.push(["#", "Staff", "Invoice", "Old Data", "Changed To", "Date & Time"]);

    rows.forEach((log, index) => {
      excelData.push([
        (currentPage - 1) * perPageData + index + 1,
        log.user_name || "-",
        log.order_name || "-",
        formatDataBlock(log.before_data),
        formatDataBlock(log.after_data),
        formatDateTime(log.created_at),
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },
      { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } },
    ];

    ws["!cols"] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 18 },
      { wch: 55 },
      { wch: 55 },
      { wch: 24 },
    ];

    ws["!rows"] = [
      { hpt: 30 },
      { hpt: 24 },
      { hpt: 26 },
      { hpt: 8 },
      { hpt: 30 },
      ...rows.map((log) => {
        const beforeText = formatDataBlock(log.before_data);
        const afterText = formatDataBlock(log.after_data);

        const beforeLines = beforeText.split("\n").length;
        const afterLines = afterText.split("\n").length;

        const maxLines = Math.max(beforeLines, afterLines, 2);

        return {
          hpt: Math.min(Math.max(maxLines * 18, 48), 220),
        };
      }),
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: "s", v: "" };
        }

        if (row === 0) {
          ws[cellAddress].s = mainTitleStyle;
        } else if (row === 1) {
          ws[cellAddress].s = subTitleStyle;
        } else if (row === 2) {
          ws[cellAddress].s = sectionStyle;
        } else if (row === 4) {
          if (col === 3) {
            ws[cellAddress].s = oldHeaderStyle;
          } else if (col === 4) {
            ws[cellAddress].s = newHeaderStyle;
          } else {
            ws[cellAddress].s = headerStyle;
          }
        } else if (row >= 5) {
          if (col === 0) {
            ws[cellAddress].s = numberCellStyle;
          } else if (col === 1) {
            ws[cellAddress].s = staffCellStyle;
          } else if (col === 2) {
            ws[cellAddress].s = invoiceCellStyle;
          } else if (col === 3) {
            ws[cellAddress].s = oldDataStyle;
          } else if (col === 4) {
            ws[cellAddress].s = newDataStyle;
          } else if (col === 5) {
            ws[cellAddress].s = dateCellStyle;
          } else {
            ws[cellAddress].s = normalCellStyle;
          }
        }
      }
    }

    ws["!freeze"] = {
      xSplit: 0,
      ySplit: 5,
    };

    XLSX.utils.book_append_sheet(wb, ws, "Data Log Details");

    const { byStaff, byDate } = buildSummarySheets(rows);

    const createSummarySheet = (title, subtitle, data, headers) => {
      const sheetData = [];

      sheetData.push([title, ""]);
      sheetData.push([subtitle, ""]);
      sheetData.push([]);
      sheetData.push(headers);

      data.forEach((item) => {
        sheetData.push(headers.map((header) => item[header] ?? "-"));
      });

      const sheet = XLSX.utils.aoa_to_sheet(sheetData);

      sheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
      ];

      sheet["!cols"] = headers.map(() => ({ wch: 28 }));

      const summaryRange = XLSX.utils.decode_range(sheet["!ref"]);

      for (let row = summaryRange.s.r; row <= summaryRange.e.r; row++) {
        for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

          if (!sheet[cellAddress]) {
            sheet[cellAddress] = { t: "s", v: "" };
          }

          if (row === 0) {
            sheet[cellAddress].s = mainTitleStyle;
          } else if (row === 1) {
            sheet[cellAddress].s = subTitleStyle;
          } else if (row === 3) {
            sheet[cellAddress].s = headerStyle;
          } else if (row >= 4) {
            sheet[cellAddress].s = normalCellStyle;
          }
        }
      }

      return sheet;
    };

    const staffSheet = createSummarySheet(
      "Summary by Staff",
      "Log count grouped by staff for current page only",
      byStaff,
      ["Staff", "Log Count"]
    );

    const dateSheet = createSummarySheet(
      "Summary by Date",
      "Log count grouped by date for current page only",
      byDate,
      ["Date", "Log Count"]
    );

    XLSX.utils.book_append_sheet(wb, staffSheet, "Summary by Staff");
    XLSX.utils.book_append_sheet(wb, dateSheet, "Summary by Date");

    const datePart =
      startDate || endDate
        ? `${startDate || "start"}_to_${endDate || "end"}`
        : "All";

    XLSX.writeFile(wb, `DataLog_Page_${currentPage}_${datePart}.xlsx`);
  };

  const handleDeleteOldLogs = async () => {
    if (deleting) return;

    if (
      !window.confirm(
        "Are you sure you want to delete the 100 oldest DataLog entries?"
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      toast.info("Deleting 100 oldest DataLog entries...");

      const res = await axios.delete(
        `${import.meta.env.VITE_APP_KEY}datalog/delete/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data.message || "Deleted successfully");
      setCurrentPage(1);
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete logs");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatValue = (value) => {
    if (value == null) return "-";

    if (Array.isArray(value)) {
      return value.map((item) => formatValue(item)).join(", ");
    }

    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${formatValue(val)}`)
        .join(", ");
    }

    return String(value);
  };

  const getCompactEntries = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return [["Value", formatValue(data)]];
    }

    const entries = Object.entries(data);

    if (entries.length === 0) {
      return [["-", "-"]];
    }

    return entries;
  };

  const getFieldCount = (data) => {
    if (!data || typeof data !== "object" || Array.isArray(data)) return 0;
    return Object.keys(data).length;
  };

  const renderCompactDataTable = (data, type) => {
    const isBefore = type === "before";
    const entries = getCompactEntries(data);

    return (
      <div
        style={{
          border: isBefore ? "1px solid #fecaca" : "1px solid #bbf7d0",
          borderRadius: "10px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          minWidth: "360px",
        }}
      >
        <div
          style={{
            padding: "8px 10px",
            backgroundColor: isBefore ? "#fee2e2" : "#dcfce7",
            color: isBefore ? "#991b1b" : "#166534",
            fontSize: "12px",
            fontWeight: "900",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: isBefore ? "1px solid #fecaca" : "1px solid #bbf7d0",
          }}
        >
          <span>{isBefore ? "Old Data" : "Changed To"}</span>

          <span
            style={{
              padding: "3px 8px",
              borderRadius: "999px",
              backgroundColor: "#ffffff",
              color: isBefore ? "#991b1b" : "#166534",
              fontSize: "11px",
              fontWeight: "900",
            }}
          >
            {getFieldCount(data)} Fields
          </span>
        </div>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {entries.map(([key, value], index) => (
              <tr
                key={`${key}-${index}`}
                style={{
                  borderBottom:
                    index === entries.length - 1
                      ? "none"
                      : "1px solid #e5e7eb",
                }}
              >
                <td
                  style={{
                    width: "38%",
                    padding: "7px 9px",
                    backgroundColor: isBefore ? "#fff7f7" : "#f0fdf4",
                    color: "#1d4ed8",
                    fontSize: "12px",
                    fontWeight: "900",
                    textTransform: "capitalize",
                    verticalAlign: "top",
                    wordBreak: "break-word",
                  }}
                >
                  {key}
                </td>

                <td
                  style={{
                    width: "62%",
                    padding: "7px 9px",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: "800",
                    verticalAlign: "top",
                    lineHeight: "1.45",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {formatValue(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / perPageData) || 1;
  const indexOfFirstItem = (currentPage - 1) * perPageData;
  const indexOfLastItem = Math.min(currentPage * perPageData, totalCount);

  return (
    <React.Fragment>
      <div className="page-content" style={{ backgroundColor: "#f3f6fb" }}>
        <ToastContainer />

        <div className="container-fluid">
          <Row>
            <Col xl={12}>
              <Card
                className="border-0"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                }}
              >
                <CardBody className="p-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div>
                      <h4
                        className="mb-1"
                        style={{
                          fontWeight: "800",
                          color: "#111827",
                          fontSize: "22px",
                        }}
                      >
                        Data Log Details
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Backend paginated audit table with before and after values.
                      </p>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <Badge
                        color="primary"
                        pill
                        className="px-3 py-2"
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        Total Logs: {totalCount}
                      </Badge>

                      <Badge
                        color="info"
                        pill
                        className="px-3 py-2"
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        Showing: {logs.length}
                      </Badge>
                    </div>
                  </div>

                  <Row className="g-3 align-items-end">
                    <Col xl={3} md={6}>
                      <label
                        className="form-label"
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "#111827",
                          marginBottom: "8px",
                        }}
                      >
                        Search
                      </label>

                      <Input
                        type="text"
                        value={searchInput}
                        placeholder="Search staff, invoice, data..."
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          border: "1.5px solid #b8c2d6",
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: "600",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </Col>

                    <Col xl={1} md={6}>
                      <Button
                        color="primary"
                        className="w-100"
                        onClick={handleSearch}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "800",
                        }}
                      >
                        Search
                      </Button>
                    </Col>

                    <Col xl={2} md={6}>
                      <label
                        className="form-label"
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "#111827",
                          marginBottom: "8px",
                        }}
                      >
                        Start Date
                      </label>

                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setCurrentPage(1);
                          setStartDate(e.target.value);
                        }}
                        max={endDate || undefined}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          border: "1.5px solid #b8c2d6",
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: "600",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </Col>

                    <Col xl={2} md={6}>
                      <label
                        className="form-label"
                        style={{
                          fontSize: "14px",
                          fontWeight: "800",
                          color: "#111827",
                          marginBottom: "8px",
                        }}
                      >
                        End Date
                      </label>

                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setCurrentPage(1);
                          setEndDate(e.target.value);
                        }}
                        min={startDate || undefined}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          border: "1.5px solid #b8c2d6",
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: "600",
                          backgroundColor: "#ffffff",
                        }}
                      />
                    </Col>

                    <Col xl={1} md={6}>
                      <Button
                        color="secondary"
                        className="w-100"
                        onClick={clearFilters}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "800",
                        }}
                      >
                        Clear
                      </Button>
                    </Col>

                    <Col xl={2} md={6}>
                      <Button
                        color="success"
                        className="w-100"
                        onClick={exportToExcel}
                        style={{
                          height: "48px",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "800",
                          boxShadow: "0 8px 18px rgba(22, 163, 74, 0.25)",
                        }}
                      >
                        Export Excel
                      </Button>
                    </Col>

                    {role === "ADMIN" && (
                      <Col xl={1} md={6}>
                        <Button
                          color="danger"
                          className="w-100"
                          onClick={handleDeleteOldLogs}
                          disabled={deleting}
                          style={{
                            height: "48px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: "800",
                            boxShadow: "0 8px 18px rgba(220, 38, 38, 0.25)",
                          }}
                        >
                          {deleting ? "..." : "Delete"}
                        </Button>
                      </Col>
                    )}
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col xl={12}>
              <Card
                className="border-0 mt-0"
                style={{
                  borderRadius: "18px",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.10)",
                }}
              >
                <CardBody className="p-4">
                  <Row className="mb-4 align-items-center g-3">
                    <Col md={8}>
                      <h4
                        className="mb-1"
                        style={{
                          fontWeight: "800",
                          color: "#111827",
                          fontSize: "22px",
                        }}
                      >
                        Activity Table
                      </h4>

                      <p
                        className="mb-0"
                        style={{
                          color: "#475569",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Only current page data is loaded from backend.
                      </p>
                    </Col>

                    <Col md={4} className="text-md-end">
                      <Badge
                        color="light"
                        pill
                        className="px-3 py-2"
                        style={{
                          fontSize: "13px",
                          fontWeight: "800",
                          color: "#1e293b",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Page {currentPage} of {totalPages}
                      </Badge>
                    </Col>
                  </Row>

                  <div
                    className="table-responsive"
                    style={{
                      border: "1.5px solid #d7deea",
                      borderRadius: "14px",
                      overflowX: "auto",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Table className="table mb-0 align-middle">
                      <thead>
                        <tr style={{ backgroundColor: "#eaf0fb" }}>
                          <th
                            style={{
                              width: "60px",
                              padding: "14px 12px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            #
                          </th>

                          <th
                            style={{
                              minWidth: "190px",
                              padding: "14px 12px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Staff
                          </th>

                          <th
                            style={{
                              minWidth: "130px",
                              padding: "14px 12px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Invoice
                          </th>

                          <th
                            style={{
                              minWidth: "390px",
                              padding: "14px 12px",
                              color: "#991b1b",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Old Data
                          </th>

                          <th
                            style={{
                              minWidth: "390px",
                              padding: "14px 12px",
                              color: "#166534",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Changed To
                          </th>

                          <th
                            style={{
                              minWidth: "180px",
                              padding: "14px 12px",
                              color: "#1e293b",
                              fontSize: "13px",
                              fontWeight: "900",
                              borderBottom: "1.5px solid #cbd5e1",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Date & Time
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="6">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  Loading logs...
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Please wait while data is loading.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : logs.length === 0 ? (
                          <tr>
                            <td colSpan="6">
                              <div className="text-center py-5">
                                <h5
                                  style={{
                                    fontWeight: "800",
                                    color: "#111827",
                                  }}
                                >
                                  No logs found
                                </h5>

                                <p
                                  className="mb-0"
                                  style={{
                                    color: "#475569",
                                    fontWeight: "500",
                                  }}
                                >
                                  Try changing the search or date filter.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          logs.map((log, index) => (
                            <tr
                              key={log.id}
                              style={{
                                borderBottom: "1px solid #dfe6f1",
                              }}
                            >
                              <td
                                style={{
                                  padding: "14px 12px",
                                  color: "#334155",
                                  fontSize: "13px",
                                  fontWeight: "900",
                                  verticalAlign: "top",
                                }}
                              >
                                {(currentPage - 1) * perPageData + index + 1}
                              </td>

                              <td
                                style={{
                                  padding: "14px 12px",
                                  verticalAlign: "top",
                                }}
                              >
                                <div className="d-flex align-items-center gap-2">
                                  <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{
                                      width: "38px",
                                      height: "38px",
                                      minWidth: "38px",
                                      backgroundColor: "#dbeafe",
                                      color: "#1d4ed8",
                                      fontWeight: "900",
                                      fontSize: "13px",
                                      border: "1px solid #bfdbfe",
                                    }}
                                  >
                                    {log.user_name
                                      ? log.user_name.substring(0, 2).toUpperCase()
                                      : "US"}
                                  </div>

                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: "900",
                                        color: "#0f172a",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      {log.user_name || "-"}
                                    </div>

                                    <div
                                      style={{
                                        color: "#64748b",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                      }}
                                    >
                                      Staff
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td
                                style={{
                                  padding: "14px 12px",
                                  verticalAlign: "top",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minWidth: "80px",
                                    padding: "7px 10px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#0f172a",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "900",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {log.order_name || "-"}
                                </span>
                              </td>

                              <td
                                style={{
                                  padding: "14px 12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {renderCompactDataTable(log.before_data, "before")}
                              </td>

                              <td
                                style={{
                                  padding: "14px 12px",
                                  verticalAlign: "top",
                                }}
                              >
                                {renderCompactDataTable(log.after_data, "after")}
                              </td>

                              <td
                                style={{
                                  padding: "14px 12px",
                                  verticalAlign: "top",
                                }}
                              >
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "8px 10px",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "9px",
                                    color: "#334155",
                                    fontSize: "12px",
                                    fontWeight: "900",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatDateTime(log.created_at)}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3">
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        fontWeight: "700",
                      }}
                    >
                      Showing {totalCount === 0 ? 0 : indexOfFirstItem + 1} to{" "}
                      {indexOfLastItem} of {totalCount} entries
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button
                        color="light"
                        disabled={loading || currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "800",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        First
                      </Button>

                      <Button
                        color="light"
                        disabled={loading || currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "800",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Prev
                      </Button>

                      <span
                        style={{
                          minWidth: "110px",
                          textAlign: "center",
                          color: "#1e293b",
                          fontSize: "13px",
                          fontWeight: "900",
                        }}
                      >
                        {currentPage} / {totalPages}
                      </span>

                      <Button
                        color="light"
                        disabled={loading || currentPage >= totalPages}
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        style={{
                          borderRadius: "8px",
                          fontWeight: "800",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Next
                      </Button>

                      <Button
                        color="light"
                        disabled={loading || currentPage >= totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        style={{
                          borderRadius: "8px",
                          fontWeight: "800",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </React.Fragment>
  );
};

export default DataLog;