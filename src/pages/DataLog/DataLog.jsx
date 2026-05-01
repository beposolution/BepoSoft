import React, { useState, useEffect, useMemo } from "react";
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
import Paginations from "../../components/Common/Pagination";
import * as XLSX from "xlsx";

const DataLog = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("active");

  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(25);
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
      setLogs([]);
      const allLogs = [];
      let page = 1;
      let totalPages = 1;

      toast.info("Fetching logs, please wait...");

      while (page <= totalPages) {
        const { data } = await axios.get(
          `${import.meta.env.VITE_APP_KEY}datalog/?page=${page}&page_size=500`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const logsArray = Array.isArray(data) ? data : data.results || [];
        const normalized = logsArray.map((log) => {
          const before = unwrapDataIfLoose(normalizeAny(log.before_data));
          const after = unwrapDataIfLoose(normalizeAny(log.after_data));
          return { ...log, before_data: before, after_data: after };
        });

        allLogs.push(...normalized);
        setLogs([...allLogs]);

        const total = data.count || 0;
        const pageSize = data.page_size || 500;
        totalPages = Math.ceil(total / pageSize);
        page++;
      }
      toast.success(`Loaded ${allLogs.length} logs successfully`);
    } catch (error) {
      toast.error("Error fetching logs");
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token]);

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

  const inDateRange = (createdAt) => {
    if (!startDate && !endDate) return true;

    const ts = new Date(createdAt).getTime();

    const startTs = startDate
      ? new Date(`${startDate}T00:00:00`).getTime()
      : Number.NEGATIVE_INFINITY;

    const endTs = endDate
      ? new Date(`${endDate}T23:59:59.999`).getTime()
      : Number.POSITIVE_INFINITY;

    return ts >= startTs && ts <= endTs;
  };

  const deepSearch = (value, query) => {
    if (!query) return true;
    if (value == null) return false;

    const q = query.toLowerCase();

    if (typeof value === "string" || typeof value === "number") {
      return String(value).toLowerCase().includes(q);
    }

    if (Array.isArray(value)) {
      return value.some((item) => deepSearch(item, q));
    }

    if (typeof value === "object") {
      return Object.values(value).some((item) => deepSearch(item, q));
    }

    return false;
  };

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return logs.filter((log) => {
      const dateOk = inDateRange(log.created_at);

      if (!query) return dateOk;

      const match =
        deepSearch(log.user_name, query) ||
        deepSearch(log.order_name, query) ||
        deepSearch(log.before_data, query) ||
        deepSearch(log.after_data, query) ||
        deepSearch(log.created_at, query);

      return match && dateOk;
    });
  }, [logs, searchQuery, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;

  const currentRows = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

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
    const rows = filteredLogs;

    const detailsRows = buildDetailsRows(rows);
    const { byStaff, byDate } = buildSummarySheets(rows);

    const wb = XLSX.utils.book_new();

    const detailsSheet = XLSX.utils.json_to_sheet(detailsRows, {
      header: [
        "Staff",
        "Invoice",
        "Field",
        "Data (Before)",
        "Data (After)",
        "Date & Time",
      ],
    });

    XLSX.utils.book_append_sheet(wb, detailsSheet, "Details");

    const staffSheet = XLSX.utils.json_to_sheet(byStaff, {
      header: ["Staff", "Log Count"],
    });

    XLSX.utils.book_append_sheet(wb, staffSheet, "Summary by Staff");

    const dateSheet = XLSX.utils.json_to_sheet(byDate, {
      header: ["Date", "Log Count"],
    });

    XLSX.utils.book_append_sheet(wb, dateSheet, "Summary by Date");

    const autosize = (sheet) => {
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
      const colWidths = [];

      for (let col = range.s.c; col <= range.e.c; col++) {
        let max = 10;

        for (let row = range.s.r; row <= range.e.r; row++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];

          if (!cell || !cell.v) continue;

          const len = String(cell.v).length;

          if (len > max) {
            max = len;
          }
        }

        colWidths.push({
          wch: Math.min(max + 2, 60),
        });
      }

      sheet["!cols"] = colWidths;
    };

    autosize(detailsSheet);
    autosize(staffSheet);
    autosize(dateSheet);

    const datePart =
      startDate || endDate
        ? `${startDate || "start"}_to_${endDate || "end"}`
        : "All";

    XLSX.writeFile(wb, `DataLog_${datePart}.xlsx`);
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
      await fetchLogs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete logs");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
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
          <span>{isBefore ? "Before Data" : "After Data"}</span>

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
                        Compact audit table with before and after values.
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
                        Total Logs: {logs.length}
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
                        Showing: {filteredLogs.length}
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
                        value={searchQuery}
                        placeholder="Search staff, invoice, data..."
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                        Start Date
                      </label>

                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
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
                        onChange={(e) => setEndDate(e.target.value)}
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

                    <Col xl={2} md={6}>
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
                        Clear All
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
                        Values are displayed in compact rows without inner scroll.
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
                        Page {currentPage}
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
                            Before
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
                            After
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
                        {currentRows.length === 0 ? (
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
                          currentRows.map((log, index) => (
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
                                {indexOfFirstItem + index + 1}
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
                                      ? log.user_name
                                          .substring(0, 2)
                                          .toUpperCase()
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
                                {renderCompactDataTable(
                                  log.before_data,
                                  "before"
                                )}
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

                  <div className="mt-3">
                    <Paginations
                      perPageData={perPageData}
                      data={filteredLogs}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      isShowingPageLength={true}
                      paginationDiv="col-auto ms-auto"
                      paginationClass="pagination-rounded"
                      indexOfFirstItem={indexOfFirstItem}
                      indexOfLastItem={indexOfLastItem}
                    />
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