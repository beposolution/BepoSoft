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
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    Label,
    Input,
    CardTitle,
} from "reactstrap";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const ViewDailySalesReport = () => {
    const [orderList, setOrderList] = useState([]);
    const token = localStorage.getItem("token");
    const [role, setRole] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [districtList, setDistrictList] = useState([]);
    const [invoiceList, setInvoiceList] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    useEffect(() => {
        const roleValue = localStorage.getItem("active");
        setRole(roleValue);
    }, []);


    const fetchDistricts = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}districts/add/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDistrictList(response?.data?.data || []);
        } catch (error) {
            toast.error("Failed to load Districts");
        }
    };


    const fetchInvoices = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}my/orders/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setInvoiceList(response?.data || []);
        } catch (error) {
            toast.error("Failed to load Orders");
        }
    };


    const fetchOrders = async () => {
        try {
            let apiUrl = "";

            if (
                role === "ADMIN" ||
                role === "Accounts / Accounting" ||
                role === "CEO" ||
                role === "COO"
            ) {
                apiUrl = `${import.meta.env.VITE_APP_KEY}daily/sales/report/all/`;
            } else {
                apiUrl = `${import.meta.env.VITE_APP_KEY}daily/sales/report/add/`;
            }

            const response = await axios.get(apiUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setOrderList(response?.data?.data || []);
        } catch (error) {
            toast.error("Failed to load Orders");
        }
    };

    useEffect(() => {
        if (role) {
            fetchOrders();
            fetchDistricts();
            fetchInvoices();
        }
    }, [role]);


    const fetchSingleReport = async (id) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}daily/sales/report/update/${id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const reportData = response?.data?.data;
            setSelectedReport(reportData);

            // Set existing district & invoice as selected
            setSelectedDistrict({
                value: reportData?.district,
                label: reportData?.district_name,
            });

            setSelectedInvoice({
                value: reportData?.invoice,
                label: reportData?.invoice_no,
            });

            setModalOpen(true);
        } catch (error) {
            toast.error("Failed to load report details");
        }
    };


    const filteredDistricts = selectedReport?.state
        ? districtList.filter((dist) => dist.state === selectedReport.state)
        : [];

    const districtOptions = filteredDistricts.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const invoiceOptions = invoiceList.map((item) => ({
        value: item.id,
        label: item.invoice,
    }));


    const updateReport = async () => {
        try {
            if (!selectedReport?.id) {
                toast.error("Invalid report selected");
                return;
            }

            if (!selectedDistrict) {
                toast.error("Please select a District");
                return;
            }

            if (!selectedInvoice) {
                toast.error("Please select an Invoice");
                return;
            }

            const payload = {
                district: selectedDistrict.value,
                invoice: selectedInvoice.value,
            };

            await axios.put(
                `${import.meta.env.VITE_APP_KEY}daily/sales/report/update/${selectedReport.id}/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Report Updated Successfully");

            fetchOrders();

            await createDataLog("Daily Sales Report Updated", selectedReport.id);

            setModalOpen(false);
        } catch (error) {
            toast.error("Failed to update report");
        }
    };


    const createDataLog = async (action, reportId) => {
        try {
            const payload = {
                action: action,
                report_id: reportId,
                module: "DailySalesReport",
            };

            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

        } catch (error) {
            console.log("Datalog error:", error);
        }
    };

    const customSelectStyles = {
        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
        menu: (base) => ({ ...base, zIndex: 99999 }),
    };

    const deleteReport = async () => {
        try {
            if (!selectedReport?.id) {
                toast.error("Invalid report selected");
                return;
            }

            const confirmDelete = window.confirm(
                "Are you sure you want to delete this Daily Sales Report?"
            );

            if (!confirmDelete) return;

            await axios.delete(
                `${import.meta.env.VITE_APP_KEY}daily/sales/report/update/${selectedReport.id}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Report Deleted Successfully");

            fetchOrders();

            await createDataLog("Daily Sales Report Deleted", selectedReport.id);

            setModalOpen(false);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("You can only delete your own report");
            } else {
                toast.error("Failed to delete report");
            }
        }
    };

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <Breadcrumbs
                    title="Daily Sales Report"
                    breadcrumbItem="View Daily Sales Report"
                />

                <Row>
                    <Col lg="12">
                        <Card>
                            <CardBody>
                                <CardTitle className="h4 mb-4">
                                    Daily Sales Report List
                                </CardTitle>

                                <Table bordered responsive>
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>User</th>
                                            <th>State</th>
                                            <th>District</th>
                                            <th>Invoice No</th>
                                            <th>Created</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {orderList.length > 0 ? (
                                            orderList.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{item.user_name}</td>
                                                    <td>{item.state_name}</td>
                                                    <td>{item.district_name}</td>
                                                    <td>{item.invoice_no}</td>
                                                    <td>{new Date(item.created_at).toLocaleString()}</td>
                                                    <td>
                                                        <Button
                                                            color="primary"
                                                            size="sm"
                                                            onClick={() => fetchSingleReport(item.id)}
                                                        >
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center">
                                                    No Data Found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>

            {/* MODAL */}
            <Modal
                isOpen={modalOpen}
                toggle={() => setModalOpen(!modalOpen)}
                centered
            >
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    Daily Sales Report Details
                </ModalHeader>

                <ModalBody>
                    {selectedReport && (
                        <Form>
                            <div className="mb-3">
                                <Label>User</Label>
                                <Input value={selectedReport.user_name || ""} disabled />
                            </div>

                            <div className="mb-3">
                                <Label>State</Label>
                                <Input value={selectedReport.state_name || ""} disabled />
                            </div>

                            {/* DISTRICT EDIT */}
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
                                    menuPortalTarget={document.body}
                                    styles={customSelectStyles}
                                />
                            </div>

                            {/* INVOICE EDIT */}
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
                                    menuPortalTarget={document.body}
                                    styles={customSelectStyles}
                                />
                            </div>
                        </Form>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button color="success" onClick={updateReport}>
                        Update
                    </Button>
                    <Button color="secondary" onClick={() => setModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={deleteReport}>
                        Delete
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default ViewDailySalesReport;
