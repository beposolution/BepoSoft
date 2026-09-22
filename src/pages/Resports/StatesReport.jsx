import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Table, Row, Col, Card, CardBody, CardTitle, Input, Label, Button, Spinner } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link, useLocation, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_APP_KEY;
const PAGE_SIZE = 10;

// Use local calendar dates rather than UTC dates (which can be a day behind in India).
const localToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const asText = (value) => {
    if (value == null) return "";
    if (typeof value === "object") return value.name || value.customer_name || String(value.id || "");
    return String(value);
};

const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const BasicTable = () => {
    const { name } = useParams();
    const location = useLocation();
    const stateName = decodeURIComponent(name || "");
    const urlDates = new URLSearchParams(location.search);
    const initialStart = urlDates.get("start_date") || localToday();
    const initialEnd = urlDates.get("end_date") || localToday();

    const [startDate, setStartDate] = useState(initialStart);
    const [endDate, setEndDate] = useState(initialEnd);
    const [appliedDates, setAppliedDates] = useState({ start: initialStart, end: initialEnd });
    const [orders, setOrders] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStaff, setSelectedStaff] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
    const staffDropdownRef = useRef(null);

    const filteredStaffs = useMemo(() => {
        const query = staffSearch.trim().toLowerCase();
        return staffs.filter((staff) =>
            `${asText(staff.name)} ${asText(staff.family_name)} ${staff.id}`
                .toLowerCase()
                .includes(query)
        );
    }, [staffs, staffSearch]);

    const selectedStaffData = staffs.find((staff) => String(staff.id) === String(selectedStaff));

    useEffect(() => {
        if (!staffDropdownOpen) return;
        const handleOutsideClick = (event) => {
            if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
                setStaffDropdownOpen(false);
                setStaffSearch("");
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [staffDropdownOpen]);
    const [appliedFilters, setAppliedFilters] = useState({ search: "", staff_id: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [loadedPages, setLoadedPages] = useState(0);
    const [totalApiPages, setTotalApiPages] = useState(0);
    const [stateSummary, setStateSummary] = useState(null);
    const role = localStorage.getItem("active");

    useEffect(() => {
        document.title = "STATE WISE REPORTS | BEPOSOFT";
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const token = localStorage.getItem("token");
        axios.get(`${API_BASE}staffs/`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
        }).then(({ data }) => {
            const list = Array.isArray(data) ? data : (data.data || data.results || []);
            setStaffs(Array.isArray(list) ? list : []);
        }).catch((err) => {
            if (err.code !== "ERR_CANCELED") console.error("Could not load staff list", err);
        });
        return () => controller.abort();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const params = {
            start_date: appliedDates.start,
            end_date: appliedDates.end,
            ...(appliedFilters.search && { search: appliedFilters.search }),
            ...(appliedFilters.staff_id && { staff_id: appliedFilters.staff_id }),
        };

        const load = async () => {
            setLoading(true);
            setError("");
            setOrders([]);
            setStateSummary(null);
            setLoadedPages(0);
            setTotalApiPages(0);
            setCurrentPage(1);
            try {
                // Pagination is GLOBAL across states in this API. Fetching only page 1
                // silently omits orders for the selected state, so collect every page.
                const first = await axios.get(`${API_BASE}state/wise/report/`, {
                    headers,
                    params: { ...params, page: 1 },
                    signal: controller.signal,
                });
                if (!active) return;
                const pages = Math.max(1, Number(first.data.total_pages) || 1);
                setTotalApiPages(pages);
                const collected = [];
                const addPage = (payload) => {
                    const states = Array.isArray(payload.data) ? payload.data : [];
                    const state = states.find((item) =>
                        asText(item.name).trim().toLowerCase() === stateName.trim().toLowerCase()
                    );
                    if (!state) return;
                    if (!stateSummarySet) {
                        setStateSummary(state);
                        stateSummarySet = true;
                    }
                    for (const group of state.orders || []) {
                        for (const order of group.waiting_orders || []) {
                            if (role === "CSO" && asText(order.family).toLowerCase() === "bepocart") continue;
                            collected.push(order);
                        }
                    }
                };
                let stateSummarySet = false;
                addPage(first.data);
                setLoadedPages(1);

                // Fetch in small batches to avoid flooding the Django server.
                for (let page = 2; page <= pages && active; page += 4) {
                    const batch = Array.from(
                        { length: Math.min(4, pages - page + 1) },
                        (_, index) => page + index
                    );
                    const responses = await Promise.all(batch.map((pageNumber) =>
                        axios.get(`${API_BASE}state/wise/report/`, {
                            headers,
                            params: { ...params, page: pageNumber },
                            signal: controller.signal,
                        })
                    ));
                    if (!active) return;
                    responses.forEach((response) => addPage(response.data));
                    setLoadedPages(Math.min(pages, page + batch.length - 1));
                }
                if (!active) return;
                // Deduplicate defensively and preserve the API's date-descending order.
                const unique = Array.from(new Map(collected.map((order) => [order.id, order])).values());
                unique.sort((a, b) =>
                    asText(b.order_date).localeCompare(asText(a.order_date)) || Number(b.id) - Number(a.id)
                );
                setOrders(unique);
            } catch (err) {
                if (!active || err.code === "ERR_CANCELED") return;
                console.error("State-wise report failed", err);
                setError(err.response?.data?.message || "Error fetching data. Please try again later.");
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => {
            active = false;
            controller.abort();
        };
    }, [stateName, appliedDates.start, appliedDates.end, appliedFilters.search, appliedFilters.staff_id, role]);

    // Search and staff filtering are handled by the backend before pagination.
    const filteredOrders = orders;

    const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const visibleOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const applyDates = () => {
        if (!startDate || !endDate) {
            setError("Select both start and end dates.");
            return;
        }
        if (startDate > endDate) {
            setError("Start date cannot be after end date.");
            return;
        }
        setError("");
        setAppliedDates({ start: startDate, end: endDate });
        setAppliedFilters({ search: searchQuery.trim(), staff_id: selectedStaff });
        setCurrentPage(1);
    };

    const resetToday = () => {
        const today = localToday();
        setStartDate(today);
        setEndDate(today);
        setAppliedDates({ start: today, end: today });
        setAppliedFilters({ search: "", staff_id: "" });
        setCurrentPage(1);
        setSearchQuery("");
        setSelectedStaff("");
        setStaffSearch("");
        setStaffDropdownOpen(false);
    };

    const statusColor = (value) => ({
        Completed: "success", Shipped: "success", Cancelled: "secondary",
        Rejected: "danger", Return: "warning", "Invoice Rejected": "danger",
        Approved: "primary", "Invoice Approved": "primary",
    }[value] || "info");

    return (
        <React.Fragment>
            <style>{`
                .staff-picker-menu {
                    position: absolute;
                    top: calc(100% + 6px);
                    left: 0;
                    width: 100%;
                    z-index: 1050;
                    max-height: 280px;
                    overflow-y: auto;
                    background: #fff;
                    border: 1px solid #e6eaf0;
                    border-radius: 10px;
                    box-shadow: 0 10px 28px rgba(31, 45, 61, 0.14);
                    padding: 6px;
                }
                .staff-picker-option {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 10px 12px;
                    border: 0;
                    border-radius: 7px;
                    background: transparent;
                    color: #344054;
                    text-align: left;
                    cursor: pointer;
                    transition: background-color 0.15s ease;
                }
                .staff-picker-option:hover,
                .staff-picker-option:focus-visible {
                    background: #f0f5ff;
                    outline: none;
                }
                .staff-picker-option.is-selected {
                    background: #eaf2ff;
                    color: #185abc;
                }
                .staff-picker-name {
                    min-width: 0;
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 1.35;
                    overflow-wrap: anywhere;
                }
                .staff-picker-family {
                    flex-shrink: 0;
                    max-width: 44%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 11px;
                    font-weight: 500;
                    color: #667085;
                    background: #f2f4f7;
                    padding: 4px 8px;
                    border-radius: 999px;
                }
                .staff-picker-option.is-selected .staff-picker-family {
                    background: #dce9ff;
                    color: #185abc;
                }
            `}</style>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="STATE WISE REPORTS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center">
                                        BEPOSOFT ORDERS - {stateName}
                                    </CardTitle>
                                    <Row className="g-3 align-items-end">
                                        <Col sm={6} lg={3}>
                                            <Label>Start Date</Label>
                                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        </Col>
                                        <Col sm={6} lg={3}>
                                            <Label>End Date</Label>
                                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        </Col>
                                        <Col sm={6} lg={3}>
                                            <Label>Search</Label>
                                            <Input type="text" placeholder="Search by invoice, customer or staff"
                                                value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                                        </Col>
                                        <Col sm={6} lg={3}>
                                            <Label>Filter by Staff</Label>
                                            <div ref={staffDropdownRef} className="position-relative">
                                                <div className="position-relative">
                                                    <Input
                                                        type="text"
                                                        role="combobox"
                                                        aria-label="Filter by Staff"
                                                        aria-autocomplete="list"
                                                        aria-expanded={staffDropdownOpen}
                                                        autoComplete="off"
                                                        placeholder="Search or select staff..."
                                                        value={staffDropdownOpen
                                                            ? staffSearch
                                                            : selectedStaffData
                                                                ? `${selectedStaffData.name} (${selectedStaffData.family_name || "—"})`
                                                                : ""}
                                                        onFocus={() => {
                                                            setStaffSearch("");
                                                            setStaffDropdownOpen(true);
                                                        }}
                                                        onChange={(e) => {
                                                            setStaffSearch(e.target.value);
                                                            setStaffDropdownOpen(true);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Escape") {
                                                                setStaffDropdownOpen(false);
                                                                setStaffSearch("");
                                                                e.currentTarget.blur();
                                                            }
                                                            if (e.key === "Enter" && staffDropdownOpen && filteredStaffs.length) {
                                                                e.preventDefault();
                                                                setSelectedStaff(String(filteredStaffs[0].id));
                                                                setCurrentPage(1);
                                                                setStaffDropdownOpen(false);
                                                                setStaffSearch("");
                                                                e.currentTarget.blur();
                                                            }
                                                        }}
                                                        style={{ paddingRight: 35 }}
                                                    />
                                                    <span
                                                        aria-hidden="true"
                                                        className="position-absolute"
                                                        style={{ right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                                                    >▾</span>
                                                </div>
                                                {staffDropdownOpen && (
                                                    <div role="listbox" aria-label="Staff" className="staff-picker-menu">
                                                        <button
                                                            type="button"
                                                            role="option"
                                                            aria-selected={!selectedStaff}
                                                            className={`staff-picker-option ${!selectedStaff ? "is-selected" : ""}`}
                                                            onClick={() => {
                                                                setSelectedStaff("");
                                                                setCurrentPage(1);
                                                                setStaffDropdownOpen(false);
                                                                setStaffSearch("");
                                                            }}
                                                        >
                                                            <span className="staff-picker-name">All Staff</span>
                                                            {!selectedStaff && <span aria-hidden="true">✓</span>}
                                                        </button>
                                                        {filteredStaffs.map((staff) => {
                                                            const isSelected = String(selectedStaff) === String(staff.id);
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    role="option"
                                                                    aria-selected={isSelected}
                                                                    key={staff.id}
                                                                    className={`staff-picker-option ${isSelected ? "is-selected" : ""}`}
                                                                    onClick={() => {
                                                                        setSelectedStaff(String(staff.id));
                                                                        setCurrentPage(1);
                                                                        setStaffDropdownOpen(false);
                                                                        setStaffSearch("");
                                                                    }}
                                                                >
                                                                    <span className="staff-picker-name">{staff.name}</span>
                                                                    <span className="d-flex align-items-center gap-2" style={{ minWidth: 0, flexShrink: 0 }}>
                                                                        <span className="staff-picker-family" title={staff.family_name || ""}>
                                                                            {staff.family_name || "—"}
                                                                        </span>
                                                                        {isSelected && <span aria-hidden="true">✓</span>}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })}
                                                        {!filteredStaffs.length && (
                                                            <div className="text-muted text-center py-3">No staff found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="d-flex gap-2 mt-3 flex-wrap">
                                        <Button color="primary" onClick={applyDates} disabled={loading}>Apply Filter</Button>
                                        <Button color="secondary" outline onClick={resetToday} disabled={loading}>Today</Button>
                                    </div>
                                    {loading && (
                                        <div className="my-3 text-primary">
                                            <Spinner size="sm" className="me-2" />
                                            Loading orders ({loadedPages} of {totalApiPages || "..."} API pages)...
                                        </div>
                                    )}
                                    {error && <div className="text-danger mt-3">{error}</div>}
                                    {!loading && !error && (
                                        <>
                                            <div className="mt-3 mb-2 text-muted">
                                                {filteredOrders.length} matching orders for {stateName} ({appliedDates.start} to {appliedDates.end})
                                                {stateSummary && role !== "CSO" && (
                                                    <span className="ms-2">
                                                        | State total: {stateSummary.total_orders_count} bills, ₹{money(stateSummary.total_amount)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="table-responsive">
                                                <Table className="table mb-0 table-striped align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>INVOICE NO</th>
                                                            <th>STAFF</th>
                                                            <th>CUSTOMER</th>
                                                            <th>STATUS</th>
                                                            <th>BILL AMOUNT</th>
                                                            <th>CREATED AT</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleOrders.length ? visibleOrders.map((order, index) => (
                                                            <tr key={order.id}>
                                                                <th scope="row">{(currentPage - 1) * PAGE_SIZE + index + 1}</th>
                                                                <td><Link to={`/order/${order.id}/items/`}>{order.invoice || order.id}</Link></td>
                                                                <td>{asText(order.manage_staff)} ({asText(order.family)})</td>
                                                                <td>{asText(order.customer_name) || `Customer #${order.customerID || order.customer || "—"}`}</td>
                                                                <td><span className={`badge bg-${statusColor(order.status)}`}>{order.status || "—"}</span></td>
                                                                <td>₹{money(order.total_amount)}</td>
                                                                <td>{order.order_date || "—"}</td>
                                                            </tr>
                                                        )) : (
                                                            <tr><td colSpan="7" className="text-center py-4">No orders found for this state and filter.</td></tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                            {filteredOrders.length > PAGE_SIZE && (
                                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
                                                    <span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}</span>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Button color="primary" outline disabled={currentPage <= 1}
                                                            onClick={() => setCurrentPage((page) => page - 1)}>Previous</Button>
                                                        <span>Page {currentPage} of {pageCount}</span>
                                                        <Button color="primary" outline disabled={currentPage >= pageCount}
                                                            onClick={() => setCurrentPage((page) => page + 1)}>Next</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment >
    );
};

export default BasicTable;
