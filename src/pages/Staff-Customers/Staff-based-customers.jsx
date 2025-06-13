import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Pagination,
    PaginationItem,
    PaginationLink,
} from "reactstrap";
import { useNavigate } from "react-router-dom";
import { Dropdown, DropdownButton } from 'react-bootstrap';


//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    // Meta title
    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    // State to store customers, search query, and pagination details
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    

    // Fetch customers from an API
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}staff/customers/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setCustomers(response.data.data);
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, []);

    // Filtered customers based on search query
    const filteredCustomers = customers.filter((customer) =>
        `${customer.name} ${customer.phone} ${customer.username}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    // Pagination logic
    const totalItems = filteredCustomers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filteredCustomers.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleUpdate = (customerId) => {
        navigate(`/customer/${customerId}/edit/`);
    };

    const handleAddress = (customerId) => {
        navigate(`/customer/address/${customerId}/add/`);
    };

    const handleLedger = (customerId) => {
        navigate(`/customer/${customerId}/ledger/`);
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Basic Tables" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4">Customers</CardTitle>
                                    <Input
                                        type="text"
                                        placeholder="Search by name or username..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="mb-3"
                                    />

                                    <div className="table-responsive">
                                        <Table className="table table-striped mb-0">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>Phone</th>
                                                    <th>GST</th>
                                                    <th>State</th>
                                                    <th>Email</th>
                                                    <th>ZIP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.length > 0 ? (
                                                    currentItems.map((customer, index) => (
                                                        <tr key={customer.id}>
                                                            <th scope="row">
                                                                {startIndex + index + 1}
                                                            </th>
                                                            <td>{customer.name}</td>
                                                            <td>{customer.phone}</td>
                                                            <td>{customer.gst}</td>
                                                            <td>{customer.state}</td>
                                                            <td>{customer.email}</td>
                                                            <td>{customer.zip_code}</td>
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
                                                        <td colSpan="7" className="text-center">
                                                            No customers found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <Pagination className="mt-3">
                                            <PaginationItem
                                                disabled={currentPage === 1}
                                            >
                                                <PaginationLink
                                                    previous
                                                    onClick={() =>
                                                        handlePageChange(
                                                            currentPage - 1
                                                        )
                                                    }
                                                />
                                            </PaginationItem>
                                            {Array.from(
                                                { length: totalPages },
                                                (_, index) => index + 1
                                            ).map((pageNumber) => (
                                                <PaginationItem
                                                    key={pageNumber}
                                                    active={pageNumber === currentPage}
                                                >
                                                    <PaginationLink
                                                        onClick={() =>
                                                            handlePageChange(
                                                                pageNumber
                                                            )
                                                        }
                                                    >
                                                        {pageNumber}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}
                                            <PaginationItem
                                                disabled={currentPage === totalPages}
                                            >
                                                <PaginationLink
                                                    next
                                                    onClick={() =>
                                                        handlePageChange(
                                                            currentPage + 1
                                                        )
                                                    }
                                                />
                                            </PaginationItem>
                                        </Pagination>
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
