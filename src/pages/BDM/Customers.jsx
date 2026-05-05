import React, { useEffect, useState } from "react";
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardSubtitle,
    Button,
    Input,
    FormGroup,
    Label
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [states, setStates] = useState([]);
    const [managers, setManager] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [userData, setUserData] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.family_id);
            } catch (error) {
                toast.error('Error fetching user data');
            }
        };

        if (token) {
            fetchUserData();
        }
    }, [token]);

    useEffect(() => {
        const fetchData = async () => {
            if (!userData) return;

            try {
                setLoading(true);
                setError(null);

                const [response, responseState, responseManager] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_APP_KEY}customers/division/${userData}/`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        params: {
                            search: searchTerm,
                            page: currentPage,
                        }
                    }),

                    axios.get(`${import.meta.env.VITE_APP_KEY}states/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),

                    axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                ]);

                if (response.status === 200) {
                    setData(response?.data?.results || []);
                    setTotalCount(response?.data?.count || 0);
                    setNextPage(response?.data?.next || null);
                    setPreviousPage(response?.data?.previous || null);
                    console.log(response?.data);
                }

                if (responseState.status === 200) {
                    setStates(responseState.data.data);
                }

                if (responseManager.status === 200) {
                    setManager(responseManager.data.data);
                }

            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, userData, searchTerm, currentPage]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleStateFilter = (e) => {
        setSelectedState(e.target.value);
    };

    const filteredData = data;

    const handleUpdate = (customerId) => {
        navigate(`/customer/${customerId}/edit/`);
    };

    const handleAddress = (customerId) => {
        navigate(`/customer/address/${customerId}/add/`);
    };

    const handleLedger = (customerId) => {
        navigate(`/customer/${customerId}/ledger/`);
    };

    const handlePreviousPage = () => {
        if (previousPage && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (nextPage) {
            setCurrentPage(currentPage + 1);
        }
    };

    const exportToExcel = () => {
        const formattedData = filteredData.map((customer, index) => ({
            "#": index + 1,
            "Name": customer.name,
            "Manager": customer.manager,
            "GST": customer.gst || 'N/A',
            "Email": customer.email || 'N/A',
            "Phone": customer.phone || 'N/A',
            "Alt Phone": customer.alt_phone || 'N/A',
            "City": customer.city || 'N/A',
            "State": customer.state_name || 'N/A',
            "Zip": customer.zip_code || 'N/A',
            "Address": customer.address || 'N/A',
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

        XLSX.writeFile(workbook, "Customer_List.xlsx");
    };

    document.title = "Customer List | Dashboard Template";

    return (
        <React.Fragment>
            <ToastContainer />

            <div className="page-content">
                <div className="container-fluid">
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">Customer List</CardTitle>
                                    <CardSubtitle className="card-title-desc">
                                        Filter and view customer data.
                                    </CardSubtitle>

                                    <Row className="align-items-center mb-3">
                                        <Col md={5}>
                                            <FormGroup className="mb-0">
                                                <Input
                                                    type="text"
                                                    placeholder="Search by name, email, or phone"
                                                    value={searchTerm}
                                                    onChange={handleSearch}
                                                    className="w-100"
                                                />
                                            </FormGroup>
                                        </Col>

                                        {/* <Col md={5}>
                                            <FormGroup className="mb-0">
                                                <Label for="stateFilter" className="mb-1">Filter by State</Label>
                                                <Input
                                                    type="select"
                                                    id="stateFilter"
                                                    value={selectedState}
                                                    onChange={handleStateFilter}
                                                    className="w-100"
                                                >
                                                    <option value="">All States</option>
                                                    {states.map((state) => (
                                                        <option key={state.id} value={state.name}>
                                                            {state.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                            </FormGroup>
                                        </Col> */}

                                        <Col md={2} className="d-flex justify-content-end">
                                            <Button color="success" onClick={exportToExcel} className="w-100">
                                                Export to Excel
                                            </Button>
                                        </Col>
                                    </Row>

                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p className="text-danger">{error}</p>
                                    ) : (
                                        <>
                                            <div className="table-responsive">
                                                <Table bordered striped hover className="mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Name</th>
                                                            <th>Email</th>
                                                            <th>Phone</th>
                                                            <th>Action</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredData.length > 0 ? (
                                                            filteredData.map((customer, index) => (
                                                                <tr key={customer.id}>
                                                                    <th scope="row">
                                                                        {(currentPage - 1) * 50 + index + 1}
                                                                    </th>
                                                                    <td>{customer.name}</td>
                                                                    <td>{customer.email || 'N/A'}</td>
                                                                    <td>{customer.phone || 'N/A'}</td>
                                                                    <td>
                                                                        <DropdownButton
                                                                            id={`dropdown-${customer.id}`}
                                                                            title="Actions"
                                                                            size="sm"
                                                                            variant="secondary"
                                                                            className="d-inline-block"
                                                                        >
                                                                            <Dropdown.Item onClick={() => handleUpdate(customer.id)}>
                                                                                Update
                                                                            </Dropdown.Item>

                                                                            <Dropdown.Item onClick={() => handleAddress(customer.id)}>
                                                                                Address
                                                                            </Dropdown.Item>

                                                                            <Dropdown.Item onClick={() => handleLedger(customer.id)}>
                                                                                Ledger
                                                                            </Dropdown.Item>
                                                                        </DropdownButton>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="text-center">
                                                                    No customers found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <div>
                                                    <span>
                                                        Total Customers: {totalCount}
                                                    </span>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        color="secondary"
                                                        size="sm"
                                                        disabled={!previousPage}
                                                        onClick={handlePreviousPage}
                                                    >
                                                        Previous
                                                    </Button>

                                                    <Button color="light" size="sm" disabled>
                                                        Page {currentPage}
                                                    </Button>

                                                    <Button
                                                        color="secondary"
                                                        size="sm"
                                                        disabled={!nextPage}
                                                        onClick={handleNextPage}
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;