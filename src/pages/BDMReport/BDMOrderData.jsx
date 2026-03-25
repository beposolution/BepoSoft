import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    CardTitle,
    Form,
    Label,
    Button,
    Input,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const BDMOrderData = () => {
    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY;

    const [userFamilyId, setUserFamilyId] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [orders, setOrders] = useState([]);

    const [selectedBDM, setSelectedBDM] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [note, setNote] = useState("");

    const [allSelections, setAllSelections] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedFilterBDM, setSelectedFilterBDM] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);

    const [loadingSelections, setLoadingSelections] = useState(false);

    const [viewOrders, setViewOrders] = useState(null);

    const cellStyle = {
        padding: "10px 10px",
        border: "1px solid #e5e7eb",
        verticalAlign: "top",
    };

    const cardStyle = {
        background: "#f5f7ff",
        border: "1px solid #e0e7ff",
        borderRadius: "10px",
        padding: "12px",
    };

    const labelStyle = {
        fontSize: "11px",
        color: "#6b7280",
        marginBottom: "4px",
    };

    const fetchSelections = async (page = 1) => {
        try {
            setLoadingSelections(true);

            const res = await axios.get(`${BASE_URL}bdm/order/selection/add/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: page,
                    search: searchText.trim(),
                    bdm: selectedFilterBDM?.value || "",
                    start_date: startDate || "",
                    end_date: endDate || "",
                },
            });

            const data = res.data || {};
            const results = data.results || {};

            const selectionData = results.data || [];

            setAllSelections(Array.isArray(selectionData) ? selectionData : []);
            setTotalCount(data.count || 0);
            setNextPageUrl(data.next || null);
            setPreviousPageUrl(data.previous || null);

            const pages = Math.ceil((data.count || 0) / itemsPerPage);
            setTotalPages(pages > 0 ? pages : 1);
        } catch (err) {
            setAllSelections([]);
            setTotalCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
            setTotalPages(1);
            toast.error("Failed to load selections");
        } finally {
            setLoadingSelections(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`${BASE_URL}profile/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const familyId = res?.data?.data?.family_id;
                setUserFamilyId(familyId);
            } catch {
                toast.error("Failed to load profile");
            }
        };

        fetchProfile();
    }, [BASE_URL, token]);

    useEffect(() => {
        const fetchStaffs = async () => {
            try {
                const res = await axios.get(`${BASE_URL}staffs/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const staffData =
                    res.data?.results?.data ||
                    res.data?.results ||
                    res.data?.data ||
                    res.data ||
                    [];

                setStaffList(Array.isArray(staffData) ? staffData : []);
            } catch {
                toast.error("Failed to load staffs");
            }
        };

        fetchStaffs();
    }, [BASE_URL, token]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await axios.get(`${BASE_URL}family/department/orders/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const orderData =
                    res.data?.results?.data ||
                    res.data?.results ||
                    res.data?.data ||
                    res.data ||
                    [];

                setOrders(Array.isArray(orderData) ? orderData : []);
            } catch {
                toast.error("Failed to load orders");
            }
        };

        fetchOrders();
    }, [BASE_URL, token]);

    useEffect(() => {
        fetchSelections(currentPage);
    }, [currentPage, selectedFilterBDM, startDate, endDate]);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setCurrentPage(1);
            fetchSelections(1);
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchText]);

    const staffOptions = useMemo(() => {
        return staffList
            .filter((staff) => {
                if (!userFamilyId) return true;

                return (
                    staff.family === userFamilyId ||
                    staff.family_id === userFamilyId ||
                    staff.family?.id === userFamilyId
                );
            })
            .map((staff) => ({
                value: staff.id,
                label: staff.name || staff.full_name || `Staff #${staff.id}`,
            }));
    }, [staffList, userFamilyId]);

    const filterBDMOptions = useMemo(() => {
        return staffOptions;
    }, [staffOptions]);

    const postedInvoices = useMemo(() => {
        const set = new Set();

        (allSelections || []).forEach((selection) => {
            (selection.items || []).forEach((item) => {
                const invoice =
                    item.order_invoice ||
                    item.invoice ||
                    item.order?.invoice;

                if (invoice) {
                    set.add(String(invoice).trim());
                }
            });
        });

        return set;
    }, [allSelections]);

    const orderOptions = useMemo(() => {
        if (!selectedBDM) return [];

        return orders
            .filter((order) => String(order.staffID) === String(selectedBDM.value))
            .map((order) => ({
                value: order.id,
                invoice: String(order.invoice ?? "").trim(),
                label: `Order: ${order.invoice}, BDO: ${order.manage_staff}`,
            }));
    }, [orders, selectedBDM]);

    const handleOrderChange = (newValue) => {
        const selected = newValue || [];

        const invalidItems = selected.filter((item) =>
            postedInvoices.has(String(item.invoice).trim())
        );

        if (invalidItems.length > 0) {
            toast.error("This invoice is already added");
        }

        const validItems = selected.filter(
            (item) => !postedInvoices.has(String(item.invoice).trim())
        );

        setSelectedOrders(validItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBDM) {
            toast.error("Select BDO");
            return;
        }

        if (selectedOrders.length === 0) {
            toast.error("Select orders");
            return;
        }

        const duplicateSelected = selectedOrders.filter((item) =>
            postedInvoices.has(String(item.invoice).trim())
        );

        if (duplicateSelected.length > 0) {
            toast.error("This invoice is already added");
            return;
        }

        const payload = {
            bdm: selectedBDM.value,
            note: note,
            items: selectedOrders.map((item) => ({
                order: item.value,
            })),
        };

        try {
            await axios.post(`${BASE_URL}bdm/order/selection/add/`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            toast.success("Submitted successfully");

            setSelectedBDM(null);
            setSelectedOrders([]);
            setNote("");

            setCurrentPage(1);
            await fetchSelections(1);
        } catch (err) {
            toast.error("Submission failed");
        }
    };

    const handleDelete = async (item) => {
        const itemId = item?.id;

        if (!itemId) {
            toast.error("Invalid item");
            return;
        }

        if (!window.confirm("Are you sure you want to delete?")) return;

        const url = `${BASE_URL}bdm/order/selection/edit/${itemId}/`;

        try {
            await axios.delete(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            toast.success("Deleted successfully");

            const newPage =
                allSelections.length === 1 && currentPage > 1
                    ? currentPage - 1
                    : currentPage;

            setCurrentPage(newPage);
            await fetchSelections(newPage);

            if (viewOrders?.id === itemId) {
                setViewOrders(null);
            }
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleResetFilters = () => {
        setSearchText("");
        setSelectedFilterBDM(null);
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
        fetchSelections(1);
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="BDM Order Report"
                />

                <Row>
                    <Col lg={12}>
                        <Card className="shadow-sm">
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    BDM ORDER REPORT
                                </CardTitle>

                                <Form onSubmit={handleSubmit}>
                                    <Row className="g-3 mb-2">
                                        <Col md={6}>
                                            <div className="p-1">
                                                <Label className="fw-semibold mb-2">
                                                    Select BDO
                                                </Label>
                                                <Select
                                                    options={staffOptions}
                                                    value={selectedBDM}
                                                    onChange={setSelectedBDM}
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            minHeight: "44px",
                                                            fontSize: "14px",
                                                            borderRadius: "8px",
                                                        }),
                                                    }}
                                                />
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            <div className="p-1">
                                                <Label className="fw-semibold mb-2">
                                                    Note
                                                </Label>
                                                <Input
                                                    style={{
                                                        height: "44px",
                                                        fontSize: "14px",
                                                        borderRadius: "8px",
                                                    }}
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="Enter note..."
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="g-3 mb-3">
                                        <Col md={12}>
                                            <div className="p-1">
                                                <Label className="fw-semibold mb-2">
                                                    Select Orders
                                                </Label>
                                                <Select
                                                    options={orderOptions}
                                                    value={selectedOrders}
                                                    onChange={handleOrderChange}
                                                    isMulti
                                                    closeMenuOnSelect={false}
                                                    placeholder="Select multiple orders..."
                                                    styles={{
                                                        control: (base) => ({
                                                            ...base,
                                                            minHeight: "48px",
                                                            fontSize: "14px",
                                                            borderRadius: "8px",
                                                        }),
                                                    }}
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-end">
                                        <Button
                                            color="success"
                                            className="px-4 py-2 fw-semibold"
                                            style={{ borderRadius: "8px" }}
                                            type="submit"
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                </Form>
                            </CardBody>
                        </Card>

                        <Row className="mt-4">
                            <Col lg={12}>
                                <Card className="shadow-sm border-0">
                                    <CardBody>
                                        <CardTitle className="h5 mb-4 fw-bold">
                                            Selected Orders
                                        </CardTitle>

                                        <div
                                            style={{
                                                background: "#ffffff",
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "16px",
                                                padding: "16px",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            <Row className="g-3 align-items-end">
                                                <Col md={3}>
                                                    <Label className="fw-semibold mb-2">
                                                        Search Invoice
                                                    </Label>
                                                    <Input
                                                        value={searchText}
                                                        onChange={(e) => setSearchText(e.target.value)}
                                                        placeholder="Search invoice..."
                                                        style={{
                                                            height: "42px",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                </Col>

                                                <Col md={3}>
                                                    <Label className="fw-semibold mb-2">
                                                        BDM
                                                    </Label>
                                                    <Select
                                                        options={filterBDMOptions}
                                                        value={selectedFilterBDM}
                                                        onChange={(val) => {
                                                            setSelectedFilterBDM(val);
                                                            setCurrentPage(1);
                                                        }}
                                                        isClearable
                                                        placeholder="Filter BDM"
                                                    />
                                                </Col>

                                                <Col md={2}>
                                                    <Label className="fw-semibold mb-2">
                                                        Start Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={startDate}
                                                        onChange={(e) => {
                                                            setStartDate(e.target.value);
                                                            setCurrentPage(1);
                                                        }}
                                                        style={{
                                                            height: "42px",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                </Col>

                                                <Col md={2}>
                                                    <Label className="fw-semibold mb-2">
                                                        End Date
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={endDate}
                                                        onChange={(e) => {
                                                            setEndDate(e.target.value);
                                                            setCurrentPage(1);
                                                        }}
                                                        style={{
                                                            height: "42px",
                                                            borderRadius: "8px",
                                                        }}
                                                    />
                                                </Col>

                                                <Col md={2}>
                                                    <Button
                                                        color="secondary"
                                                        onClick={handleResetFilters}
                                                        style={{
                                                            height: "42px",
                                                            width: "100%",
                                                            borderRadius: "8px",
                                                        }}
                                                    >
                                                        Reset
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="table-responsive">
                                            <table
                                                style={{
                                                    width: "100%",
                                                    borderCollapse: "collapse",
                                                    fontFamily: "system-ui, -apple-system, sans-serif",
                                                    fontSize: "13px",
                                                    background: "#fdfcff",
                                                    borderRadius: "10px",
                                                    overflow: "hidden",
                                                    boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                                                }}
                                            >
                                                <thead>
                                                    <tr style={{ background: "#eef2ff", color: "#3730a3" }}>
                                                        {["#", "BDM Name", "Note", "Invoices", "Action"].map(
                                                            (head, i) => (
                                                                <th
                                                                    key={i}
                                                                    style={{
                                                                        padding: "10px",
                                                                        textAlign: "left",
                                                                        fontWeight: "600",
                                                                        border: "1px solid #e5e7eb",
                                                                    }}
                                                                >
                                                                    {head}
                                                                </th>
                                                            )
                                                        )}
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {loadingSelections ? (
                                                        <tr>
                                                            <td
                                                                colSpan="5"
                                                                style={{
                                                                    textAlign: "center",
                                                                    padding: "20px",
                                                                    color: "#6b7280",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                Loading...
                                                            </td>
                                                        </tr>
                                                    ) : allSelections.length === 0 ? (
                                                        <tr>
                                                            <td
                                                                colSpan="5"
                                                                style={{
                                                                    textAlign: "center",
                                                                    padding: "20px",
                                                                    color: "#6b7280",
                                                                    fontSize: "14px",
                                                                }}
                                                            >
                                                                No records found
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        allSelections.map((item, index) => (
                                                            <tr
                                                                key={item.id || index}
                                                                style={{
                                                                    background: "#fafaff",
                                                                    transition: "0.2s ease",
                                                                }}
                                                                onMouseEnter={(e) =>
                                                                    (e.currentTarget.style.background = "#f1f5ff")
                                                                }
                                                                onMouseLeave={(e) =>
                                                                    (e.currentTarget.style.background = "#fafaff")
                                                                }
                                                            >
                                                                <td
                                                                    style={{
                                                                        ...cellStyle,
                                                                        width: "40px",
                                                                        textAlign: "center",
                                                                    }}
                                                                >
                                                                    {(currentPage - 1) * itemsPerPage + index + 1}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        ...cellStyle,
                                                                        width: "140px",
                                                                        fontWeight: "600",
                                                                        color: "#1e1b4b",
                                                                    }}
                                                                >
                                                                    {item.bdm_name}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        ...cellStyle,
                                                                        color: "#374151",
                                                                        fontSize: "13px",
                                                                        width: "20%",
                                                                        lineHeight: "1.3",
                                                                        whiteSpace: "normal",
                                                                        wordBreak: "break-word",
                                                                    }}
                                                                >
                                                                    {item.note || (
                                                                        <span style={{ color: "#9ca3af" }}>
                                                                            No notes
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                <td
                                                                    style={{
                                                                        ...cellStyle,
                                                                        width: "40%",
                                                                        fontSize: "13px",
                                                                        lineHeight: "1.4",
                                                                    }}
                                                                >
                                                                    {item.items?.length ? (
                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "6px",
                                                                            }}
                                                                        >
                                                                            {item.items.map((o, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    style={{
                                                                                        background: "#e0e7ff",
                                                                                        color: "#3730a3",
                                                                                        padding: "4px 10px",
                                                                                        borderRadius: "999px",
                                                                                        fontSize: "11px",
                                                                                        fontWeight: "600",
                                                                                        whiteSpace: "nowrap",
                                                                                    }}
                                                                                >
                                                                                    {o.order_invoice}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: "#9ca3af" }}>
                                                                            No invoices
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                <td style={{ ...cellStyle, width: "160px" }}>
                                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                                        <button
                                                                            onClick={() => handleDelete(item)}
                                                                            style={{
                                                                                background: "#f87171",
                                                                                color: "#fff",
                                                                                border: "none",
                                                                                padding: "5px 10px",
                                                                                borderRadius: "5px",
                                                                                fontSize: "12px",
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>

                                            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                                                <div style={{ fontSize: "13px" }}>
                                                    Showing {allSelections.length} of {totalCount}
                                                </div>

                                                <div className="d-flex gap-2 align-items-center">
                                                    <Button
                                                        disabled={!previousPageUrl || currentPage === 1}
                                                        onClick={() =>
                                                            setCurrentPage((prev) =>
                                                                prev > 1 ? prev - 1 : 1
                                                            )
                                                        }
                                                    >
                                                        Previous
                                                    </Button>

                                                    <span>
                                                        Page {currentPage} / {totalPages}
                                                    </span>

                                                    <Button
                                                        disabled={!nextPageUrl || currentPage >= totalPages}
                                                        onClick={() =>
                                                            setCurrentPage((prev) => prev + 1)
                                                        }
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {viewOrders && (
                            <div
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    background: "rgba(15, 23, 42, 0.45)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    zIndex: 999,
                                }}
                            >
                                <div
                                    style={{
                                        background: "#fdfcff",
                                        padding: "22px",
                                        borderRadius: "16px",
                                        width: "720px",
                                        maxWidth: "95%",
                                        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                                    }}
                                >
                                    <h5
                                        style={{
                                            marginBottom: "18px",
                                            fontWeight: "600",
                                            textAlign: "center",
                                            color: "#312e81",
                                        }}
                                    >
                                        Order Details
                                    </h5>

                                    <div
                                        style={{
                                            display: "grid",
                                            gap: "14px",
                                        }}
                                    >
                                        <div style={cardStyle}>
                                            <div style={labelStyle}>BDM Name</div>
                                            <div style={{ fontWeight: "600", color: "#4338ca" }}>
                                                {viewOrders.bdm_name}
                                            </div>
                                        </div>

                                        <div style={cardStyle}>
                                            <div style={labelStyle}>Note</div>
                                            <div
                                                style={{
                                                    color: "#374151",
                                                    lineHeight: "1.5",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                {viewOrders.note || (
                                                    <span style={{ color: "#9ca3af" }}>No notes</span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={cardStyle}>
                                            <div style={labelStyle}>Invoices</div>

                                            <div
                                                style={{
                                                    maxHeight: "220px",
                                                    overflowY: "auto",
                                                    marginTop: "6px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #e0e7ff",
                                                }}
                                            >
                                                {viewOrders.items?.length ? (
                                                    viewOrders.items.map((o, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                padding: "8px 10px",
                                                                fontSize: "13px",
                                                                borderBottom: "1px solid #e5e7eb",
                                                                background: i % 2 === 0 ? "#f5f7ff" : "#ffffff",
                                                            }}
                                                        >
                                                            {o.order_invoice}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div
                                                        style={{
                                                            padding: "10px",
                                                            color: "#9ca3af",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        No invoices
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            marginTop: "18px",
                                            textAlign: "right",
                                        }}
                                    >
                                        <button
                                            onClick={() => setViewOrders(null)}
                                            style={{
                                                background: "#6366f1",
                                                color: "#fff",
                                                border: "none",
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                fontSize: "13px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default BDMOrderData;