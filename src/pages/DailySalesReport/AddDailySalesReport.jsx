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

const AddDailySalesReport = () => {
    const [stateList, setStateList] = useState([]);
    const [districtList, setDistrictList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState([]);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const fetchStates = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}states/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setStateList(response?.data?.data);
        } catch (error) {
            toast.error("Failed to load States");
        }
    };

    const fetchDistrict = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}districts/add/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDistrictList(response?.data?.data);
        } catch (error) {
            toast.error("Failed to load Districts");
        }
    };

    const fetchInvoice = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}my/orders/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInvoiceList(response.data || []);
        } catch (error) {
            toast.error("Failed to load Orders");
        }
    };

    useEffect(() => {
        fetchStates();
        fetchDistrict();
        fetchInvoice();
    }, []);

    // Convert API state list into react-select format
    const stateOptions = stateList.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const filteredDistricts = selectedState
        ? districtList.filter((dist) => dist.state === selectedState.value)
        : [];

    // District Options
    const districtOptions = filteredDistricts.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const invoiceOptions = invoiceList.map((item) => ({
        value: item.id,
        label: item.invoice,
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

        if (!selectedInvoice || selectedInvoice.length === 0) {
            toast.error("Please select at least one Invoice");
            return;
        }

        try {
            setLoading(true);

            // create payload list for each invoice
            const payloadList = selectedInvoice.map((inv) => ({
                state: selectedState.value,
                district: selectedDistrict.value,
                invoice: inv.value,
                // count: 1, // optional, you can change
            }));

            // send all invoices one by one
            await Promise.all(
                payloadList.map((payload) =>
                    axios.post(
                        `${import.meta.env.VITE_APP_KEY}daily/sales/report/add/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    )
                )
            );

            toast.success("Daily Sales Report Added Successfully!");

            // reset form
            setSelectedState(null);
            setSelectedDistrict(null);
            setSelectedInvoice([]);

        } catch (error) {

            const backendMessage =
                error?.response?.data?.errors?.invoice?.[0] ||
                error?.response?.data?.message ||
                "Failed to submit Daily Sales Report";

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
                                        {/* STATE */}
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <Label>State</Label>
                                                <Select
                                                    options={stateOptions}
                                                    value={selectedState}
                                                    onChange={(selectedOption) => {
                                                        setSelectedState(selectedOption);
                                                        setSelectedDistrict(null); // Reset district when state changes
                                                    }}
                                                    placeholder="Select State"
                                                    isClearable
                                                />
                                            </div>
                                        </Col>

                                        {/* DISTRICT */}
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
                                                    isDisabled={!selectedState} // disable until state selected
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <div className="mb-3">
                                                <Label>Invoices</Label>
                                                <Select
                                                    options={invoiceOptions}
                                                    value={selectedInvoice}
                                                    onChange={(selectedOptions) => setSelectedInvoice(selectedOptions)}
                                                    placeholder="Select Invoices"
                                                    isClearable
                                                    isMulti
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    <Button color="primary" type="submit" disabled={loading}>
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

export default AddDailySalesReport;
