import React, { useCallback, useEffect, useRef, useState } from "react";
import { Table, Row, Col, Card, CardBody, CardTitle, Input, Label, Button, Spinner } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 50;
const FIXED_STATUS = "Invoice Rejected";

const RejectedProformaInvoices = () => {
    const apiBase = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [appliedDates, setAppliedDates] = useState({ start: "", end: "" });
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const controllerRef = useRef(null);

    useEffect(() => {
        document.title = "BEPOSOFT | REJECTED PROFORMA INVOICES";
    }, []);

    const fetchInvoices = useCallback(async (page, dates) => {
        if (controllerRef.current) controllerRef.current.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const base = apiBase.endsWith("/") ? apiBase : `${apiBase}/`;
            const params = { status: FIXED_STATUS, page };
            if (dates.start) params.start_date = dates.start;
            if (dates.end) params.end_date = dates.end;
            const response = await axios.get(`${base}perfoma/invoices/status/filter/`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
                signal: controller.signal,
            });
            const payload = response.data || {};
            const records = Array.isArray(payload.results)
                ? payload.results
                : Array.isArray(payload.results?.data)
                    ? payload.results.data
                    : Array.isArray(payload.data) ? payload.data : [];
            // Status is fixed in the request; this guard also prevents unexpected records being displayed.
            const rejected = records.filter((item) => item.status === FIXED_STATUS);
            setInvoices(rejected);
            setTotalCount(Number(payload.count ?? rejected.length));
            setHasNext(Boolean(payload.next));
            setHasPrevious(Boolean(payload.previous));
            setCurrentPage(page);
        } catch (err) {
            if (err.code === "ERR_CANCELED" || axios.isCancel(err)) return;
            console.error("Rejected proforma invoice API error:", err);
            const message = err.response?.data?.message || err.response?.data?.detail || "Unable to load rejected proforma invoices.";
            setError(message);
            setInvoices([]);
            setTotalCount(0);
            setHasNext(false);
            setHasPrevious(false);
            toast.error(message);
        } finally {
            if (controllerRef.current === controller) {
                setLoading(false);
                controllerRef.current = null;
            }
        }
    }, [apiBase, token]);

    useEffect(() => {
        fetchInvoices(1, { start: "", end: "" });
        return () => { if (controllerRef.current) controllerRef.current.abort(); };
    }, [fetchInvoices]);

    const applyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            toast.error("Start date cannot be greater than end date.");
            return;
        }
        const dates = { start: startDate, end: endDate };
        setAppliedDates(dates);
        fetchInvoices(1, dates);
    };

    const clearFilter = () => {
        setStartDate("");
        setEndDate("");
        const dates = { start: "", end: "" };
        setAppliedDates(dates);
        fetchInvoices(1, dates);
    };

    const formatAmount = (value) => Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const billAmount = (item) => {
        if (Array.isArray(item.perfoma_items) && item.perfoma_items.length) {
            return item.perfoma_items.reduce((sum, line) =>
                sum + Number(line.rate || 0) * Number(line.quantity || 0), 0);
        }
        return Number(item.total_amount || 0);
    };

    const firstRecord = totalCount ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
    const lastRecord = Math.min((currentPage - 1) * PAGE_SIZE + invoices.length, totalCount);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="REJECTED PROFORMA INVOICES" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col>
                                            <CardTitle className="h4 mb-1">BEPOSOFT REJECTED PROFORMA INVOICES</CardTitle>
                                            <div className="text-muted">Total rejected invoices: <strong>{totalCount}</strong></div>
                                        </Col>
                                    </Row>
                                    <Row className="align-items-end mb-4">
                                        <Col xl={3} lg={4} md={6} className="mb-3">
                                            <Label>Status</Label>
                                            <Input
                                                type="text"
                                                value="Proforma Rejected"
                                                disabled
                                                readOnly
                                            />
                                        </Col>
                                        <Col xl={3} lg={4} md={6} className="mb-3">
                                            <Label>Start Date</Label>
                                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                        </Col>
                                        <Col xl={3} lg={4} md={6} className="mb-3">
                                            <Label>End Date</Label>
                                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                        </Col>
                                        <Col xl={3} lg={4} md={6} className="mb-3">
                                            <div className="d-flex gap-2">
                                                <Button color="primary" className="flex-fill" disabled={loading} onClick={applyFilter}>
                                                    {loading ? <><Spinner size="sm" className="me-2" />Loading</> : "Apply Filter"}
                                                </Button>
                                                <Button color="secondary" outline className="flex-fill" disabled={loading} onClick={clearFilter}>Clear</Button>
                                            </div>
                                        </Col>
                                    </Row>
                                    {loading ? (
                                        <div className="text-center py-5"><Spinner color="primary" /><div className="mt-2">Loading rejected invoices...</div></div>
                                    ) : error ? (
                                        <div className="text-danger text-center py-4">{error}</div>
                                    ) : invoices.length === 0 ? (
                                        <div className="text-muted text-center py-5">No rejected proforma invoices found.</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover bordered className="align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th><th>Invoice No.</th><th>Staff</th><th>Customer</th>
                                                        <th>Status</th><th className="text-end">Bill Amount</th><th>Order Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.map((item, index) => (
                                                        <tr key={item.id ?? `${item.invoice}-${index}`}>
                                                            <th scope="row">{(currentPage - 1) * PAGE_SIZE + index + 1}</th>
                                                            <td>
                                                                {item.invoice ? <Link className="fw-semibold" to={`/perfoma/invoice/${encodeURIComponent(item.invoice)}/view/`}>{item.invoice}</Link> : "N/A"}
                                                            </td>
                                                            <td>
                                                                {item.manage_staff_name || item.staffname || item.manage_staff?.name || "N/A"}
                                                                {item.familyname && <div className="small text-muted">{item.familyname}</div>}
                                                            </td>
                                                            <td>{item.customer?.name || item.customermame || item.customer_name || "N/A"}</td>
                                                            <td>
                                                                <span className="text-danger fw-semibold">
                                                                    {item.status === "Invoice Rejected"
                                                                        ? "Proforma Rejected"
                                                                        : item.status}
                                                                </span>
                                                            </td>
                                                            <td className="text-end fw-semibold">₹ {formatAmount(billAmount(item))}</td>
                                                            <td>{item.order_date || "N/A"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                    {totalCount > 0 && !error && (
                                        <Row className="align-items-center mt-4">
                                            <Col md={6} className="text-muted mb-2 mb-md-0">
                                                Showing <strong>{firstRecord}</strong> to <strong>{lastRecord}</strong> of <strong>{totalCount}</strong> records
                                            </Col>
                                            <Col md={6}>
                                                <div className="d-flex justify-content-md-end align-items-center gap-2">
                                                    <Button color="secondary" outline disabled={loading || !hasPrevious} onClick={() => fetchInvoices(currentPage - 1, appliedDates)}>Previous</Button>
                                                    <span className="text-muted px-2">Page <strong>{currentPage}</strong></span>
                                                    <Button color="primary" disabled={loading || !hasNext} onClick={() => fetchInvoices(currentPage + 1, appliedDates)}>Next</Button>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
            <ToastContainer />
        </React.Fragment>
    );
};

export default RejectedProformaInvoices;
