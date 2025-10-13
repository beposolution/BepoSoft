import React, { useState, useEffect, useMemo } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Table, Input, Button } from "reactstrap";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [perPageData] = useState(20);
  const [deleting, setDeleting] = useState(false);
  const role = localStorage.getItem("active");

  const parseLooseJSON = (s) => {
    if (typeof s !== "string") return null;
    try {
      return JSON.parse(s);
    } catch (_) { }

    try {
      let t = s.trim();
      if (
        !(
          (t.startsWith("{") && t.endsWith("}")) ||
          (t.startsWith("[") && t.endsWith("]"))
        )
      )
        return null;

      t = t.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3');
      t = t.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');

      return JSON.parse(t);
    } catch {
      return null;
    }
  };

  const normalizeAny = (v) => {
    if (v == null) return {};
    if (typeof v === "object") return v;
    if (typeof v === "string") {
      const parsed = parseLooseJSON(v);
      return parsed ?? { value: v };
    }
    return { value: String(v) };
  };

  const unwrapDataIfLoose = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    for (const k of ["Data", "data"]) {
      if (k in obj && typeof obj[k] === "string") {
        const p = parseLooseJSON(obj[k]);
        if (p && typeof p === "object") return p;
      }
    }
    return obj;
  };

  const renderKVList = (obj) => {
    if (!obj || typeof obj !== "object") return <span>{String(obj)}</span>;
    const entries = Object.entries(obj);
    if (entries.length === 0) return <em>{"{}"}</em>;
    return (
      <ul className="mb-0 ps-3">
        {entries.map(([k, v]) => (
          <li key={k}>
            <strong>{k}:</strong> {renderValue(v)}
          </li>
        ))}
      </ul>
    );
  };

  const renderValue = (val) => {
    if (val == null) return <em>-</em>;

    if (Array.isArray(val)) {
      if (val.length === 0) return <em>[]</em>;
      return (
        <ul className="mb-0 ps-3">
          {val.map((item, i) => (
            <li key={i}>
              {typeof item === "object" ? renderKVList(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof val === "object") return renderKVList(val);
    return <span>{String(val)}</span>;
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
    if (token) fetchLogs();
  }, [token]);

  // -------------------- Filters --------------------
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

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      const userMatch = (log.user_name || "").toLowerCase().includes(q);
      const orderMatch = (log.order_name || "").toLowerCase().includes(q);
      const queryOk = q ? userMatch || orderMatch : true;
      const dateOk = inDateRange(log.created_at);
      return queryOk && dateOk;
    });
  }, [logs, searchQuery, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentRows = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso || "";
    }
  };

  const safeObj = (maybe) => unwrapDataIfLoose(normalizeAny(maybe));

  const stringifyCell = (v) => {
    if (v == null) return "-";
    if (Array.isArray(v) || typeof v === "object") {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
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

      keys.forEach((k) => {
        const bVal =
          before && Object.prototype.hasOwnProperty.call(before, k)
            ? before[k]
            : "-";
        const aVal =
          after && Object.prototype.hasOwnProperty.call(after, k)
            ? after[k]
            : "-";

        details.push({
          Staff: log.user_name || "",
          Invoice: log.order_name || "",
          Field: k,
          "Data (Before)": stringifyCell(bVal),
          "Data (After)": stringifyCell(aVal),
          "Date & Time": formatDateTime(log.created_at),
        });
      });
    });
    return details;
  };

  const buildSummarySheets = (rows) => {
    const byStaffMap = new Map();
    rows.forEach((log) => {
      const key = log.user_name || "Unknown";
      byStaffMap.set(key, (byStaffMap.get(key) || 0) + 1);
    });
    const byStaff = Array.from(byStaffMap.entries()).map(([staff, count]) => ({
      Staff: staff,
      "Log Count": count,
    }));

    const byDateMap = new Map();
    rows.forEach((log) => {
      const d = new Date(log.created_at);
      const day = isNaN(d.getTime())
        ? "Invalid"
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      byDateMap.set(day, (byDateMap.get(day) || 0) + 1);
    });
    const byDate = Array.from(byDateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ Date: date, "Log Count": count }));

    return { byStaff, byDate };
  };

  const handleDeleteOldLogs = async () => {
    if (deleting) return; // prevent double click

    if (!window.confirm("Are you sure you want to delete the 100 oldest DataLog entries?")) return;

    try {
      setDeleting(true);
      toast.info("Deleting 50 oldest DataLog entries...");
      const res = await axios.delete(`${import.meta.env.VITE_APP_KEY}datalog/delete/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(res.data.message || "Deleted successfully");
      await fetchLogs(); // refresh
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to delete logs");
    } finally {
      setDeleting(false);
    }
  };

  const exportToExcel = () => {
    const rows = filteredLogs;

    const detailsRows = buildDetailsRows(rows);
    const { byStaff, byDate } = buildSummarySheets(rows);

    const wb = XLSX.utils.book_new();

    const detailsSheet = XLSX.utils.json_to_sheet(detailsRows, {
      header: ["Staff", "Invoice", "Field", "Data (Before)", "Data (After)", "Date & Time"],
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
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let max = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (!cell || !cell.v) continue;
          const len = String(cell.v).length;
          if (len > max) max = len;
        }
        colWidths.push({ wch: Math.min(max + 2, 60) });
      }
      sheet["!cols"] = colWidths;
    };
    autosize(detailsSheet);
    autosize(staffSheet);
    autosize(dateSheet);

    const datePart =
      startDate || endDate ? `${startDate || "start"}_to_${endDate || "end"}` : "All";
    XLSX.writeFile(wb, `DataLog_${datePart}.xlsx`);
  };

  // -------------------- UI --------------------
  const clearFilters = () => setSearchQuery("");
  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <div className="container-fluid">
          <Breadcrumbs title="Log" breadcrumbItem="DATA LOG DETAILS" />
          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col md={3} className="mb-2">
                      <label className="form-label mb-1">Search</label>
                      <Input
                        type="text"
                        value={searchQuery}
                        placeholder="Search by user or invoice"
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Col>

                    <Col md={2} className="mb-2">
                      <label className="form-label mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || undefined}
                      />
                    </Col>
                    <Col md={2} className="mb-2">
                      <label className="form-label mb-1">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || undefined}
                      />
                    </Col>

                    <Col md={2} className="d-flex align-items-end mb-2">
                      <Button
                        color="secondary"
                        className="w-100"
                        onClick={() => {
                          clearFilters();
                          clearDates();
                        }}
                      >
                        Clear All
                      </Button>
                    </Col>
                    <Col md={2} className="d-flex align-items-end mb-2">
                      <Button color="success" className="w-100" onClick={exportToExcel}>
                        Export to Excel
                      </Button>
                    </Col>
                    {role === "ADMIN" && (
                      <Col md={1} className="d-flex align-items-end mb-2">
                        <Button
                          color="danger"
                          className="w-100"
                          onClick={handleDeleteOldLogs}
                          disabled={deleting}
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </Button>
                      </Col>
                    )}
                  </Row>

                  <div className="table-responsive">
                    <Table className="table mb-0 table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Staff</th>
                          <th>Invoice</th>
                          <th>Data</th>
                          <th>Data Changed To</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRows.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No logs found
                            </td>
                          </tr>
                        ) : (
                          currentRows.map((log, idx) => (
                            <tr key={log.id}>
                              <td>{indexOfFirstItem + idx + 1}</td>
                              <td>{log.user_name}</td>
                              <td>{log.order_name}</td>
                              <td>{renderValue(log.before_data)}</td>
                              <td>{renderValue(log.after_data)}</td>
                              <td>{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>

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
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default DataLog;
