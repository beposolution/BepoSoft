import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import {
    Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Form, FormFeedback, 
} from "reactstrap";
import { Dropdown } from 'react-bootstrap';
import { Link } from "react-router-dom";


// Import components
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';

const DatatableTables = () => {
    const [data, setData] = useState([]); // State to store customer data
    const [states, setState] = useState([]); // State to store customer data
    const [managers, setManager] = useState([]); // State to store customer data
    const [loading, setLoading] = useState(true); // State for loading status
    const [error, setError] = useState(null); // State for error handling
    const [selectedCustomer, setSelectedCustomer] = useState(null); // To store selected customer data
    const [modal, setModal] = useState(false); // State for modal visibility
    const [validationErrors, setValidationErrors] = useState({}); // Validation errors state
    const token = localStorage.getItem('token');

    const toggleModal = () => setModal(!modal); // Toggle modal

    const columns = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'GST',
                accessorKey: 'gst',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'NAME',
                accessorKey: 'name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'MANAGER',
                accessorKey: 'manager',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'PHONE',
                accessorKey: 'phone',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'EMAIL',
                accessorKey: 'email',
                enableColumnFilter: false,
                enableSorting: true,
            },

            {
                header: 'CITY',
                accessorKey: 'city',
                enableColumnFilter: false,
                enableSorting: true,
            },

            {
                header: 'STATE',
                accessorKey: 'state',
                enableColumnFilter: false,
                enableSorting: true,
            },

            {
                header: 'ZIP CODE',
                accessorKey: 'zip_code',
                enableColumnFilter: false,
                enableSorting: true,
            },

            {
                header: 'Actions',
                accessorKey: 'actions',
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <button
                        className="btn btn-primary"
                        onClick={() => handleUpdateClick(row.original)}
                    >
                        Update
                    </button>
                ),
            },
            {
                header: 'Actions',
                accessorKey: 'actions',
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <Dropdown>
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                            Actions
                        </Dropdown.Toggle>
            
                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/customer/address/${row.original.id}/add/`}>
                                Address
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/customer/invoice/${row.original.id}/view/`}>
                                Invoice
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/customer/orders/${row.original.id}/view/`}>
                                Orders
                            </Dropdown.Item>
                            <Dropdown.Item as={Link} to={`/customer/${row.original.id}/ledger/`}>
                                Ledger
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                ),
            }
            
        ],
        []
    );

    // Handle click on the Update button
    const handleUpdateClick = (customerData) => {
        setSelectedCustomer(customerData); // Set the selected customer data
        toggleModal(); // Open the modal
    };

    // Handle the form submission to update the customer
    const handleUpdateSubmit = async (event) => {
        event.preventDefault();
        
        // Validate form
        const errors = {};
        if (!selectedCustomer.state) {
            errors.state = "State is required";
        }
        if (!selectedCustomer.manager) {
            errors.manager = "Manager is required";
        }

        // If validation errors exist, stop form submission
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            const response = await axios.put(`${import.meta.env.VITE_APP_KEY}customer/update/${selectedCustomer.id}/`, selectedCustomer, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (response.status === 200) {
                // Update the local data array
                const updatedData = data.map((item) =>
                    item.id === selectedCustomer.id ? response.data : item
                );
                setData(updatedData); // This will cause a re-render with updated data
    
                toggleModal(); // Close the modal
                alert("Customer updated successfully!");
            } else {
                throw new Error("Failed to update customer.");
            }
        } catch (error) {
            setError(error.message || "Failed to update customer.");
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSelectedCustomer((prev) => ({ ...prev, [name]: value }));

        // Clear validation error if a valid value is selected
        setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}customers/`, {headers: {'Authorization': `Bearer ${token}`}});
                const responseState = await axios.get(`${import.meta.env.VITE_APP_KEY}states/`, {headers: {'Authorization': `Bearer ${token}`}});
                const responseManager = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {headers: {'Authorization': `Bearer ${token}`}});

                if (response.status === 200) {
                    setData(response.data.data); 
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                if (responseState.status === 200) {
                    setState(responseState.data.data); 
                } else {
                    throw new Error(`HTTP error! Status: ${responseState.status}`);
                }
                if (responseManager.status === 200) {
                    setManager(responseManager.data.data);
                } else {
                    throw new Error(`HTTP error! Status: ${responseManager.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    document.title = "Staff | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Customers Information" />
                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-danger">Error: {error}</p>
                ) : (
                    <TableContainer
                        columns={columns}
                        data={data || []}
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search by Name, Department, or Designation..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                )}

                {/* Modal for Update */}
                {selectedCustomer && (
                    <Modal isOpen={modal} toggle={toggleModal}>
                        <ModalHeader toggle={toggleModal}>Update Customer</ModalHeader>
                        <Form onSubmit={handleUpdateSubmit}>
                            <ModalBody>
                                <div className="mb-3">
                                    <Label for="name">Name</Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={selectedCustomer.name}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="manager">Managed User</Label>
                                    <select
                                        className={`form-control ${validationErrors.manager ? 'is-invalid' : ''}`}
                                        name="manager"
                                        value={selectedCustomer.manager}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Manager</option>
                                        {managers.map((manager) => (
                                            <option key={manager.id} value={manager.id}>
                                                {manager.name}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.manager && (
                                        <FormFeedback>{validationErrors.manager}</FormFeedback>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <Label for="gst">GST</Label>
                                    <Input
                                        type="text"
                                        name="gst"
                                        value={selectedCustomer.gst}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="email">Email</Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={selectedCustomer.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="phone">Phone</Label>
                                    <Input
                                        type="text"
                                        name="phone"
                                        value={selectedCustomer.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="alt_phone">ALT Phone</Label>
                                    <Input
                                        type="text"
                                        name="alt_phone"
                                        value={selectedCustomer.alt_phone}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="address">ADDRESS</Label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={selectedCustomer.address}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="zip_code">ZIP CODE </Label>
                                    <Input
                                        type="text"
                                        name="zip_code"
                                        value={selectedCustomer.zip_code}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="city">CITY</Label>
                                    <Input
                                        type="text"
                                        name="city"
                                        value={selectedCustomer.city}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="mb-3">
                                    <Label for="state">STATE</Label>
                                    <select
                                        className={`form-control ${validationErrors.state ? 'is-invalid' : ''}`}
                                        name="state"
                                        value={selectedCustomer.state}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select State</option>
                                        {states.map((state) => (
                                            <option key={state.id} value={state.id}>
                                                {state.name}
                                            </option>
                                        ))}
                                    </select>
                                    {validationErrors.state && (
                                        <FormFeedback>{validationErrors.state}</FormFeedback>
                                    )}
                                </div>

                            </ModalBody>

                            <ModalFooter>
                                <Button type="submit" color="primary">Update</Button>
                                <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                            </ModalFooter>
                        </Form>
                    </Modal>
                )}
            </div>
        </div>
    );
};

DatatableTables.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default DatatableTables;
