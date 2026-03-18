import React, { useState, useEffect } from "react";
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
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const AddDSR = () => {
    const token = localStorage.getItem("token");

    const [customerList, setCustomerList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    // ✅ SINGLE TIME FIELD
    const [callDuration, setCallDuration] = useState("00:00:00");

    const [note, setNote] = useState("");

    const [callStatus, setCallStatus] = useState({
        value: "active",
        label: "Active",
    });

    const [customerNameManual, setCustomerNameManual] = useState("");

    const [loading, setLoading] = useState(false);

    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

    const callStatusOptions = [
        { value: "active", label: "Active" },
        { value: "productive", label: "Productive" },
    ];

    // ---------------- FETCH ----------------
    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}staff/customers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCustomerList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load Customers");
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await axios.get(`${BASE_URL}my/orders/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoiceList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load Invoices");
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
            setDistrictList(res?.data?.data || res?.data || []);
        } catch {
            toast.error("Failed to load Districts");
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchInvoices();
        fetchStates();
        fetchDistricts();
    }, []);

    // ---------------- OPTIONS ----------------
    const customerOptions = customerList.map(item => ({
        value: item?.id,
        label: item?.name,
    }));

    const invoiceOptions = invoiceList.map(item => ({
        value: item?.id,
        label: item?.invoice || `Invoice #${item?.id}`,
    }));

    const stateOptionsMapped = stateList.map(item => ({
        value: item?.id,
        label: item?.name,
    }));

    const districtOptions = districtList
        .filter(d => d?.state === selectedState?.value)
        .map(item => ({
            value: item?.id,
            label: item?.name,
        }));

    // ---------------- SUBMIT ----------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedState) return toast.error("Select State");
        if (!selectedDistrict) return toast.error("Select District");

        if (callDuration === "00:00:00") {
            return toast.error("Call Duration cannot be zero");
        }

        if (callStatus.value === "active" && !selectedCustomer) {
            return toast.error("Select Customer");
        }

        if (callStatus.value === "productive" && !customerNameManual) {
            return toast.error("Enter Customer Name");
        }

        try {
            setLoading(true);

            // ✅ ensure HH:MM:SS format
            const formattedDuration =
                callDuration.length === 5
                    ? `${callDuration}:00`
                    : callDuration;

            const payload = {
                call_duration: formattedDuration,
                call_status: callStatus.value,
                note,
                state: selectedState.value,
                district: selectedDistrict.value,

                ...(callStatus.value === "active" && {
                    customer: selectedCustomer?.value,
                    customer_name: selectedCustomer?.label,
                    invoice: selectedInvoice?.value || null,
                }),

                ...(callStatus.value === "productive" && {
                    customer_name: customerNameManual,
                }),

                status: "dsr created",
            };

            console.log("FINAL PAYLOAD:", payload);

            await axios.post(
                `${BASE_URL}sales/analysis/add/`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            toast.success("Sales Analysis Added Successfully");

            // RESET
            setSelectedCustomer(null);
            setSelectedInvoice(null);
            setSelectedState(null);
            setSelectedDistrict(null);
            setCallDuration("00:00:00");
            setNote("");
            setCustomerNameManual("");
            setCallStatus({ value: "active", label: "Active" });

        } catch (error) {
            console.log("ERROR:", error?.response?.data);

            toast.error(
                error?.response?.data?.message ||
                JSON.stringify(error?.response?.data) ||
                "Failed to submit"
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------- UI ----------------
    return (
        <>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs title="Daily Sales Report" breadcrumbItem="Add Daily Sales Report" />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    ADD DAILY SALES REPORT
                                </CardTitle>

                                <Form onSubmit={handleSubmit}>
                                    <Row className="g-4">

                                        {/* ROW 1 */}
                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Label>Call Duration</Label>
                                                <input
                                                    type="time"
                                                    step="1"
                                                    className="form-control"
                                                    value={callDuration}
                                                    onChange={(e) =>
                                                        setCallDuration(e.target.value)
                                                    }
                                                />
                                            </Col>

                                            <Col md={4}>
                                                <Label>Call Status</Label>
                                                <Select
                                                    options={callStatusOptions}
                                                    value={callStatus}
                                                    onChange={setCallStatus}
                                                />
                                            </Col>

                                            {callStatus.value === "productive" ? (
                                                <Col md={4}>
                                                    <Label>Customer Name</Label>
                                                    <input
                                                        className="form-control"
                                                        value={customerNameManual}
                                                        onChange={(e) =>
                                                            setCustomerNameManual(e.target.value)
                                                        }
                                                    />
                                                </Col>
                                            ) : (
                                                <Col md={4}>
                                                    <Label>Customer</Label>
                                                    <Select
                                                        options={customerOptions}
                                                        value={selectedCustomer}
                                                        onChange={setSelectedCustomer}
                                                    />
                                                </Col>
                                            )}
                                        </Row>

                                        {/* ROW 2 */}
                                        <Row className="mb-3">
                                            {callStatus.value !== "productive" && (
                                                <Col md={4}>
                                                    <Label>Invoice</Label>
                                                    <Select
                                                        options={invoiceOptions}
                                                        value={selectedInvoice}
                                                        onChange={setSelectedInvoice}
                                                        isClearable
                                                    />
                                                </Col>
                                            )}

                                            <Col md={4}>
                                                <Label>State</Label>
                                                <Select
                                                    options={stateOptionsMapped}
                                                    value={selectedState}
                                                    onChange={(val) => {
                                                        setSelectedState(val);
                                                        setSelectedDistrict(null);
                                                    }}
                                                />
                                            </Col>

                                            <Col md={4}>
                                                <Label>District</Label>
                                                <Select
                                                    options={districtOptions}
                                                    value={selectedDistrict}
                                                    onChange={setSelectedDistrict}
                                                    isDisabled={!selectedState}
                                                />
                                            </Col>
                                        </Row>

                                        {/* ROW 3 */}
                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Label>Note</Label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={note}
                                                    onChange={(e) =>
                                                        setNote(e.target.value)
                                                    }
                                                />
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12} className="mt-2">
                                                <Button color="primary" disabled={loading}>
                                                    {loading ? "Saving..." : "Submit"}
                                                </Button>
                                            </Col>
                                        </Row>

                                    </Row>
                                </Form>

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
};

export default AddDSR;