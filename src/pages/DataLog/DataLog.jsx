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

    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}datalog/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setLogs(response.data || []);
            } catch (error) {
                toast.error("Error fetching logs");
            }
        };
        fetchLogs();
    }, [token]);

    // helper: does a created_at fall within [startDate, endDate] (inclusive)
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

    // Filtered view (single search matches user_name OR order_name) + date range
    const filteredLogs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return logs.filter((log) => {
            const userMatch = (log.user_name || "").toLowerCase().includes(q);
            const orderMatch = (log.order_name || "").toLowerCase().includes(q);
            const queryOk = q ? (userMatch || orderMatch) : true;
            const dateOk = inDateRange(log.created_at);
            return queryOk && dateOk;
        });
    }, [logs, searchQuery, startDate, endDate]);

    // reset to first page when any filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // derive current slice
    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentRows = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

    const clearFilters = () => {
        setSearchQuery("");
    };

    const clearDates = () => {
        setStartDate("");
        setEndDate("");
    };

    const safeObj = (maybeJson) => {
        // normalize before_data/after_data to objects (API may send stringified JSON)
        if (maybeJson && typeof maybeJson === "object") return maybeJson;
        if (maybeJson && typeof maybeJson === "string") {
            try {
                const parsed = JSON.parse(maybeJson);
                return typeof parsed === "object" && parsed !== null ? parsed : {};
            } catch {
                return {};
            }
        }
        return {};
    };

    const formatDateTime = (iso) => {
        try {
            return new Date(iso).toLocaleString();
        } catch {
            return iso || "";
        }
    };

    const buildDetailsRows = (rows) => {
        const details = [];
        let serial = 1; // running index for the sheet

        rows.forEach((log) => {
            const before = safeObj(log.before_data);
            const after = safeObj(log.after_data);

            // union of keys present in before/after
            const keys = Array.from(
                new Set([...(before ? Object.keys(before) : []), ...(after ? Object.keys(after) : [])])
            );

            // if no keys, still push one line so the record appears in export
            if (keys.length === 0) {
                details.push({
                    "S.No": serial++,
                    "Log ID": log.id,                 // keep if you want; remove if not needed
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
                const bVal = before && Object.prototype.hasOwnProperty.call(before, k) ? before[k] : "-";
                const aVal = after && Object.prototype.hasOwnProperty.call(after, k) ? after[k] : "-";

                details.push({
                    // "S.No": serial++,
                    // "Log ID": log.id,               
                    Staff: log.user_name || "",
                    Invoice: log.order_name || "",
                    Field: k,
                    "Data (Before)": String(bVal),
                    "Data (After)": String(aVal),
                    "Date & Time": formatDateTime(log.created_at),
                });
            });
        });

        return details;
    };

    const buildSummarySheets = (rows) => {
        // 1) Summary by Staff
        const byStaffMap = new Map();
        rows.forEach((log) => {
            const key = log.user_name || "Unknown";
            byStaffMap.set(key, (byStaffMap.get(key) || 0) + 1);
        });
        const byStaff = Array.from(byStaffMap.entries()).map(([staff, count]) => ({
            Staff: staff,
            "Log Count": count,
        }));

        // 2) Summary by Date (YYYY-MM-DD)
        const byDateMap = new Map();
        rows.forEach((log) => {
            const d = new Date(log.created_at);
            const day = isNaN(d.getTime())
                ? "Invalid"
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                    d.getDate()
                ).padStart(2, "0")}`;
            byDateMap.set(day, (byDateMap.get(day) || 0) + 1);
        });
        const byDate = Array.from(byDateMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ Date: date, "Log Count": count }));

        return { byStaff, byDate };
    };

    const exportToExcel = () => {
        // Use *filteredLogs* so export matches the on-screen filters (but all pages)
        const rows = filteredLogs;

        const detailsRows = buildDetailsRows(rows);
        const { byStaff, byDate } = buildSummarySheets(rows);

        const wb = XLSX.utils.book_new();

        // Details sheet
        const detailsSheet = XLSX.utils.json_to_sheet(detailsRows, {
            header: [
                // "ID",
                "Staff",
                "Invoice",
                "Field",
                "Data (Before)",
                "Data (After)",
                "Date & Time",
            ],
        });
        XLSX.utils.book_append_sheet(wb, detailsSheet, "Details");

        // Summary by Staff
        const staffSheet = XLSX.utils.json_to_sheet(byStaff, {
            header: ["Staff", "Log Count"],
        });
        XLSX.utils.book_append_sheet(wb, staffSheet, "Summary by Staff");

        // Summary by Date
        const dateSheet = XLSX.utils.json_to_sheet(byDate, {
            header: ["Date", "Log Count"],
        });
        XLSX.utils.book_append_sheet(wb, dateSheet, "Summary by Date");

        // Optional: autofit-ish width
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

        // File name includes date range or "All"
        const datePart =
            startDate || endDate
                ? `${startDate || "start"}_to_${endDate || "end"}`
                : "All";
        XLSX.writeFile(wb, `DataLog_${datePart}.xlsx`);
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
                                        {/* Single Search */}
                                        <Col md={3} className="mb-2">
                                            <label className="form-label mb-1">Search</label>
                                            <Input
                                                type="text"
                                                value={searchQuery}
                                                placeholder="Search by user or invoice"
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </Col>

                                        {/* Date Range Filters */}
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
                                                            <td>
                                                                {log.before_data && Object.keys(log.before_data).length > 0 ? (
                                                                    <ul className="mb-0 ps-3">
                                                                        {Object.entries(log.before_data).map(([key, value]) => (
                                                                            <li key={key}>
                                                                                <strong>{key}:</strong> {String(value)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    "-"
                                                                )}
                                                            </td>
                                                            <td>
                                                                {log.after_data && Object.keys(log.after_data).length > 0 ? (
                                                                    <ul className="mb-0 ps-3">
                                                                        {Object.entries(log.after_data).map(([key, value]) => (
                                                                            <li key={key}>
                                                                                <strong>{key}:</strong> {String(value)}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    "-"
                                                                )}
                                                            </td>
                                                            <td>{new Date(log.created_at).toLocaleString()}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
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
