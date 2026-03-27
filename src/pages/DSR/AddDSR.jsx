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
    const [customerList, setCustomerList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    const [callDuration, setCallDuration] = useState("00:00:00");
    const [note, setNote] = useState("");
    const [customerNameManual, setCustomerNameManual] = useState("");
    const [loading, setLoading] = useState(false);

    const [callStatus, setCallStatus] = useState({
        value: "active",
        label: "Active",
    });

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY || "/api/";

    const callStatusOptions = [
        { value: "active", label: "Active" },
        { value: "productive", label: "Productive" },
    ];

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${BASE_URL}staff/customers/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCustomerList(response?.data?.data || response?.data || []);
        } catch (error) {
            toast.error("Failed to load Customers");
        }
    };

    const fetchInvoices = async () => {
        try {
            const response = await axios.get(`${BASE_URL}my/orders/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInvoiceList(response?.data?.data || response?.data || []);
        } catch (error) {
            toast.error("Failed to load Invoices");
        }
    };
const fetchStates = async () => {
    try {
        const profileRes = await axios.get(`${BASE_URL}profile/`, {
            headers: { Authorization: `Bearer ${token}` },
        });


        const allocatedStateIds =
            profileRes?.data?.data?.allocated_states || [];


        const stateRes = await axios.get(`${BASE_URL}states/`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const allStates =
            stateRes?.data?.data || stateRes?.data || [];


        const normalizedIds = allocatedStateIds.map((id) =>
            Number(id)
        );

        const filteredStates = allStates.filter((state) =>
            normalizedIds.includes(Number(state.id))
        );


        setStateList(filteredStates);

    } catch (error) {
        toast.error("Failed to load States");
    }
};


    const fetchDistricts = async () => {
        try {
            const response = await axios.get(`${BASE_URL}districts/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDistrictList(response?.data?.data || response?.data || []);
        } catch (error) {
            toast.error("Failed to load Districts");
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchInvoices();
        fetchStates();
        fetchDistricts();
    }, []);

    const customerOptions = customerList.map((item) => ({
        value: item?.id,
        label: item?.name,
    }));

    const invoiceOptions = invoiceList.map((item) => ({
        value: item?.id,
        label: item?.invoice || `Invoice #${item?.id}`,
    }));

    const stateOptions = stateList.map((item) => ({
        value: item?.id,
        label: item?.name,
    }));

    const filteredDistricts = selectedState
        ? districtList.filter((dist) => dist?.state === selectedState.value)
        : [];

    const districtOptions = filteredDistricts.map((item) => ({
        value: item?.id,
        label: item?.name,
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedState) {
            toast.error("Please select a State");
            return;
        }

        if (!selectedDistrict) {
            toast.error("Please select a District");
            return;
        }

        if (callDuration === "00:00:00") {
            toast.error("Call Duration cannot be zero");
            return;
        }

        if (callStatus.value === "active" && !customerNameManual.trim()) {
            toast.error("Please enter Customer Name");
            return;
        }

        if (callStatus.value === "productive" && !selectedCustomer) {
            toast.error("Please select a Customer");
            return;
        }

        try {
            setLoading(true);

            const formattedDuration =
                callDuration.length === 5 ? `${callDuration}:00` : callDuration;

            const payload = {
                call_duration: formattedDuration,
                call_status: callStatus.value,
                note,
                state: selectedState.value,
                district: selectedDistrict.value,
                status: "dsr created",

                ...(callStatus.value === "active" && {
                    customer_name: customerNameManual,
                }),

                ...(callStatus.value === "productive" && {
                    customer: selectedCustomer?.value,
                    customer_name: selectedCustomer?.label,
                    invoice: selectedInvoice?.value || null,
                }),
            };

            await axios.post(`${BASE_URL}sales/analysis/add/`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            toast.success("Sales Analysis Added Successfully");

            setSelectedCustomer(null);
            setSelectedInvoice(null);
            setSelectedState(null);
            setSelectedDistrict(null);
            setCallDuration("00:00:00");
            setNote("");
            setCustomerNameManual("");
            setCallStatus({
                value: "active",
                label: "Active",
            });
        } catch (error) {
            const backendMessage =
                error?.response?.data?.message ||
                JSON.stringify(error?.response?.data) ||
                "Failed to submit";

            toast.error(backendMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="Add Daily Sales Report"
                />

                <Row>
                    <Col lg={12}>
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    ADD DAILY SALES REPORT
                                </CardTitle>

                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
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
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>Call Status</Label>
                                                <Select
                                                    options={callStatusOptions}
                                                    value={callStatus}
                                                    onChange={(selectedOption) => {
                                                        setCallStatus(selectedOption);
                                                        setSelectedCustomer(null);
                                                        setSelectedInvoice(null);
                                                        setCustomerNameManual("");
                                                    }}
                                                    placeholder="Select Call Status"
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row>
                                        {callStatus.value === "active" ? (
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label>Customer Name</Label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={customerNameManual}
                                                        onChange={(e) =>
                                                            setCustomerNameManual(e.target.value)
                                                        }
                                                        placeholder="Enter Customer Name"
                                                    />
                                                </div>
                                            </Col>
                                        ) : (
                                            <>
                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>Customer</Label>
                                                        <Select
                                                            options={customerOptions}
                                                            value={selectedCustomer}
                                                            onChange={(selectedOption) =>
                                                                setSelectedCustomer(selectedOption)
                                                            }
                                                            placeholder="Select Customer"
                                                            isClearable
                                                        />
                                                    </div>
                                                </Col>

                                                <Col md={6}>
                                                    <div className="mb-3">
                                                        <Label>Invoice</Label>
                                                        <Select
                                                            options={invoiceOptions}
                                                            value={selectedInvoice}
                                                            onChange={(selectedOption) =>
                                                                setSelectedInvoice(selectedOption)
                                                            }
                                                            placeholder="Select Invoice"
                                                            isClearable
                                                        />
                                                    </div>
                                                </Col>
                                            </>
                                        )}
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>State</Label>
                                                <Select
                                                    options={stateOptions}
                                                    value={selectedState}
                                                    onChange={(selectedOption) => {
                                                        setSelectedState(selectedOption);
                                                        setSelectedDistrict(null);
                                                    }}
                                                    placeholder="Select State"
                                                    isClearable
                                                />
                                            </div>
                                        </Col>

                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>District</Label>
                                                <Select
                                                    options={districtOptions}
                                                    value={selectedDistrict}
                                                    onChange={(selectedOption) =>
                                                        setSelectedDistrict(selectedOption)
                                                    }
                                                    placeholder="Select District"
                                                    isClearable
                                                    isDisabled={!selectedState}
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={12}>
                                            <div className="mb-3">
                                                <Label>Note</Label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    placeholder="Enter Note"
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Button
                                        color="primary"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? "Saving..." : "Submit"}
                                    </Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </React.Fragment>
    );
};

export default AddDSR;