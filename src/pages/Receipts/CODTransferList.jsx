import React, { useEffect, useState } from 'react';
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

const CODTransferList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [currentTransfer, setCurrentTransfer] = useState(null);
    const [formData, setFormData] = useState({});

    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);

    const [senderBankOption, setSenderBankOption] = useState(null);
    const [receiverBankOption, setReceiverBankOption] = useState(null);
    const [createdByOption, setCreatedByOption] = useState(null);

    const [modalSenderBankOption, setModalSenderBankOption] = useState(null);
    const [modalReceiverBankOption, setModalReceiverBankOption] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [previousPageUrl, setPreviousPageUrl] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [createdAtFromDate, setCreatedAtFromDate] = useState("");
    const [createdAtToDate, setCreatedAtToDate] = useState("");
    const [createdEndFromDate, setCreatedEndFromDate] = useState("");
    const [createdEndToDate, setCreatedEndToDate] = useState("");

    const token = localStorage.getItem("token");

    document.title = "COD Bank Transfer List | Beposoft";

    const toggleModal = () => setModal(!modal);

    const fetchTransferData = async (page = 1) => {
        try {
            setLoading(true);

            const params = {
                page,
            };

            if (searchTerm) params.search = searchTerm;
            if (senderBankOption?.value) params.sender_bank = senderBankOption.value;
            if (receiverBankOption?.value) params.receiver_bank = receiverBankOption.value;
            if (createdByOption?.value) params.created_by = createdByOption.value;

            if (createdAtFromDate) params.created_at_start_date = createdAtFromDate;
            if (createdAtToDate) params.created_at_end_date = createdAtToDate;

            if (createdEndFromDate) params.created_end_start_date = createdEndFromDate;
            if (createdEndToDate) params.created_end_end_date = createdEndToDate;

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}get/cod/transfers/`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            setData(response.data.results?.data || []);
            setTotalCount(response.data.count || 0);
            setNextPageUrl(response.data.next || null);
            setPreviousPageUrl(response.data.previous || null);
            setCurrentPage(page);
        } catch (error) {
            toast.error("Error fetching cod transfer data");
            setData([]);
            setTotalCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransferDataByUrl = async (url, page) => {
        try {
            setLoading(true);

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setData(response.data.results?.data || []);
            setTotalCount(response.data.count || 0);
            setNextPageUrl(response.data.next || null);
            setPreviousPageUrl(response.data.previous || null);
            setCurrentPage(page);
        } catch (error) {
            toast.error("Error fetching cod transfer data");
            setData([]);
            setTotalCount(0);
            setNextPageUrl(null);
            setPreviousPageUrl(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchBanks = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setBanks(response.data.data || []);
            }
        } catch (error) {
            toast.error("Error fetching banks");
        }
    };

    const fetchStaffs = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}get/staffs/`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: 1,
                    page_size: 1000
                }
            });

            if (response.status === 200) {
                setStaffs(response.data.results?.data || response.data.data || []);
            }
        } catch (error) {
            toast.error("Error fetching staffs");
        }
    };

    const handleViewClick = async (id) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}cod/transfers/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const transferData = response.data;
            setCurrentTransfer(transferData);
            setFormData(transferData);

            const sender = banks.find(bank => String(bank.id) === String(transferData.sender_bank));
            const receiver = banks.find(bank => String(bank.id) === String(transferData.receiver_bank));

            setModalSenderBankOption(
                sender ? { label: sender.name, value: sender.id } : null
            );
            setModalReceiverBankOption(
                receiver ? { label: receiver.name, value: receiver.id } : null
            );

            setModal(true);
        } catch (error) {
            toast.error("Error fetching cod transfer details");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdate = async () => {
        try {
            await axios.put(
                `${import.meta.env.VITE_APP_KEY}cod/transfers/${currentTransfer.id}/`,
                formData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success("COD Transfer updated successfully");
            toggleModal();
            fetchTransferData(currentPage);
        } catch (error) {
            toast.error("Error updating cod transfer");
        }
    };

    const handleSearch = () => {
        fetchTransferData(1);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setSenderBankOption(null);
        setReceiverBankOption(null);
        setCreatedByOption(null);
        setCreatedAtFromDate("");
        setCreatedAtToDate("");
        setCreatedEndFromDate("");
        setCreatedEndToDate("");

        setTimeout(() => {
            fetchTransferData(1);
        }, 0);
    };

    const handleNextPage = () => {
        if (nextPageUrl) {
            fetchTransferDataByUrl(nextPageUrl, currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (previousPageUrl) {
            fetchTransferDataByUrl(previousPageUrl, currentPage - 1);
        }
    };

    useEffect(() => {
        fetchBanks();
        fetchStaffs();
        fetchTransferData(1);
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="TRANSFER" breadcrumbItem="COD BANK TRANSFER DETAILS" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">COD BANK TRANSFER DETAILS</CardTitle>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>Search</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search payment receipt, transaction ID, amount, description"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Sender Bank</Label>
                                            <Select
                                                value={senderBankOption}
                                                onChange={setSenderBankOption}
                                                options={banks.map((bank) => ({
                                                    label: bank.name,
                                                    value: bank.id
                                                }))}
                                                isClearable
                                                placeholder="Select Sender Bank"
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Receiver Bank</Label>
                                            <Select
                                                value={receiverBankOption}
                                                onChange={setReceiverBankOption}
                                                options={banks.map((bank) => ({
                                                    label: bank.name,
                                                    value: bank.id
                                                }))}
                                                isClearable
                                                placeholder="Select Receiver Bank"
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Created By</Label>
                                            <Select
                                                value={createdByOption}
                                                onChange={setCreatedByOption}
                                                options={staffs.map((staff) => ({
                                                    label: staff.name,
                                                    value: staff.id
                                                }))}
                                                isClearable
                                                placeholder="Select Staff"
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={3}>
                                            <Label>Send Date From</Label>
                                            <Input
                                                type="date"
                                                value={createdAtFromDate}
                                                onChange={(e) => setCreatedAtFromDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Send Date To</Label>
                                            <Input
                                                type="date"
                                                value={createdAtToDate}
                                                onChange={(e) => setCreatedAtToDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Receive Date From</Label>
                                            <Input
                                                type="date"
                                                value={createdEndFromDate}
                                                onChange={(e) => setCreatedEndFromDate(e.target.value)}
                                            />
                                        </Col>

                                        <Col md={3}>
                                            <Label>Receive Date To</Label>
                                            <Input
                                                type="date"
                                                value={createdEndToDate}
                                                onChange={(e) => setCreatedEndToDate(e.target.value)}
                                            />
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={12} className="d-flex gap-2">
                                            <Button color="primary" onClick={handleSearch}>
                                                Search
                                            </Button>
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
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <strong>Total Count:</strong> {totalCount}
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        color="secondary"
                                                        onClick={handlePreviousPage}
                                                        disabled={!previousPageUrl}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <span className="align-self-center px-2">
                                                        Page {currentPage}
                                                    </span>
                                                    <Button
                                                        color="secondary"
                                                        onClick={handleNextPage}
                                                        disabled={!nextPageUrl}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>

                                            <Table className="table-bordered">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Receiver Bank</th>
                                                        <th>Receive Date</th>
                                                        <th>Amount</th>
                                                        <th>Sender Bank</th>
                                                        <th>Send Date</th>
                                                        <th>Description</th>
                                                        <th>Created By</th>
                                                        <th>Payment Receipt</th>
                                                        <th>Transaction ID</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.length > 0 ? (
                                                        data.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{item.receiver_bank_name || ""}</td>
                                                                <td>
                                                                    {item.created_end
                                                                        ? new Date(item.created_end).toLocaleDateString()
                                                                        : ""}
                                                                </td>
                                                                <td>₹ {parseFloat(item.amount || 0).toFixed(2)}</td>
                                                                <td>{item.sender_bank_name || ""}</td>
                                                                <td>
                                                                    {item.created_at
                                                                        ? new Date(item.created_at).toLocaleDateString()
                                                                        : ""}
                                                                </td>
                                                                <td>{item.description || ""}</td>
                                                                <td>{item.created_by_name || ""}</td>
                                                                <td>{item.payment_receipt || ""}</td>
                                                                <td>{item.transactionID || ""}</td>
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
                                                            <td colSpan="11" className="text-center">
                                                                No cod transfers found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </>
                                    )}

                                    <ToastContainer />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    <Modal isOpen={modal} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Update COD Transfer</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label>Receiver Bank</Label>
                                    <Select
                                        value={modalReceiverBankOption}
                                        onChange={(selected) => {
                                            setModalReceiverBankOption(selected);
                                            setFormData((prev) => ({
                                                ...prev,
                                                receiver_bank: selected ? selected.value : ""
                                            }));
                                        }}
                                        options={banks.map((bank) => ({
                                            label: bank.name,
                                            value: bank.id
                                        }))}
                                        isClearable
                                        placeholder="Select Receiver Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label for="created_end">Receive Date</Label>
                                    <Input
                                        type="date"
                                        name="created_end"
                                        value={formData.created_end ? formData.created_end.substring(0, 10) : ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup>

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
                                    <Label>Sender Bank</Label>
                                    <Select
                                        value={modalSenderBankOption}
                                        onChange={(selected) => {
                                            setModalSenderBankOption(selected);
                                            setFormData((prev) => ({
                                                ...prev,
                                                sender_bank: selected ? selected.value : ""
                                            }));
                                        }}
                                        options={banks.map((bank) => ({
                                            label: bank.name,
                                            value: bank.id
                                        }))}
                                        isClearable
                                        placeholder="Select Sender Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999 })
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
                                    <Label for="created_at">Send Date</Label>
                                    <Input
                                        type="date"
                                        name="created_at"
                                        value={formData.created_at ? formData.created_at.substring(0, 10) : ""}
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

export default CODTransferList;