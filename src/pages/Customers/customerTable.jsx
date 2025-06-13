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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Step 1: Fetch customers first
                const customerResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (customerResponse.status === 200) {
                    setData(customerResponse.data.data);

                    // Step 2: Fetch states and managers only after customers are fetched
                    const [responseState, responseManager] = await Promise.all([
                        axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                        axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, { headers: { 'Authorization': `Bearer ${token}` } })
                    ]);

                    if (responseState.status === 200) setStates(responseState.data.data);
                    if (responseManager.status === 200) setManager(responseManager.data.data);
                }

            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchData();
    }, [token]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleStateFilter = (e) => {
        setSelectedState(e.target.value);
    };

    const filteredData = data.filter((customer) =>
        (customer.name.toLowerCase().includes(searchTerm.toLowerCase())))

    const handleUpdate = (customerId) => {
        navigate(`/customer/${customerId}/edit/`);
    };

    const handleAddress = (customerId) => {
        navigate(`/customer/address/${customerId}/add/`);
    };

    const handleLedger = (customerId) => {
        navigate(`/customer/${customerId}/ledger/`);
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
            "State": customer.state || 'N/A',
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
                                        <Col md={6}>
                                            <FormGroup className="mb-0">
                                                <Input
                                                    type="text"
                                                    placeholder="Search by name"
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
                                        <Col md={4} style={{ marginTop: "-1px" }} className="d-flex justify-content-end">
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
                                                    {filteredData.map((customer, index) => (
                                                        <tr key={customer.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{customer.name}</td>
                                                            <td>{customer.email || 'N/A'}</td>
                                                            <td>{customer.phone || 'N/A'}</td>
                                                            <td>
                                                                <Dropdown>
                                                                    <Dropdown.Toggle variant="secondary" size="sm" id={`dropdown-${customer.id}`}>
                                                                        Actions
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu>
                                                                        <Dropdown.Item onClick={() => handleUpdate(customer.id)}>
                                                                            Update
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleAddress(customer.id)}>
                                                                            Address
                                                                        </Dropdown.Item>
                                                                        <Dropdown.Item onClick={() => handleLedger(customer.id)}>
                                                                            Ledger
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
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
