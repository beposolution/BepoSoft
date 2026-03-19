import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from "react-select";
import {
    Card,
    CardBody,
    Col,
    Row,
    CardTitle,
    Table,
    Spinner,
    Button,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";

const ViewDSR = () => {
    const [summary, setSummary] = useState(null);
    const [dsrList, setDsrList] = useState([]);
    const [loading, setLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [callStatus, setCallStatus] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [state, setState] = useState("");
    const [district, setDistrict] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [stateList, setStateList] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({
        customer_id: "",
        call_status: "",
        invoice: ""
    });

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

    const fetchDSR = async () => {
        try {
            setLoading(true);

            const selectedStateName =
                stateList.find((s) => String(s.id) === String(state))?.name || "";

            const selectedDistrictName =
                districtList.find((d) => String(d.id) === String(district))?.name || "";

            const response = await axios.get(
                `${BASE_URL}sales/analysis/add/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        search,
                        call_status: callStatus,
                        status: statusFilter,
                        state: selectedStateName,
                        district: selectedDistrictName,
                        start_date: startDate,
                        end_date: endDate,
                    },
                }
            );





            const summaryData = response?.data?.results || null;
            const data = response?.data?.results?.results || [];

            setSummary(summaryData);   
            setDsrList(data);

        } catch (error) {
            toast.error("Failed to load DSR data");
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async () => {
        try {
            const res = await axios.get(`${BASE_URL}states/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStateList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load States");
        }
    };

    const fetchDistricts = async () => {
        try {
            const res = await axios.get(`${BASE_URL}districts/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = res?.data?.data || res?.data || [];
            setAllDistricts(data);
        } catch {
            toast.error("Failed to load Districts");
        }
    };
    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}staff/customers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCustomerList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load customers");
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${BASE_URL}my/orders/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoiceList(res?.data?.results || res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load invoices");
        }
    };

    useEffect(() => {
        fetchDSR();
        fetchStates();
        fetchDistricts();
        fetchCustomers();
        fetchInvoices();
    }, []);

    const handleView = async (item) => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${BASE_URL}sales/analysis/edit/${item.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response?.data?.data || response?.data;

            setSelectedItem(data);

            setEditMode(false);
            setEditData({
                customer_id: data.customer_id,  
                call_status: data.call_status || "",
                invoice: data.invoice || ""
            });

            setModalOpen(true);

        } catch {
            toast.error("Failed to load detail");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;

        try {
            await axios.delete(
                `${BASE_URL}sales/analysis/edit/${selectedItem.id}/`, 
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast.success("Deleted successfully");

            setModalOpen(false);
            setSelectedItem(null);   
            fetchDSR();

        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleUpdate = async () => {
        try {


            const selectedInvoice = invoiceList.find(
                i => i.invoice === editData.invoice
            );

            await axios.put(
                `${BASE_URL}sales/analysis/edit/${selectedItem.id}/`,
                {
                    customer: Number(editData.customer_id),
                    call_status: editData.call_status,
                    invoice: invoiceList.find(i => i.invoice === editData.invoice)?.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSelectedItem((prev) => ({
                ...prev,
                customer_name: customerList.find(c => String(c.id) === String(editData.customer_id))?.name || "-",
                call_status: editData.call_status,
                invoice_number: editData.invoice
            }));

            toast.success("Updated successfully");
            setEditMode(false);
            fetchDSR();

        } catch (error) {
            toast.error("Update failed");
        }
    };
    const stateOptions = stateList.map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const districtOptions = districtList.map((d) => ({
        value: d.id,
        label: d.name,
    }));

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <Breadcrumbs title="Daily Sales Report" breadcrumbItem="DSR List" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>

                                {/* FILTER BAR */}
                                <div className="mb-4">
                                    <Row className="align-items-center g-2">

                                        <Col md={3}>
                                            <Input placeholder="Search..." value={search}
                                                onChange={(e) => setSearch(e.target.value)} />
                                        </Col>

                                        <Col md={2}>
                                            <Input type="select" value={callStatus}
                                                onChange={(e) => setCallStatus(e.target.value)}>
                                                <option value="">Call Status</option>
                                                <option value="productive">Productive</option>
                                                <option value="active">Active</option>
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <Input type="select" value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}>
                                                <option value="">DSR Status</option>
                                                <option value="dsr created">DSR Created</option>
                                                <option value="dsr approved">DSR Approved</option>
                                                <option value="dsr confirmed">DSR Confirmed</option>
                                                <option value="dsr rejected">DSR Rejected</option>
                                            </Input>
                                        </Col>

                                        <Col md={2}>
                                            <Select
                                                options={stateOptions}
                                                value={stateOptions.find((s) => s.value === state) || null}
                                                onChange={(selected) => {
                                                    const val = selected?.value || "";
                                                    setState(val);
                                                    setDistrict("");

                                                    const filtered = allDistricts.filter(
                                                        (d) => String(d.state) === String(val)
                                                    );
                                                    setDistrictList(filtered);
                                                }}
                                                placeholder="Search State..."
                                                isClearable
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Select
                                                options={districtOptions}
                                                value={districtOptions.find((d) => d.value === district) || null}
                                                onChange={(selected) => setDistrict(selected?.value || "")}
                                                placeholder="Search District..."
                                                isClearable
                                                isDisabled={!state}
                                            />
                                        </Col>

                                        <Col md={2}>
                                            <Input type="date" value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)} />
                                        </Col>

                                        <Col md={2}>
                                            <Input type="date" value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)} />
                                        </Col>

                                        <Col md={2}>
                                            <Button color="success" onClick={fetchDSR} block>Apply</Button>
                                        </Col>

                                        <Col md={2}>
                                            <Button color="secondary" block
                                                onClick={() => {
                                                    setSearch("");
                                                    setCallStatus("");
                                                    setStatusFilter("");
                                                    setState("");
                                                    setDistrict("");
                                                    setStartDate("");
                                                    setEndDate("");
                                                    setTimeout(fetchDSR, 0);
                                                }}>
                                                Reset
                                            </Button>
                                        </Col>

                                    </Row>
                                </div>

                                {summary && (
                                    <Row className="mb-4">

                                        {/* Active */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#f4e7c5",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#8a6d1d"
                                            }}>
                                                <div>Active</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.active_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Productive */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#d7efe1",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#1f6f4a"
                                            }}>
                                                <div>Productive</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.productive_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Created */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#dce9f7",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#1f4e8c"
                                            }}>
                                                <div>DSR Created</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.dsr_created_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Approved */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#e2f4e8",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#2e7d32"
                                            }}>
                                                <div>DSR Approved</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.dsr_approved_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Confirmed */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#ece3f7",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#5e3ea1"
                                            }}>
                                                <div>DSR Confirmed</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.dsr_confirmed_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Rejected */}
                                        <Col md={2}>
                                            <div style={{
                                                background: "#f8d7da",
                                                padding: 15,
                                                borderRadius: 12,
                                                color: "#842029"
                                            }}>
                                                <div>DSR Rejected</div>
                                                <div style={{ fontSize: 22, fontWeight: "bold" }}>
                                                    {summary.dsr_rejected_count || 0}
                                                </div>
                                            </div>
                                        </Col>

                                    </Row>
                                )}

                                {/* TABLE */}
                                <div className="table-responsive">
                                    <Table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Customer</th>
                                                <th>Status</th>
                                                <th>DSR Status</th>
                                                <th>Duration</th>
                                                <th>State</th>
                                                <th>District</th>
                                                <th>Invoice</th>
                                                <th>Note</th>
                                                <th>Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {dsrList.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.customer_name}</td>

                                                    <td>
                                                        <span
                                                            style={{
                                                                backgroundColor: item.call_status === "productive" ? "#d7efe1" : "#f4e7c5",
                                                                color: item.call_status === "productive" ? "#1f6f4a" : "#8a6d1d",
                                                                padding: "6px 14px",
                                                                borderRadius: "20px",
                                                                fontSize: "13px",
                                                                fontWeight: "600",
                                                                display: "inline-block"
                                                            }}
                                                        >
                                                            {item.call_status}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            style={{
                                                                backgroundColor:
                                                                    item.status === "dsr confirmed" ? "#ece3f7" :
                                                                        item.status === "dsr rejected" ? "#f8d7da" :
                                                                            item.status === "dsr created" ? "#dce9f7" :
                                                                                "#e2f4e8",
                                                                color:
                                                                    item.status === "dsr confirmed" ? "#5e3ea1" :
                                                                        item.status === "dsr rejected" ? "#842029" :
                                                                            item.status === "dsr created" ? "#1f4e8c" :
                                                                                "#2e7d32",
                                                                padding: "6px 14px",
                                                                borderRadius: "20px",
                                                                fontSize: "13px",
                                                                fontWeight: "600",
                                                                display: "inline-block"
                                                            }}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </td>

                                                    <td>{item.call_duration}</td>
                                                    <td>{item.state_name}</td>
                                                    <td>{item.district_name}</td>
                                                    <td>{item.invoice_number}</td>
                                                    <td>{item.note}</td>
                                                    <td>{new Date(item.created_at).toLocaleDateString()}</td>

                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            color="primary"
                                                            onClick={() => handleView(item)}
                                                        >
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>

                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {selectedItem && (
                    <Modal
                        isOpen={modalOpen}
                        toggle={() => setModalOpen(!modalOpen)}
                        size="lg"
                        centered   
                    >
                        <ModalHeader toggle={() => setModalOpen(false)}>
                            <span className="fw-bold">DSR Details</span>
                        </ModalHeader>

                        <div className="px-3">

                            <Row className="gy-4">

                                {/* Customer */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                            Customer
                                        </div>

                                        {editMode && editData.call_status === "productive" ? (
                                            <Input
                                                type="select"
                                                value={editData.customer_id}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        customer_id: e.target.value
                                                    })
                                                }
                                            >
                                                <option value="">Select Customer</option>
                                                {customerList.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        ) : (
                                            <div className="fw-semibold" style={{ fontSize: "16px" }}>
                                                {selectedItem?.customer_name || "-"}
                                            </div>
                                        )}
                                    </div>
                                </Col>

                                {/* Call Status */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1" style={{ fontSize: "13px" }}>
                                            Call Status
                                        </div>

                                        {editMode ? (
                                            <Input
                                                type="select"
                                                value={editData.call_status}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    setEditData({
                                                        ...editData,
                                                        call_status: value,
                                                        customer_id: value === "active" ? "" : editData.customer_id
                                                    });
                                                }}
                                            >
                                                <option value="active">Active</option>
                                                <option value="productive">Productive</option>
                                            </Input>
                                        ) : (
                                            <div>
                                                <span
                                                    className={`badge px-3 py-2 fs-6 ${selectedItem?.call_status === "productive"
                                                        ? "bg-success"
                                                        : "bg-warning"
                                                        }`}
                                                >
                                                    {selectedItem?.call_status}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                                {/* DSR Status */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1" style={{ fontSize: "13px" }}>DSR Status</div>

                                        <span className={`badge px-3 py-2 fs-6 ${selectedItem.status === "dsr confirmed"
                                            ? "bg-success"
                                            : selectedItem.status === "dsr rejected"
                                                ? "bg-danger"
                                                : selectedItem.status === "dsr created"
                                                    ? "bg-primary"
                                                    : "bg-warning"
                                            }`}>
                                            {selectedItem.status}
                                        </span>
                                    </div>
                                </Col>

                                {/* Duration */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1" style={{ fontSize: "13px" }}>Duration</div>
                                        <div className="fw-semibold fs-5">
                                            {selectedItem.call_duration || "-"}
                                        </div>
                                    </div>
                                </Col>

                                {/* State */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1">State</div>
                                        <div className="fw-semibold fs-5">
                                            {selectedItem.state_name || "-"}
                                        </div>
                                    </div>
                                </Col>

                                {/* District */}
                                <Col md={6}>
                                    <div>
                                        <div className="text-muted mb-1">District</div>
                                        <div className="fw-semibold fs-5">
                                            {selectedItem.district_name || "-"}
                                        </div>
                                    </div>
                                </Col>

                                {/* Invoice */}
                                {(editMode
                                    ? editData.call_status === "productive"
                                    : selectedItem?.call_status === "productive") && (
                                        <Col md={6}>
                                            <div>
                                                <div className="text-muted mb-1">Invoice</div>

                                                {editMode ? (
                                                    <Input
                                                        type="select"
                                                        value={editData.invoice}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                invoice: e.target.value
                                                            })
                                                        }
                                                    >
                                                        <option value="">Select Invoice</option>
                                                        {invoiceList.map((inv) => (
                                                            <option key={inv.id} value={inv.invoice}>
                                                                {inv.invoice}
                                                            </option>
                                                        ))}
                                                    </Input>
                                                ) : (
                                                    <div className="fw-semibold fs-5">
                                                        {selectedItem?.invoice_number || "-"}
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    )}

                                {/* Note */}
                                <Col md={12}>
                                    <div>
                                        <div className="text-muted mb-1">Note</div>
                                        <div className="fw-semibold fs-5">
                                            {selectedItem.note || "-"}
                                        </div>
                                    </div>
                                </Col>

                            </Row>
                        </div>
                        <ModalFooter className="d-flex justify-content-between">

                            {/* ✅ Hide delete in edit mode */}
                            {!editMode && (
                                <div>
                                    <Button color="danger" onClick={handleDelete}>
                                        Delete
                                    </Button>
                                </div>

                            )}

                            <div>
                                {selectedItem?.status === "dsr created" &&
                                    selectedItem?.call_status !== "productive" && (
                                        editMode ? (
                                            <>
                                                <Button color="success" onClick={handleUpdate}>
                                                    Save
                                                </Button>{" "}
                                                <Button color="secondary" onClick={() => setEditMode(false)}>
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <Button color="primary" onClick={() => setEditMode(true)}>
                                                Edit
                                            </Button>
                                        )
                                    )}
                            </div>

                        </ModalFooter>
                    </Modal>

                )}



            </div>
        </React.Fragment>
    );
};

export default ViewDSR;