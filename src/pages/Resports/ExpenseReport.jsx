import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Form,
    FormGroup,
    Label
} from "reactstrap";
import * as XLSX from "xlsx";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredData, setFilteredData] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;

    useEffect(() => {
        const token = localStorage.getItem('token');

        axios.get(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((response) => {
                setData(response.data.data);
                setFilteredData(response.data.data);
                setLoading(false);
            })
            .catch((error) => {
                toast.error("There was an error fetching the data!");
                setLoading(false);
            });
    }, []);

    // Handle search and date filtering
    const handleSearchAndFilter = () => {
        let filtered = data;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter((item) =>
                item.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by date range
        if (startDate && endDate) {
            filtered = filtered.filter((item) =>
                new Date(item.expense_date) >= new Date(startDate) &&
                new Date(item.expense_date) <= new Date(endDate)
            );
        }

        setFilteredData(filtered);
    };

    // Handle input changes and trigger automatic filtering
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        handleSearchAndFilter();
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
        handleSearchAndFilter();
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
        handleSearchAndFilter();
    };

    // Toggle modal open state
    const toggleModal = () => setModalOpen(!modalOpen);

    // Set the selected row and open the modal
    const viewDetails = (item) => {
        setSelectedRow(item);
        toggleModal();
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Export data to Excel
    const exportToExcel = () => {
        const exportData = filteredData.map((item) => ({
            "Date": item.expense_date,
            "Description": item.description,
            "Purpose of Payment": item.purpose_of_pay,
            "Amount": item.amount,
            "Paid By": item.payed_by.name,
            "Company": item.company.name,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expense Report");
        XLSX.writeFile(wb, "expense_report.xlsx");
    };

    // Calculate the total amount
    const calculateTotalAmount = () => {
        return filteredData.reduce((total, item) => total + parseFloat(item.amount || 0), 0).toFixed(2);
    };

    // meta title
    document.title = "BEPOSOFT | EXPENSE REPORT";

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="EXPENSE REPORT" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center">EXPENSE REPORT</CardTitle>

                                    {/* Filter Form */}
                                    <Form className="mb-3">
                                        <Row>
                                            {/* Search Input */}
                                            <Col md={4}>
                                                <FormGroup>
                                                    <Label for="search">Search by Description</Label>
                                                    <Input
                                                        id="search"
                                                        type="text"
                                                        placeholder="Search..."
                                                        value={searchQuery}
                                                        onChange={handleSearchChange}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            {/* Date Range */}
                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label for="startDate">Start Date</Label>
                                                    <Input
                                                        id="startDate"
                                                        type="date"
                                                        value={startDate}
                                                        onChange={handleStartDateChange}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={3}>
                                                <FormGroup>
                                                    <Label for="endDate">End Date</Label>
                                                    <Input
                                                        id="endDate"
                                                        type="date"
                                                        value={endDate}
                                                        onChange={handleEndDateChange}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={2}>
                                                {/* Export to Excel Button */}
                                                <Button color="success" onClick={exportToExcel} className="mb-3">
                                                    Export to Excel
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>

                                    {loading ? (
                                        <div>Loading...</div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table table-hover mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>DATE</th>
                                                        <th>DESCRIPTION</th>
                                                        <th>PURPOSE OF PAYMENT</th>
                                                        <th>AMOUNT</th>
                                                        <th>PAYED BY</th>
                                                        <th>COMPANY</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentItems.map((item, index) => (
                                                        <tr key={index}>
                                                            <th scope="row">{indexOfFirstItem + index + 1}</th>
                                                            <td>{item.expense_date}</td>
                                                            <td>{item.description}</td>
                                                            <td>{item.purpose_of_pay}</td>
                                                            <td>{item.amount}</td>
                                                            <td>{item.payed_by.name}</td>
                                                            <td>{item.company.name}</td>
                                                            <td>
                                                                <Button color="primary" onClick={() => viewDetails(item)}>
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
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
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>

                    {/* Modal for viewing details */}
                    <Modal isOpen={modalOpen} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Expense Details</ModalHeader>
                        <ModalBody>
                            {selectedRow && (
                                <div>
                                    <p><strong>Date:</strong> {selectedRow.expense_date}</p>
                                    <p><strong>Description:</strong> {selectedRow.description}</p>
                                    <p><strong>Purpose of Payment:</strong> {selectedRow.purpose_of_pay}</p>
                                    <p><strong>Amount:</strong> {selectedRow.amount}</p>
                                    <p><strong>Paid By:</strong> {selectedRow.added_by}</p>
                                    <p><strong>Company:</strong> {selectedRow.company.name}</p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" onClick={toggleModal}>Close</Button>
                        </ModalFooter>
                    </Modal>

                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
