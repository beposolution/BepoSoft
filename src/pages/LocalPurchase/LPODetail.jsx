import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Badge,
    Button,
    Card,
    CardBody,
    Col,
    Container,
    Input,
    Label,
    Row,
    Spinner,
    Table,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom";

const LPODetail = () => {
    const { id } = useParams();
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [lpo, setLpo] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [role, setRole] = useState("");
    const [banks, setBanks] = useState([]);
    const [companyData, setCompanyData] = useState([]);

    useEffect(() => {
        setRole((localStorage.getItem("active") || "").trim());
    }, []);

    useEffect(() => {
        const fetchBanks = async () => {
            const token = localStorage.getItem("token");
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.status === 200) setBanks(response.data.data);
            } catch (error) {
                toast.error("Error fetching banks");
            }
        };
        fetchBanks();
    }, []);

    useEffect(() => {
        const fetchCompanyData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setCompanyData(response?.data?.data)
            } catch (error) {
                toast.error("Error fetching family data.")
            }
        };
        fetchCompanyData();
    }, [])

    const fetchLPO = async () => {
        try {
            setPageLoading(true);

            const response = await axios.get(`${baseUrl}lpo/edit/${id}/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setLpo(response.data);
            console.log("data", response.data)
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to load LPO"
            );
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchLPO();
    }, [id]);

    const updateLPO = async () => {
        try {
            setLoading(true);
            console.log(lpo);

            const response = await axios.put(
                `${baseUrl}lpo/edit/${id}/`,
                lpo,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setLpo(response.data?.data || response.data || lpo);
            toast.success("LPO updated successfully");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "LPO update failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadInvoice = () => {
        window.open(`${baseUrl}lpo/invoice/${id}/`, "_blank");
    };

    const allowedStatusRoles = [
        "ADMIN",
        "HR",
        "CEO",
        "COO",
        "Accounts / Accounting",
    ];

    const canShowStatusUpdate = allowedStatusRoles.includes(role);
    const isAccountingRole = [
        "Accounts / Accounting",
    ].includes(role);

    const allowedBankEditRoles = [
        "ADMIN",
        "CEO",
        "COO",
        "Accounts / Accounting",
    ];

    const canEditBank = allowedBankEditRoles.includes(role);

    const allowedCompanyEditRoles = [
        "ADMIN",
        "CEO",
        "COO",
        "Accounts / Accounting",
    ];

    const canEditCompany = allowedCompanyEditRoles.includes(role);

    const allowedItemEditRoles = [
        "ADMIN",
        "CEO",
        "COO",
        "Accounts / Accounting",
    ];

    const canEditItems = allowedItemEditRoles.includes(role);

    const handleItemChange = (itemIndex, field, value) => {
        let normalizedValue = value;

        if (field === "quantity") {
            normalizedValue = value === "" ? null : Number(value);
        }

        if (field === "amount") {
            normalizedValue = value === "" ? null : Number(value);
        }

        setLpo((previous) => ({
            ...previous,
            items: (previous.items || []).map((item, index) =>
                index === itemIndex
                    ? {
                        ...item,
                        [field]: normalizedValue,
                    }
                    : item
            ),
        }));
    };

    const statusOptions = useMemo(() => {
        if (!lpo) return [];

        if (role === "HR") {
            return lpo.status === "pending"
                ? [
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                ]
                : [
                    {
                        value: lpo.status,
                        label: lpo.status,
                    },
                ];
        }

        if (isAccountingRole) {
            return lpo.status === "approved"
                ? [
                    { value: "approved", label: "Approved" },
                    { value: "confirmed", label: "Confirmed" },
                ]
                : [
                    {
                        value: lpo.status,
                        label: lpo.status,
                    },
                ];
        }

        return [
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "confirmed", label: "Confirmed" },
            { value: "rejected", label: "Rejected" },
        ];
    }, [lpo, role, isAccountingRole]);

    const updateLPOStatus = async (newStatus) => {
        if (!newStatus || newStatus === lpo.status) return;

        const previousStatus = lpo.status;

        setLpo((previous) => ({
            ...previous,
            status: newStatus,
        }));

        try {
            setStatusLoading(true);

            const response = await axios.patch(
                `${baseUrl}lpo/status/${id}/`,
                { status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setLpo(response.data?.data || response.data);
            toast.success(
                response.data?.message ||
                "LPO status updated successfully"
            );
        } catch (error) {
            setLpo((previous) => ({
                ...previous,
                status: previousStatus,
            }));

            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Status update failed"
            );
        } finally {
            setStatusLoading(false);
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "—";

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return dateValue;

        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getStatusTheme = (status) => {
        const themes = {
            pending: {
                background: "#fff7ed",
                color: "#c2410c",
                border: "#fed7aa",
                icon: "bx-time-five",
            },
            approved: {
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "#bfdbfe",
                icon: "bx-check-circle",
            },
            confirmed: {
                background: "#ecfdf0",
                color: "#047857",
                border: "#a7f3d0",
                icon: "bx-badge-check",
            },
            rejected: {
                background: "#fef2f2",
                color: "#b91c1c",
                border: "#fecaca",
                icon: "bx-x-circle",
            },
        };

        return themes[status] || themes.pending;
    };

    const totalQuantity = useMemo(() => {
        return (lpo?.items || []).reduce(
            (total, item) => total + Number(item.quantity || 0),
            0
        );
    }, [lpo]);

    const totalAmount = useMemo(() => {
        return (lpo?.items || []).reduce(
            (total, item) => total + Number(item.amount || 0),
            0
        );
    }, [lpo]);

    const summaryCards = [
        {
            label: "Company",
            value: lpo?.company_name || lpo?.company || "—",
            icon: "bx-buildings",
        },
        {
            label: "Requested By",
            value: lpo?.requested_by_name || "—",
            icon: "bx-user-plus",
        },
        {
            label: "Approved By",
            value: lpo?.approved_by_name || "Not approved",
            icon: "bx-user-check",
        },
        {
            label: "Confirmed By",
            value: lpo?.confirmed_by_name || "Not confirmed",
            icon: "bx-badge-check",
        },
        {
            label: "Bank",
            value: lpo?.bank_name || "Not selected",
            icon: "bx-bank",
        },
        {
            label: "Total Quantity",
            value: totalQuantity,
            icon: "bx-package",
        },
        {
            label: "Total Amount",
            value: formatCurrency(totalAmount),
            icon: "bx-rupee",
        },
    ];

    if (pageLoading) {
        return (
            <div
                className="page-content d-flex align-items-center justify-content-center"
                style={{ minHeight: "100vh", background: "#f4f7fb" }}
            >
                <div className="text-center">
                    <Spinner color="primary" />
                    <p className="text-muted mt-3 mb-0">Loading LPO details...</p>
                </div>
            </div>
        );
    }

    if (!lpo) {
        return (
            <div
                className="page-content d-flex align-items-center justify-content-center"
                style={{ minHeight: "100vh", background: "#f4f7fb" }}
            >
                <Card className="border-0 shadow-sm text-center">
                    <CardBody className="p-5">
                        <i
                            className="bx bx-file-find"
                            style={{ fontSize: 52, color: "#94a3b8" }}
                        />
                        <h5 className="mt-3">LPO not found</h5>
                        <p className="text-muted mb-3">
                            The requested purchase order could not be loaded.
                        </p>
                        <Button color="primary" onClick={fetchLPO}>
                            Try Again
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    const statusTheme = getStatusTheme(lpo.status);
    const restrictedStatusLocked =
        (role === "HR" || isAccountingRole) && lpo.status !== "pending";

    return (
        <React.Fragment>
            <div
                className="page-content"
                style={{
                    background: "#f4f7fb",
                    minHeight: "100vh",
                }}
            >
                <ToastContainer position="top-right" autoClose={2500} />

                <Container fluid>
                    <div
                        className="mb-4 overflow-hidden"
                        style={{
                            borderRadius: 22,
                            background:
                                "linear-gradient(135deg, #111827 0%, #1f2937 52%, #334155 100%)",
                            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.18)",
                        }}
                    >
                        <div className="p-4 p-lg-5">
                            <Row className="align-items-center g-4">
                                <Col lg="8">
                                    <div className="d-flex align-items-center gap-3">
                                        <div
                                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{
                                                width: 64,
                                                height: 64,
                                                borderRadius: 20,
                                                background: "rgba(255,255,255,.12)",
                                                border: "1px solid rgba(255,255,255,.14)",
                                            }}
                                        >
                                            <i
                                                className="bx bx-receipt text-white"
                                                style={{ fontSize: 31 }}
                                            />
                                        </div>

                                        <div>
                                            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                                <h3 className="text-white fw-bold mb-0">
                                                    Local Purchase Order
                                                </h3>

                                                <Badge
                                                    pill
                                                    style={{
                                                        padding: "8px 12px",
                                                        background: statusTheme.background,
                                                        color: statusTheme.color,
                                                        border: `1px solid ${statusTheme.border}`,
                                                        textTransform: "capitalize",
                                                    }}
                                                >
                                                    <i className={`bx ${statusTheme.icon} me-1`} />
                                                    {lpo.status || "Pending"}
                                                </Badge>
                                            </div>

                                            <div
                                                className="d-flex flex-wrap align-items-center gap-3"
                                                style={{ color: "rgba(255,255,255,.72)" }}
                                            >
                                                <span>
                                                    <i className="bx bx-hash me-1" />
                                                    {lpo.invoice || `LPO-${id}`}
                                                </span>
                                                <span>
                                                    <i className="bx bx-calendar me-1" />
                                                    {formatDate(lpo.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Col>

                                <Col lg="4">
                                    <div className="d-flex flex-wrap justify-content-lg-end gap-2">
                                        <Button
                                            color="light"
                                            onClick={downloadInvoice}
                                            style={{
                                                borderRadius: 12,
                                                minHeight: 44,
                                                padding: "0 18px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <i className="bx bx-download me-2" />
                                            Download Invoice
                                        </Button>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    </div>

                    <Row className="g-3 mb-4">
                        {summaryCards.map((card) => (
                            <Col xl="3" lg="4" md="6" key={card.label}>
                                <Card
                                    className="border-0 h-100"
                                    style={{
                                        borderRadius: 18,
                                        boxShadow: "0 8px 26px rgba(15,23,42,.07)",
                                    }}
                                >
                                    <CardBody className="p-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <div
                                                className="d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 14,
                                                    background: "#eef2ff",
                                                    color: "#4f46e5",
                                                }}
                                            >
                                                <i
                                                    className={`bx ${card.icon}`}
                                                    style={{ fontSize: 23 }}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-muted small mb-1">
                                                    {card.label}
                                                </p>
                                                <h6
                                                    className="fw-bold mb-0 text-truncate"
                                                    title={String(card.value)}
                                                >
                                                    {card.value}
                                                </h6>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row className="g-4 mb-4">
                        <Col xl={canShowStatusUpdate ? 8 : 12}>
                            <Card
                                className="border-0 h-100"
                                style={{
                                    borderRadius: 20,
                                    boxShadow: "0 10px 30px rgba(15,23,42,.07)",
                                }}
                            >
                                <CardBody className="p-4">
                                    <div className="d-flex align-items-center gap-3 mb-4">
                                        <div
                                            className="d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 42,
                                                height: 42,
                                                borderRadius: 13,
                                                background: "#eff6ff",
                                                color: "#2563eb",
                                            }}
                                        >
                                            <i className="bx bx-edit" style={{ fontSize: 21 }} />
                                        </div>
                                        <div>
                                            <h5 className="fw-bold mb-1">
                                                Purchase Order Information
                                            </h5>
                                            <p className="text-muted mb-0 small">
                                                Review and update the editable LPO details.
                                            </p>
                                        </div>
                                    </div>

                                    <Row className="g-3">
                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                Company
                                            </Label>

                                            {canEditCompany ? (
                                                <Input
                                                    type="select"
                                                    value={lpo.company || ""}
                                                    onChange={(event) => {
                                                        const selectedCompanyId =
                                                            event.target.value;

                                                        const selectedCompany =
                                                            companyData.find(
                                                                (company) =>
                                                                    Number(company.id) ===
                                                                    Number(selectedCompanyId)
                                                            );

                                                        setLpo((previous) => ({
                                                            ...previous,
                                                            company: selectedCompanyId
                                                                ? Number(selectedCompanyId)
                                                                : null,
                                                            company_name:
                                                                selectedCompany?.name ||
                                                                selectedCompany?.company_name ||
                                                                null,
                                                        }));
                                                    }}
                                                    style={{
                                                        borderRadius: 12,
                                                        minHeight: 46,
                                                        background: "#f8fafc",
                                                        borderColor: "#e2e8f0",
                                                    }}
                                                >
                                                    <option value="">
                                                        Select Company
                                                    </option>

                                                    {(companyData || []).map(
                                                        (company) => (
                                                            <option
                                                                key={company.id}
                                                                value={company.id}
                                                            >
                                                                {company.name ||
                                                                    company.company_name ||
                                                                    `Company ${company.id}`}
                                                            </option>
                                                        )
                                                    )}
                                                </Input>
                                            ) : (
                                                <Input
                                                    type="text"
                                                    value={
                                                        lpo.company_name ||
                                                        "Not selected"
                                                    }
                                                    disabled
                                                    style={{
                                                        borderRadius: 12,
                                                        minHeight: 46,
                                                        background: "#f1f5f9",
                                                        borderColor: "#e2e8f0",
                                                    }}
                                                />
                                            )}

                                            <small className="text-muted">
                                                {canEditCompany
                                                    ? "You can select or change the company."
                                                    : "Only ADMIN, CEO, COO and Accounting can edit the company."}
                                            </small>
                                        </Col>

                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                LPO Date
                                            </Label>
                                            <Input
                                                type="date"
                                                value={lpo.date || ""}
                                                onChange={(event) =>
                                                    setLpo((previous) => ({
                                                        ...previous,
                                                        date: event.target.value,
                                                    }))
                                                }
                                                style={{
                                                    borderRadius: 12,
                                                    minHeight: 46,
                                                    background: "#f8fafc",
                                                    borderColor: "#e2e8f0",
                                                }}
                                            />
                                        </Col>

                                        <Col md="8">
                                            <Label className="fw-semibold text-secondary">
                                                Note
                                            </Label>
                                            <Input
                                                type="textarea"
                                                rows="3"
                                                value={lpo.note || ""}
                                                placeholder="Enter purchase order note"
                                                onChange={(event) =>
                                                    setLpo((previous) => ({
                                                        ...previous,
                                                        note: event.target.value,
                                                    }))
                                                }
                                                style={{
                                                    borderRadius: 12,
                                                    background: "#f8fafc",
                                                    borderColor: "#e2e8f0",
                                                    resize: "vertical",
                                                }}
                                            />
                                        </Col>

                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                Bank
                                            </Label>

                                            {canEditBank ? (
                                                <Input
                                                    type="select"
                                                    value={lpo.bank || ""}
                                                    onChange={(event) =>
                                                        setLpo((previous) => ({
                                                            ...previous,
                                                            bank: event.target.value
                                                                ? Number(event.target.value)
                                                                : null,
                                                            bank_name:
                                                                banks.find(
                                                                    (bank) =>
                                                                        Number(bank.id) ===
                                                                        Number(event.target.value)
                                                                )?.name || null,
                                                        }))
                                                    }
                                                    style={{
                                                        borderRadius: 12,
                                                        minHeight: 46,
                                                        background: "#f8fafc",
                                                        borderColor: "#e2e8f0",
                                                    }}
                                                >
                                                    <option value="">Select Bank</option>

                                                    {banks.map((bank) => (
                                                        <option key={bank.id} value={bank.id}>
                                                            {bank.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            ) : (
                                                <Input
                                                    type="text"
                                                    value={lpo.bank_name || "Not selected"}
                                                    disabled
                                                    style={{
                                                        borderRadius: 12,
                                                        minHeight: 46,
                                                        background: "#f1f5f9",
                                                        borderColor: "#e2e8f0",
                                                    }}
                                                />
                                            )}

                                            <small className="text-muted">
                                                {canEditBank
                                                    ? "You can select or change the bank."
                                                    : "Only ADMIN, CEO, COO and Accounting can edit the bank."}
                                            </small>
                                        </Col>

                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                Requested By
                                            </Label>
                                            <Input
                                                type="text"
                                                value={lpo.requested_by_name || "—"}
                                                disabled
                                                style={{
                                                    borderRadius: 12,
                                                    minHeight: 46,
                                                    background: "#f1f5f9",
                                                    borderColor: "#e2e8f0",
                                                }}
                                            />
                                        </Col>

                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                Approved By
                                            </Label>
                                            <Input
                                                type="text"
                                                value={lpo.approved_by_name || "Not approved"}
                                                disabled
                                                style={{
                                                    borderRadius: 12,
                                                    minHeight: 46,
                                                    background: "#f1f5f9",
                                                    borderColor: "#e2e8f0",
                                                }}
                                            />
                                        </Col>

                                        <Col md="4">
                                            <Label className="fw-semibold text-secondary">
                                                Confirmed By
                                            </Label>
                                            <Input
                                                type="text"
                                                value={lpo.confirmed_by_name || "Not confirmed"}
                                                disabled
                                                style={{
                                                    borderRadius: 12,
                                                    minHeight: 46,
                                                    background: "#f1f5f9",
                                                    borderColor: "#e2e8f0",
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                </CardBody>
                            </Card>
                        </Col>

                        {canShowStatusUpdate && (
                            <Col xl="4">
                                <Card
                                    className="border-0 h-100"
                                    style={{
                                        borderRadius: 20,
                                        boxShadow: "0 10px 30px rgba(15,23,42,.07)",
                                    }}
                                >
                                    <CardBody className="p-4">
                                        <div className="d-flex align-items-center gap-3 mb-4">
                                            <div
                                                className="d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: 42,
                                                    height: 42,
                                                    borderRadius: 13,
                                                    background: statusTheme.background,
                                                    color: statusTheme.color,
                                                }}
                                            >
                                                <i
                                                    className={`bx ${statusTheme.icon}`}
                                                    style={{ fontSize: 21 }}
                                                />
                                            </div>
                                            <div>
                                                <h5 className="fw-bold mb-1">Status Update</h5>
                                                <p className="text-muted mb-0 small">
                                                    Change the purchase order workflow status.
                                                </p>
                                            </div>
                                        </div>

                                        <Label className="fw-semibold text-secondary">
                                            Current Status
                                        </Label>

                                        <Input
                                            type="select"
                                            value={lpo.status || "pending"}
                                            disabled={statusLoading || restrictedStatusLocked}
                                            onChange={(event) =>
                                                updateLPOStatus(event.target.value)
                                            }
                                            style={{
                                                borderRadius: 12,
                                                minHeight: 48,
                                                background: "#f8fafc",
                                                borderColor: "#e2e8f0",
                                                fontWeight: 700,
                                                textTransform: "capitalize",
                                            }}
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Input>

                                        <div
                                            className="mt-3 p-3"
                                            style={{
                                                borderRadius: 12,
                                                background: statusTheme.background,
                                                border: `1px solid ${statusTheme.border}`,
                                                color: statusTheme.color,
                                            }}
                                        >
                                            {statusLoading ? (
                                                <div className="d-flex align-items-center gap-2">
                                                    <Spinner size="sm" />
                                                    <span className="small fw-semibold">
                                                        Updating status...
                                                    </span>
                                                </div>
                                            ) : role === "HR" ? (
                                                <span className="small fw-semibold">
                                                    HR can change a pending LPO to approved.
                                                </span>
                                            ) : isAccountingRole ? (
                                                <span className="small fw-semibold">
                                                    Accounting can change a pending LPO to confirmed.
                                                </span>
                                            ) : (
                                                <span className="small fw-semibold">
                                                    You have full access to update the LPO status.
                                                </span>
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        )}
                    </Row>

                    <Card
                        className="border-0 mb-4"
                        style={{
                            borderRadius: 20,
                            boxShadow: "0 10px 30px rgba(15,23,42,.07)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            className="d-flex flex-wrap align-items-center justify-content-between gap-3"
                            style={{
                                padding: "22px 24px",
                                borderBottom: "1px solid #eef2f7",
                                background: "#ffffff",
                            }}
                        >
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center justify-content-center"
                                    style={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: 13,
                                        background: "#f0fdf4",
                                        color: "#16a34a",
                                    }}
                                >
                                    <i className="bx bx-package" style={{ fontSize: 21 }} />
                                </div>
                                <div>
                                    <h5 className="fw-bold mb-1">Purchase Items</h5>
                                    <p className="text-muted mb-0 small">
                                        {canEditItems
                                            ? "Edit the product, description, quantity and amount."
                                            : "Products included in this local purchase order."}
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex flex-wrap align-items-center gap-2">
                                <Badge
                                    pill
                                    style={{
                                        background: "#f1f5f9",
                                        color: "#475569",
                                        padding: "9px 13px",
                                    }}
                                >
                                    {(lpo.items || []).length} item
                                    {(lpo.items || []).length === 1 ? "" : "s"}
                                </Badge>

                                <Button
                                    color="primary"
                                    onClick={updateLPO}
                                    disabled={loading}
                                    style={{
                                        borderRadius: 12,
                                        minHeight: 42,
                                        padding: "0 18px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bx bx-save me-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <CardBody className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead style={{ background: "#f8fafc" }}>
                                        <tr>
                                            <th className="ps-4 py-3">#</th>
                                            <th className="py-3">Product</th>
                                            <th className="py-3">Description</th>
                                            <th className="py-3 text-center">Quantity</th>
                                            <th className="py-3 text-end pe-4">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(lpo.items || []).length > 0 ? (
                                            lpo.items.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td className="ps-4 text-muted">
                                                        {index + 1}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div
                                                                className="d-flex align-items-center justify-content-center flex-shrink-0"
                                                                style={{
                                                                    width: 42,
                                                                    height: 42,
                                                                    borderRadius: 12,
                                                                    background: "#eef2ff",
                                                                    color: "#4f46e5",
                                                                }}
                                                            >
                                                                <i className="bx bx-cube" />
                                                            </div>
                                                            {canEditItems ? (
                                                                <Input
                                                                    type="text"
                                                                    value={item.product || ""}
                                                                    placeholder="Product name"
                                                                    onChange={(event) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "product",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    style={{
                                                                        minWidth: 180,
                                                                        minHeight: 40,
                                                                        borderRadius: 10,
                                                                        background: "#f8fafc",
                                                                        borderColor: "#e2e8f0",
                                                                        fontWeight: 600,
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="fw-semibold text-dark">
                                                                    {item.product || "Unnamed product"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ minWidth: 230 }}>
                                                        {canEditItems ? (
                                                            <Input
                                                                type="text"
                                                                value={item.product_description || ""}
                                                                placeholder="Product description"
                                                                onChange={(event) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "product_description",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={{
                                                                    minWidth: 220,
                                                                    minHeight: 40,
                                                                    borderRadius: 10,
                                                                    background: "#f8fafc",
                                                                    borderColor: "#e2e8f0",
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-muted">
                                                                {item.product_description || "—"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {canEditItems ? (
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                value={
                                                                    item.quantity === null ||
                                                                        item.quantity === undefined
                                                                        ? ""
                                                                        : item.quantity
                                                                }
                                                                placeholder="0"
                                                                onChange={(event) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "quantity",
                                                                        event.target.value
                                                                    )
                                                                }
                                                                style={{
                                                                    width: 95,
                                                                    minHeight: 40,
                                                                    margin: "0 auto",
                                                                    borderRadius: 10,
                                                                    background: "#f8fafc",
                                                                    borderColor: "#e2e8f0",
                                                                    textAlign: "center",
                                                                    fontWeight: 700,
                                                                }}
                                                            />
                                                        ) : (
                                                            <Badge
                                                                pill
                                                                style={{
                                                                    background: "#eff6ff",
                                                                    color: "#2563eb",
                                                                    padding: "8px 12px",
                                                                }}
                                                            >
                                                                {item.quantity || 0}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td
                                                        className="text-end pe-4"
                                                        style={{ minWidth: 170 }}
                                                    >
                                                        {canEditItems ? (
                                                            <div
                                                                className="d-flex align-items-center justify-content-end"
                                                                style={{ gap: 8 }}
                                                            >
                                                                <span className="fw-semibold text-muted">
                                                                    ₹
                                                                </span>

                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={
                                                                        item.amount === null ||
                                                                            item.amount === undefined
                                                                            ? ""
                                                                            : item.amount
                                                                    }
                                                                    placeholder="0.00"
                                                                    onChange={(event) =>
                                                                        handleItemChange(
                                                                            index,
                                                                            "amount",
                                                                            event.target.value
                                                                        )
                                                                    }
                                                                    style={{
                                                                        width: 125,
                                                                        minHeight: 40,
                                                                        borderRadius: 10,
                                                                        background: "#f8fafc",
                                                                        borderColor: "#e2e8f0",
                                                                        textAlign: "right",
                                                                        fontWeight: 700,
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="fw-bold">
                                                                {formatCurrency(item.amount)}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <i
                                                        className="bx bx-package"
                                                        style={{
                                                            fontSize: 44,
                                                            color: "#cbd5e1",
                                                        }}
                                                    />
                                                    <p className="text-muted mt-2 mb-0">
                                                        No products are available in this LPO.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>

                                    {(lpo.items || []).length > 0 && (
                                        <tfoot style={{ background: "#f8fafc" }}>
                                            <tr>
                                                <td colSpan="3" className="ps-4 py-3 fw-bold">
                                                    Total
                                                </td>
                                                <td className="text-center py-3 fw-bold">
                                                    {totalQuantity}
                                                </td>
                                                <td className="text-end pe-4 py-3 fw-bold text-primary">
                                                    {formatCurrency(totalAmount)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default LPODetail;
