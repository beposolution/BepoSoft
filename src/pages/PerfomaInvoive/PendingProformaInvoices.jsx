
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Label,
    Button,
    Spinner,
    Modal,
    ModalHeader,
    ModalBody,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PAGE_SIZE = 50;
const FIXED_STATUS = "Pending";

const PendingProformaInvoices = () => {
    const apiBase = import.meta.env.VITE_APP_KEY;
    const token = localStorage.getItem("token");

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [appliedDates, setAppliedDates] = useState({
        start: "",
        end: "",
    });

    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    // Payment slip modal
    const [slipModalOpen, setSlipModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedSlips, setSelectedSlips] = useState([]);
    const [activeSlipIndex, setActiveSlipIndex] = useState(0);

    const controllerRef = useRef(null);

    useEffect(() => {
        document.title = "BEPOSOFT | PENDING PROFORMA INVOICES";
    }, []);

    const fetchInvoices = useCallback(
        async (page, dates) => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }

            const controller = new AbortController();
            controllerRef.current = controller;

            if (!token) {
                setError("Authentication token not found. Please log in again.");
                controllerRef.current = null;
                return;
            }

            setLoading(true);
            setError("");

            try {
                const base = apiBase.endsWith("/")
                    ? apiBase
                    : `${apiBase}/`;

                const params = {
                    status: FIXED_STATUS,
                    page,
                };

                if (dates.start) {
                    params.start_date = dates.start;
                }

                if (dates.end) {
                    params.end_date = dates.end;
                }

                const response = await axios.get(
                    `${base}perfoma/invoices/status/filter/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        params,
                        signal: controller.signal,
                    }
                );

                const payload = response.data || {};

                const records = Array.isArray(payload.results)
                    ? payload.results
                    : Array.isArray(payload.results?.data)
                        ? payload.results.data
                        : Array.isArray(payload.data)
                            ? payload.data
                            : [];

                const pending = records.filter(
                    (item) => item.status === FIXED_STATUS
                );

                setInvoices(pending);
                setTotalCount(Number(payload.count ?? pending.length));
                setHasNext(Boolean(payload.next));
                setHasPrevious(Boolean(payload.previous));
                setCurrentPage(page);
            } catch (err) {
                if (
                    err.code === "ERR_CANCELED" ||
                    axios.isCancel(err)
                ) {
                    return;
                }

                console.error("Pending proforma invoice API error:", err);

                const message =
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    "Unable to load pending proforma invoices.";

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
        },
        [apiBase, token]
    );

    useEffect(() => {
        fetchInvoices(1, {
            start: "",
            end: "",
        });

        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, [fetchInvoices]);

    const applyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            toast.error("Start date cannot be greater than end date.");
            return;
        }

        const dates = {
            start: startDate,
            end: endDate,
        };

        setAppliedDates(dates);
        fetchInvoices(1, dates);
    };

    const clearFilter = () => {
        setStartDate("");
        setEndDate("");

        const dates = {
            start: "",
            end: "",
        };

        setAppliedDates(dates);
        fetchInvoices(1, dates);
    };

    const formatAmount = (value) =>
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const billAmount = (item) => {
        if (
            Array.isArray(item.perfoma_items) &&
            item.perfoma_items.length
        ) {
            return item.perfoma_items.reduce(
                (sum, line) =>
                    sum +
                    Number(line.rate || 0) *
                    Number(line.quantity || 0),
                0
            );
        }

        return Number(item.total_amount || 0);
    };

    // Open payment slip modal
    const openSlipModal = (invoice) => {
        const slips = Array.isArray(invoice.payment_slips)
            ? invoice.payment_slips.filter((slip) => slip.file)
            : [];

        if (slips.length === 0) {
            toast.info("No payment slips available.");
            return;
        }

        setSelectedInvoice(invoice);
        setSelectedSlips(slips);
        setActiveSlipIndex(0);
        setSlipModalOpen(true);
    };

    // Close payment slip modal
    const closeSlipModal = () => {
        setSlipModalOpen(false);
        setSelectedInvoice(null);
        setSelectedSlips([]);
        setActiveSlipIndex(0);
    };

    const activeSlip = selectedSlips[activeSlipIndex];

    const isPdf = (url) => {
        if (!url) return false;

        return /\.pdf(?:[?#]|$)/i.test(url);
    };

    const firstRecord = totalCount
        ? (currentPage - 1) * PAGE_SIZE + 1
        : 0;

    const lastRecord = Math.min(
        (currentPage - 1) * PAGE_SIZE + invoices.length,
        totalCount
    );

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs
                        title="Tables"
                        breadcrumbItem="PENDING PROFORMA INVOICES"
                    />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Row className="mb-3">
                                        <Col>
                                            <CardTitle className="h4 mb-1">
                                                BEPOSOFT PENDING PROFORMA INVOICES
                                            </CardTitle>

                                            <div className="text-muted">
                                                Total pending invoices:{" "}
                                                <strong>{totalCount}</strong>
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="align-items-end mb-4">
                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>Status</Label>

                                            <Input
                                                type="text"
                                                value="Pending"
                                                disabled
                                                readOnly
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>Start Date</Label>

                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <Label>End Date</Label>

                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                            />
                                        </Col>

                                        <Col
                                            xl={3}
                                            lg={4}
                                            md={6}
                                            className="mb-3"
                                        >
                                            <div className="d-flex gap-2">
                                                <Button
                                                    color="primary"
                                                    className="flex-fill"
                                                    disabled={loading}
                                                    onClick={applyFilter}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Spinner
                                                                size="sm"
                                                                className="me-2"
                                                            />
                                                            Loading
                                                        </>
                                                    ) : (
                                                        "Apply Filter"
                                                    )}
                                                </Button>

                                                <Button
                                                    color="secondary"
                                                    outline
                                                    className="flex-fill"
                                                    disabled={loading}
                                                    onClick={clearFilter}
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <div className="text-center py-5">
                                            <Spinner color="primary" />

                                            <div className="mt-2">
                                                Loading pending invoices...
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className="text-danger text-center py-4">
                                            {error}
                                        </div>
                                    ) : invoices.length === 0 ? (
                                        <div className="text-muted text-center py-5">
                                            No pending proforma invoices found.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table
                                                hover
                                                bordered
                                                className="align-middle mb-0"
                                            >
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Invoice No.</th>
                                                        <th>Staff</th>
                                                        <th>Customer</th>
                                                        <th>Status</th>
                                                        <th>Payment Slip</th>
                                                        <th className="text-end">
                                                            Bill Amount
                                                        </th>
                                                        <th>Order Date</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {invoices.map((item, index) => {
                                                        const slips = Array.isArray(
                                                            item.payment_slips
                                                        )
                                                            ? item.payment_slips.filter(
                                                                (slip) => slip.file
                                                            )
                                                            : [];

                                                        return (
                                                            <tr
                                                                key={
                                                                    item.id ??
                                                                    `${item.invoice}-${index}`
                                                                }
                                                            >
                                                                <th scope="row">
                                                                    {(currentPage - 1) *
                                                                        PAGE_SIZE +
                                                                        index +
                                                                        1}
                                                                </th>

                                                                <td>
                                                                    {item.invoice ? (
                                                                        <Link
                                                                            className="fw-semibold"
                                                                            to={`/perfoma/invoice/${encodeURIComponent(
                                                                                item.invoice
                                                                            )}/view/`}
                                                                        >
                                                                            {item.invoice}
                                                                        </Link>
                                                                    ) : (
                                                                        "N/A"
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {item.manage_staff_name ||
                                                                        item.staffname ||
                                                                        item.manage_staff?.name ||
                                                                        "N/A"}

                                                                    {item.familyname && (
                                                                        <div className="small text-muted">
                                                                            {item.familyname}
                                                                        </div>
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {item.customer?.name ||
                                                                        item.customermame ||
                                                                        item.customer_name ||
                                                                        "N/A"}
                                                                </td>

                                                                <td>
                                                                    <span className="text-danger fw-semibold">
                                                                        {item.status}
                                                                    </span>
                                                                </td>

                                                                <td>
                                                                    {slips.length > 0 ? (
                                                                        <Button
                                                                            color="success"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                openSlipModal(item)
                                                                            }
                                                                        >
                                                                            View Slip ({slips.length})
                                                                        </Button>
                                                                    ) : (
                                                                        <span className="text-muted">
                                                                            No Slip
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                <td className="text-end fw-semibold">
                                                                    ₹{" "}
                                                                    {formatAmount(
                                                                        billAmount(item)
                                                                    )}
                                                                </td>

                                                                <td>
                                                                    {item.order_date || "N/A"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}

                                    {totalCount > 0 && !error && (
                                        <Row className="align-items-center mt-4">
                                            <Col
                                                md={6}
                                                className="text-muted mb-2 mb-md-0"
                                            >
                                                Showing{" "}
                                                <strong>{firstRecord}</strong> to{" "}
                                                <strong>{lastRecord}</strong> of{" "}
                                                <strong>{totalCount}</strong> records
                                            </Col>

                                            <Col md={6}>
                                                <div className="d-flex justify-content-md-end align-items-center gap-2">
                                                    <Button
                                                        color="secondary"
                                                        outline
                                                        disabled={
                                                            loading || !hasPrevious
                                                        }
                                                        onClick={() =>
                                                            fetchInvoices(
                                                                currentPage - 1,
                                                                appliedDates
                                                            )
                                                        }
                                                    >
                                                        Previous
                                                    </Button>

                                                    <span className="text-muted px-2">
                                                        Page{" "}
                                                        <strong>{currentPage}</strong>
                                                    </span>

                                                    <Button
                                                        color="primary"
                                                        disabled={loading || !hasNext}
                                                        onClick={() =>
                                                            fetchInvoices(
                                                                currentPage + 1,
                                                                appliedDates
                                                            )
                                                        }
                                                    >
                                                        Next
                                                    </Button>
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

            {/* Payment Slip Preview Modal */}
            <Modal
                isOpen={slipModalOpen}
                toggle={closeSlipModal}
                size="lg"
                centered
                scrollable
            >
                <ModalHeader toggle={closeSlipModal}>
                    Payment Slip
                    {selectedInvoice?.invoice
                        ? ` - ${selectedInvoice.invoice}`
                        : ""}
                </ModalHeader>

                <ModalBody>
                    {selectedSlips.length > 0 && activeSlip && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <strong>Invoice:</strong>{" "}
                                    {selectedInvoice?.invoice || "N/A"}
                                </div>

                                <div className="text-muted">
                                    Slip {activeSlipIndex + 1} of{" "}
                                    {selectedSlips.length}
                                </div>
                            </div>

                            <div
                                className="text-center border rounded p-2"
                                style={{
                                    backgroundColor: "#f8f9fa",
                                    minHeight: "250px",
                                }}
                            >
                                {isPdf(activeSlip.file) ? (
                                    <iframe
                                        key={activeSlip.file}
                                        src={activeSlip.file}
                                        title="Payment Slip PDF"
                                        style={{
                                            width: "100%",
                                            height: "65vh",
                                            border: "none",
                                        }}
                                    />
                                ) : (
                                    <img
                                        key={activeSlip.file}
                                        src={activeSlip.file}
                                        alt="Payment Slip"
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "65vh",
                                            objectFit: "contain",
                                        }}
                                    />
                                )}
                            </div>

                            <div className="mt-3">
                                <div className="small text-muted">
                                    Uploaded By:{" "}
                                    {activeSlip.uploaded_by_name ||
                                        "N/A"}
                                </div>

                                <div className="small text-muted">
                                    Uploaded At:{" "}
                                    {activeSlip.uploaded_at
                                        ? new Date(
                                            activeSlip.uploaded_at
                                        ).toLocaleString("en-IN")
                                        : "N/A"}
                                </div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <div className="d-flex gap-2">
                                    {selectedSlips.length > 1 && (
                                        <>
                                            <Button
                                                color="secondary"
                                                outline
                                                disabled={activeSlipIndex === 0}
                                                onClick={() =>
                                                    setActiveSlipIndex(
                                                        (prev) => prev - 1
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>

                                            <Button
                                                color="primary"
                                                disabled={
                                                    activeSlipIndex ===
                                                    selectedSlips.length - 1
                                                }
                                                onClick={() =>
                                                    setActiveSlipIndex(
                                                        (prev) => prev + 1
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    <Button
                                        color="primary"
                                        outline
                                        tag="a"
                                        href={activeSlip.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open Original
                                    </Button>

                                    <Button
                                        color="secondary"
                                        onClick={closeSlipModal}
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </ModalBody>
            </Modal>

            <ToastContainer />
        </React.Fragment>
    );
};

export default PendingProformaInvoices;
