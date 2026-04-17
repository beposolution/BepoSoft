import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle,
    Table, Spinner, Button, Modal, ModalHeader, ModalBody, ModalFooter,
    Form, FormGroup, Label, Input
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const InternalTransferList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [currentTransfer, setCurrentTransfer] = useState(null);
    const [formData, setFormData] = useState({});
    const token = localStorage.getItem("token");

    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);

    const [senderBankOption, setSenderBankOption] = useState(null);
    const [receiverBankOption, setReceiverBankOption] = useState(null);

    const [filterSenderBank, setFilterSenderBank] = useState(null);
    const [filterReceiverBank, setFilterReceiverBank] = useState(null);
    const [filterCreatedBy, setFilterCreatedBy] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [staffSearch, setStaffSearch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const toggleModal = () => setModal(!modal);

    const bankOptions = banks.map((bank) => ({
        label: bank.name,
        value: bank.id
    }));

    const staffOptions = staffs.map((staff) => ({
        label: staff.name || staff.username,
        value: staff.id
    }));

    const fetchTransferData = useCallback(async (page = 1) => {
        try {
            setLoading(true);

            const params = {
                page: page
            };

            if (searchTerm) params.search = searchTerm;
            if (fromDate) params.start_date = fromDate;
            if (toDate) params.end_date = toDate;
            if (filterSenderBank?.value) params.sender_bank = filterSenderBank.value;
            if (filterReceiverBank?.value) params.receiver_bank = filterReceiverBank.value;
            if (filterCreatedBy?.value) params.created_by = filterCreatedBy.value;

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}internal/transfers/get/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            const responseData = response.data;

            setData(responseData?.results?.data || []);
            setTotalCount(responseData?.count || 0);
            setNextPageUrl(responseData?.next || null);
            setPreviousPageUrl(responseData?.previous || null);
            setCurrentPage(page);
        } catch (error) {
            toast.error("Error fetching transfer data");
            setData([]);
            setTotalCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
        } finally {
            setLoading(false);
        }
    }, [
        token,
        searchTerm,
        fromDate,
        toDate,
        filterSenderBank,
        filterReceiverBank,
        filterCreatedBy
    ]);

    const fetchBanks = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}banks/`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 200) {
                setBanks(response?.data?.data || []);
            }
        } catch (error) {
            toast.error("Error fetching banks");
        }
    };

    const fetchStaffs = async (search = "") => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}get/staffs/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: {
                        search: search
                    }
                }
            );

            const staffData =
                response?.data?.results?.data ||
                response?.data?.data ||
                response?.data?.results ||
                [];

            setStaffs(Array.isArray(staffData) ? staffData : []);
        } catch (error) {
            toast.error("Error fetching staffs");
        }
    };

    const handleViewClick = async (id) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}internal/transfers/${id}/`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            const detailData = response.data;
            setCurrentTransfer(detailData);
            setFormData(detailData);

            const sender = banks.find((bank) => bank.id === detailData.sender_bank);
            const receiver = banks.find((bank) => bank.id === detailData.receiver_bank);

            setSenderBankOption(sender ? { label: sender.name, value: sender.id } : null);
            setReceiverBankOption(receiver ? { label: receiver.name, value: receiver.id } : null);

            toggleModal();
        } catch (error) {
            toast.error("Error fetching transfer details");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}internal/transfers/${currentTransfer.id}/`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success("Transfer updated successfully");
            toggleModal();
            fetchTransferData(currentPage);
        } catch (error) {
            toast.error("Error updating transfer");
        }
    };

    useEffect(() => {
        fetchBanks();
        fetchStaffs();
    }, []);

    useEffect(() => {
        fetchTransferData(1);
    }, [fetchTransferData]);

    const handleSenderBankChange = (selected) => {
        setSenderBankOption(selected);
        setFormData((prev) => ({
            ...prev,
            sender_bank: selected ? selected.value : ""
        }));
    };

    const handleReceiverBankChange = (selected) => {
        setReceiverBankOption(selected);
        setFormData((prev) => ({
            ...prev,
            receiver_bank: selected ? selected.value : ""
        }));
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setStaffSearch("");
        setFromDate("");
        setToDate("");
        setFilterSenderBank(null);
        setFilterReceiverBank(null);
        setFilterCreatedBy(null);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="TRANSFER" breadcrumbItem="BANK TRANSFER DETAILS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">BANK TRANSFER DETAILS</CardTitle>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>Search Transfers</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Amount, Description, Transaction ID or Receipt"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Sender Bank</Label>
                                            <Select
                                                value={filterSenderBank}
                                                onChange={(selected) => {
                                                    setFilterSenderBank(selected);
                                                    setCurrentPage(1);
                                                }}
                                                options={bankOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Select Sender Bank"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Receiver Bank</Label>
                                            <Select
                                                value={filterReceiverBank}
                                                onChange={(selected) => {
                                                    setFilterReceiverBank(selected);
                                                    setCurrentPage(1);
                                                }}
                                                options={bankOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Select Receiver Bank"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Created By</Label>
                                            <Select
                                                value={filterCreatedBy}
                                                onChange={(selected) => {
                                                    setFilterCreatedBy(selected);
                                                    setCurrentPage(1);
                                                }}
                                                onInputChange={(inputValue, actionMeta) => {
                                                    if (actionMeta.action === "input-change") {
                                                        setStaffSearch(inputValue);
                                                        fetchStaffs(inputValue);
                                                    }
                                                }}
                                                options={staffOptions}
                                                isClearable
                                                isSearchable
                                                placeholder="Select Staff"
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>From Date</Label>
                                            <Input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => {
                                                    setFromDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>To Date</Label>
                                            <Input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => {
                                                    setToDate(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Col>

                                        <Col md={3} className="d-flex align-items-end">
                                            <Button color="primary" onClick={() => fetchTransferData(1)}>
                                                Apply Filters
                                            </Button>
                                        </Col>

                                        <Col md={3} className="d-flex align-items-end">
                                            <Button color="secondary" onClick={handleClearFilters}>
                                                Clear Filters
                                            </Button>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <div className="text-center">
                                            <Spinner color="primary" />
                                        </div>
                                    ) : (
                                        <>
                                            <Table className="table-bordered">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Payment Receipt</th>
                                                        <th>Sender Bank</th>
                                                        <th>Receiver Bank</th>
                                                        <th>Amount</th>
                                                        <th>Description</th>
                                                        <th>Created By</th>
                                                        <th>Date</th>
                                                        <th>Transaction ID</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.length > 0 ? (
                                                        data.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                                                <td>{item.payment_receipt || "-"}</td>
                                                                <td>{item.sender_bank_name || "-"}</td>
                                                                <td>{item.receiver_bank_name || "-"}</td>
                                                                <td>₹ {parseFloat(item.amount || 0).toFixed(2)}</td>
                                                                <td>{item.description || "-"}</td>
                                                                <td>{item.created_by_name || "-"}</td>
                                                                <td>
                                                                    {item.created_at
                                                                        ? new Date(item.created_at).toLocaleDateString()
                                                                        : "-"}
                                                                </td>
                                                                <td>{item.transactionID || "-"}</td>
                                                                <td>
                                                                    <Button
                                                                        color="primary"
                                                                        size="sm"
                                                                        onClick={() => handleViewClick(item.id)}
                                                                    >
                                                                        View
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="10" className="text-center">
                                                                No transfers found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>

                                            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                                                <div>
                                                    Showing{" "}
                                                    {data.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}{" "}
                                                    to{" "}
                                                    {((currentPage - 1) * pageSize) + data.length}{" "}
                                                    of {totalCount} entries
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        color="secondary"
                                                        disabled={!previousPageUrl || currentPage === 1}
                                                        onClick={() => fetchTransferData(currentPage - 1)}
                                                    >
                                                        Previous
                                                    </Button>

                                                    <Button color="light" disabled>
                                                        Page {currentPage} of {totalPages || 1}
                                                    </Button>

                                                    <Button
                                                        color="secondary"
                                                        disabled={!nextPageUrl}
                                                        onClick={() => fetchTransferData(currentPage + 1)}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <ToastContainer />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Modal isOpen={modal} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Update Transfer</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label for="amount">Amount</Label>
                                    <Input
                                        type="number"
                                        name="amount"
                                        value={formData.amount || ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label for="description">Description</Label>
                                    <Input
                                        type="text"
                                        name="description"
                                        value={formData.description || ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>Sender Bank</Label>
                                    <Select
                                        value={senderBankOption}
                                        onChange={handleSenderBankChange}
                                        options={bankOptions}
                                        isClearable
                                        placeholder="Select Sender Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            menu: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>Receiver Bank</Label>
                                    <Select
                                        value={receiverBankOption}
                                        onChange={handleReceiverBankChange}
                                        options={bankOptions}
                                        isClearable
                                        placeholder="Select Receiver Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                            menu: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label for="transactionID">Transaction ID</Label>
                                    <Input
                                        type="text"
                                        name="transactionID"
                                        value={formData.transactionID || ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label for="created_at">Date</Label>
                                    <Input
                                        type="date"
                                        name="created_at"
                                        value={formData.created_at ? formData.created_at.substring(0, 10) : ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>
                            </Form>
                        </ModalBody>

                        <ModalFooter>
                            <Button color="primary" onClick={handleUpdate}>
                                Update
                            </Button>
                            <Button color="secondary" onClick={toggleModal}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default InternalTransferList;