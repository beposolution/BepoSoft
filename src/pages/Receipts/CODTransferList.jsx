import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Card, Col, Container, Row, CardBody, CardTitle,
    Table, Spinner, Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import Paginations from "../../components/Common/Pagination";

const CODTransferList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [currentTransfer, setCurrentTransfer] = useState(null);
    const [formData, setFormData] = useState({});
    const token = localStorage.getItem("token");
    const [banks, setBanks] = useState([]);
    const [senderBankOption, setSenderBankOption] = useState(null);
    const [receiverBankOption, setReceiverBankOption] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    document.title = "COD Bank Transfer List | Beposoft";

    const toggleModal = () => setModal(!modal);

    const fetchTransferData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}cod/transfers/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            toast.error('Error fetching cod transfer data');
        } finally {
            setLoading(false);
        }
    };

    const handleViewClick = async (id) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}cod/transfers/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data;
            setCurrentTransfer(data);
            setFormData(data);

            // Pre-select dropdown options
            const sender = banks.find(bank => bank.name === data.sender_bank_name);
            const receiver = banks.find(bank => bank.name === data.receiver_bank_name);

            setSenderBankOption(sender ? { label: sender.name, value: sender.id } : null);
            setReceiverBankOption(receiver ? { label: receiver.name, value: receiver.id } : null);

            toggleModal();
        } catch (error) {
            toast.error("Error fetching cod transfer details");
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_APP_KEY}cod/transfers/${currentTransfer.id}/`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("COD Transfer updated successfully");
            toggleModal();
            fetchTransferData(); // Refresh list
        } catch (error) {
            toast.error("Error updating cod transfer");
        }
    };

    useEffect(() => {
        fetchTransferData();

        const fetchBanks = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.status === 200) {
                    setBanks(response.data.data); // Adjust depending on your API structure
                }
            } catch (error) {
                toast.error("Error fetching banks");
            }
        };

        fetchBanks();
    }, []);

    const handleSenderBankChange = (selected) => {
        setSenderBankOption(selected);
        setFormData(prev => ({ ...prev, sender_bank: selected ? selected.value : "" }));
    };

    const handleReceiverBankChange = (selected) => {
        setReceiverBankOption(selected);
        setFormData(prev => ({ ...prev, receiver_bank: selected ? selected.value : "" }));
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.sender_bank_name?.toLowerCase().includes(searchTerm) ||
            item.receiver_bank_name?.toLowerCase().includes(searchTerm) ||
            // item.transactionID?.toLowerCase().includes(searchTerm) ||
            item.created_by_name?.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            String(item.amount)?.toLowerCase().includes(searchTerm) ||
            Number(item.amount || 0).toFixed(2).includes(searchTerm);

        const itemDate = item.created_at?.substring(0, 10); // format: YYYY-MM-DD

        const matchesDate =
            (!fromDate || itemDate >= fromDate) &&
            (!toDate || itemDate <= toDate);

        return matchesSearch && matchesDate;
    });

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
        setCurrentPage(1);
    };

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
                                        <Col md={4}>
                                            <Label>Search Transfers</Label>
                                            <Input
                                                type="text"
                                                placeholder="Search by Sender, Receiver, Transaction ID, Amount, Description or Created By"
                                                value={searchTerm}
                                                onChange={(e) => {
                                                    setSearchTerm(e.target.value.toLowerCase());
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </Col>
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
                                        <Col md={2} className="d-flex align-items-end">
                                            <Button
                                                color="secondary"
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setFromDate("");
                                                    setToDate("");
                                                    setCurrentPage(1);
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </Col>
                                    </Row>
                                    {loading ? (
                                        <div className="text-center"><Spinner color="primary" /></div>
                                    ) : (
                                        <>
                                            <Table className="table-bordered">
                                                <thead className="thead-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Sender Bank</th>
                                                        <th>Receiver Bank</th>
                                                        <th>Amount</th>
                                                        <th>Description</th>
                                                        <th>Created By</th>
                                                        <th>Date</th>
                                                        {/* <th>Transaction ID</th> */}
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.length > 0 ? (
                                                        currentData.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>{item.sender_bank_name}</td>
                                                                <td>{item.receiver_bank_name}</td>
                                                                <td>₹ {parseFloat(item.amount).toFixed(2)}</td>
                                                                <td>{item.description}</td>
                                                                <td>{item.created_by_name}</td>
                                                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                                                {/* <td>{item.transactionID}</td> */}
                                                                <td>
                                                                    <Button onClick={() => handleViewClick(item.id)}>View</Button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="9" className="text-center">No cod transfers found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                            <Paginations
                                                perPageData={perPageData}
                                                data={filteredData}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                isShowingPageLength={true}
                                                paginationDiv="col-auto"
                                                paginationClass="pagination-rounded"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </>
                                    )}
                                    <ToastContainer />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Update Modal */}
                    <Modal isOpen={modal} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Update COD Transfer</ModalHeader>
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
                                        options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
                                        isClearable
                                        placeholder="Select Sender Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999 }) // optional: double coverage
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label>Receiver Bank</Label>
                                    <Select
                                        value={receiverBankOption}
                                        onChange={handleReceiverBankChange}
                                        options={banks.map(bank => ({ label: bank.name, value: bank.id }))}
                                        isClearable
                                        placeholder="Select Receiver Bank"
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 9999 }),
                                            menu: base => ({ ...base, zIndex: 9999 }) // optional: double coverage
                                        }}
                                    />
                                </FormGroup>
                                {/* <FormGroup>
                                    <Label for="transactionID">Transaction ID</Label>
                                    <Input
                                        type="text"
                                        name="transactionID"
                                        value={formData.transactionID || ""}
                                        onChange={handleInputChange}
                                    />
                                </FormGroup> */}
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
                            <Button color="primary" onClick={handleUpdate}>Update</Button>{' '}
                            <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default CODTransferList;
