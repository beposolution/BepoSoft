import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Table,
    CardTitle,
    Spinner,
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    FormGroup,
    Label,
    Input,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";

const ViewDailySalesReport = () => {
    const [data, setData] = useState([]);
    const [summary, setSummary] = useState(null);

    const [loadingUser, setLoadingUser] = useState(true);
    const [loadingReport, setLoadingReport] = useState(false);

    const [familyId, setFamilyId] = useState(null);
    const [role, setRole] = useState(null);

    const [viewModal, setViewModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    useEffect(() => {
        const roleValue = localStorage.getItem("active");
        setRole(roleValue);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingUser(true);

                const response = await axios.get(
                    `${baseUrl}profile/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const fetchedFamilyId = response?.data?.data?.family_id || null;
                setFamilyId(fetchedFamilyId);
            } catch (error) {
                toast.error("Error fetching user data");
                setFamilyId(null);
            } finally {
                setLoadingUser(false);
            }
        };

        if (token && baseUrl) {
            fetchUserData();
        } else {
            setLoadingUser(false);
            toast.error("Token or base URL missing");
        }
    }, [token, baseUrl]);

    const fetchReport = async () => {
        if (!familyId) return;

        try {
            setLoadingReport(true);

            const response = await axios.get(
                `${baseUrl}sales/analysis/family/${familyId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const summaryData = response?.data?.results || null;
            const reportData = response?.data?.results?.results || [];

            setSummary(summaryData);
            setData(Array.isArray(reportData) ? reportData : []);
        } catch (error) {
            toast.error("Failed to load report details");
            setSummary(null);
            setData([]);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (familyId) {
            fetchReport();
        }
    }, [familyId]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCellStyle = (callStatus) => {
        const status = (callStatus || "").toLowerCase();

        if (status === "active") {
            return {
                backgroundColor: "#fff3cd",
            };
        }

        if (status === "productive") {
            return {
                backgroundColor: "#d4edda",
            };
        }

        return {};
    };

    const toggleViewModal = () => {
        const nextOpenState = !viewModal;
        setViewModal(nextOpenState);

        if (!nextOpenState) {
            setSelectedId(null);
            setSelectedReport(null);
            setSelectedStatus("");
            setLoadingDetails(false);
            setUpdatingStatus(false);
        }
    };

    const handleView = async (id) => {
        if (!id) {
            toast.error("Invalid report id");
            return;
        }

        try {
            setSelectedId(id);
            setViewModal(true);
            setLoadingDetails(true);
            setSelectedReport(null);
            setSelectedStatus("");

            const response = await axios.get(
                `${baseUrl}sales/analysis/edit/${id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const details = response?.data?.data || response?.data || null;

            setSelectedReport(details);
            setSelectedStatus(details?.status || "");
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to fetch report details"
            );
            setSelectedReport(null);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedId) {
            toast.error("Invalid report id");
            return;
        }

        if (!selectedStatus) {
            toast.error("Please select a status");
            return;
        }

        try {
            setUpdatingStatus(true);

            const payload = {
                status: selectedStatus,
            };

            const response = await axios.patch(
                `${baseUrl}sales/analysis/edit/${selectedId}/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Status updated successfully");

            setSelectedReport((prev) =>
                prev
                    ? {
                        ...prev,
                        status: selectedStatus,
                    }
                    : prev
            );

            await fetchReport();
            toggleViewModal();
        } catch (error) {
            toast.error(
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                "Failed to update status"
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <ToastContainer />
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="View Daily Sales Report"
                />

                <Row>
                    <Col lg="12">
                        <Card>
                            <CardBody>
                                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                    <CardTitle className="h4 mb-0">
                                        DAILY SALES REPORT - FAMILY WISE
                                    </CardTitle>

                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#fff3cd",
                                                    border: "1px solid #d6c37a",
                                                    borderRadius: "2px",
                                                    marginRight: "6px",
                                                }}
                                            />
                                            <span>Active</span>
                                        </div>

                                        <div className="d-flex align-items-center">
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: "14px",
                                                    height: "14px",
                                                    backgroundColor: "#d4edda",
                                                    border: "1px solid #9fcca9",
                                                    borderRadius: "2px",
                                                    marginRight: "6px",
                                                }}
                                            />
                                            <span>Productive</span>
                                        </div>
                                    </div>
                                </div>

                                {loadingUser || loadingReport ? (
                                    <div className="text-center my-5">
                                        <Spinner color="primary" />
                                        <p className="mt-2 mb-0">Loading report...</p>
                                    </div>
                                ) : data.length === 0 ? (
                                    <div className="text-center my-4">
                                        <p className="mb-0">No report data found</p>
                                    </div>
                                ) : (
                                    <>
                                        <Row className="mb-3">
                                            <Col md="2">
                                                <strong>Total:</strong> {summary?.count || 0}
                                            </Col>
                                            <Col md="2">
                                                <strong>Active:</strong> {summary?.active_count || 0}
                                            </Col>
                                            <Col md="2">
                                                <strong>Productive:</strong>{" "}
                                                {summary?.productive_count || 0}
                                            </Col>
                                            <Col md="2">
                                                <strong>DSR Created:</strong>{" "}
                                                {summary?.dsr_created_count || 0}
                                            </Col>
                                            <Col md="2">
                                                <strong>DSR Approved:</strong>{" "}
                                                {summary?.dsr_approved_count || 0}
                                            </Col>
                                            <Col md="2">
                                                <strong>DSR Confirmed:</strong>{" "}
                                                {summary?.dsr_confirmed_count || 0}
                                            </Col>
                                        </Row>

                                        <Table bordered responsive hover className="align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Customer Name</th>
                                                    <th>Call Duration</th>
                                                    <th>Invoice No</th>
                                                    <th>Invoice Amount</th>
                                                    <th>State</th>
                                                    <th>District</th>
                                                    <th>Status</th>
                                                    <th>Created By</th>
                                                    <th>Created At</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((item, index) => {
                                                    const cellStyle = getCellStyle(item.call_status);

                                                    return (
                                                        <tr key={item.id || index}>
                                                            <td style={cellStyle}>{index + 1}</td>
                                                            <td style={cellStyle}>
                                                                {item.customer_name || item.customer || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.call_duration || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.invoice_number || item.invoice || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.invoice_amount || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.state_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.district_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.status || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {item.created_by_name || "-"}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                {formatDateTime(item.created_at)}
                                                            </td>
                                                            <td style={cellStyle}>
                                                                <Button
                                                                    color="primary"
                                                                    size="sm"
                                                                    onClick={() => handleView(item.id)}
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    </>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                <Modal isOpen={viewModal} toggle={toggleViewModal} size="lg" centered>
                    <ModalHeader toggle={toggleViewModal}>
                        View Sales Report Details
                    </ModalHeader>

                    <ModalBody>
                        {loadingDetails ? (
                            <div className="text-center my-4">
                                <Spinner color="primary" />
                                <p className="mt-2 mb-0">Loading details...</p>
                            </div>
                        ) : selectedReport ? (
                            <Row>
                                <Col md="6" className="mb-3">
                                    <strong>Customer Name:</strong>{" "}
                                    {selectedReport.customer_name ||
                                        selectedReport.customer ||
                                        "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Call Duration:</strong>{" "}
                                    {selectedReport.call_duration || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Invoice No:</strong>{" "}
                                    {selectedReport.invoice_number ||
                                        selectedReport.invoice ||
                                        "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Invoice Amount:</strong>{" "}
                                    {selectedReport.invoice_amount || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>State:</strong> {selectedReport.state_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>District:</strong>{" "}
                                    {selectedReport.district_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Created By:</strong>{" "}
                                    {selectedReport.created_by_name || "-"}
                                </Col>

                                <Col md="6" className="mb-3">
                                    <strong>Created At:</strong>{" "}
                                    {formatDateTime(selectedReport.created_at)}
                                </Col>

                                <Col md="12" className="mb-3">
                                    <strong>Note:</strong> {selectedReport.note || "-"}
                                </Col>

                                <Col md="12" className="mb-3">
                                    <FormGroup>
                                        <Label for="statusSelect">
                                            <strong>Status</strong>
                                        </Label>
                                        <Input
                                            id="statusSelect"
                                            type="select"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Select status</option>
                                            <option value="dsr created">DSR Created</option>
                                            <option value="dsr approved">DSR Approved</option>
                                            <option value="dsr confirmed">DSR Confirmed</option>
                                            <option value="dsr rejected">DSR Rejected</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                            </Row>
                        ) : (
                            <div className="text-center my-4">
                                <p className="mb-0">No details found</p>
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button color="secondary" onClick={toggleViewModal}>
                            Close
                        </Button>

                        <Button
                            color="success"
                            onClick={handleStatusUpdate}
                            disabled={updatingStatus || loadingDetails || !selectedReport}
                        >
                            {updatingStatus ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Updating...
                                </>
                            ) : (
                                "Update Status"
                            )}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </React.Fragment>
    );
};

export default ViewDailySalesReport;