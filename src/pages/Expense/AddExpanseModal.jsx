import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import {
    Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Form
} from "reactstrap";
import { FaEdit, FaTrash } from 'react-icons/fa'; // Importing icons for edit and delete

// Import components
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';

const AddExpanseModal = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false); // New state to differentiate between add and edit
    const [newState, setNewState] = useState({ name: "" });
    const token = localStorage.getItem('token');

    const toggleModal = () => setModal(!modal);

    const columns = useMemo(
        () => [
            {
                header: () => <div style={{ textAlign: 'center' }}>ID</div>,  // Center alignment for header
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    <div style={{ textAlign: 'center' }}>{row.original.id}</div> // Center alignment for ID value
                ),
            },
            {
                header: () => <div style={{ textAlign: 'center' }}>NAME</div>,
                accessorKey: 'expanse type name',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    <div style={{ textAlign: 'center' }}>{row.original.name}</div> // Center alignment for Name
                ),
            },
            {
                header: () => <div style={{ textAlign: 'center' }}>EDIT</div>,
                accessorKey: 'editActions',
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                            className="btn btn-primary d-flex align-items-center"
                            style={{ height: '30px', padding: '0 10px' }}
                            onClick={() => handleEdit(row.original)}
                        >
                            <FaEdit style={{ marginRight: '5px' }} />
                            Edit
                        </button>
                    </div>
                ),
            },
        ],
        []
    );

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsAddMode(false);
        toggleModal();
    };



    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (isAddMode) {
            setNewState((prev) => ({ ...prev, [name]: value }));
        } else {
            setSelectedCustomer((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        if (isAddMode) {
            // Handle Add State
            try {
                const response = await axios.post(`${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`, newState, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setData([...data, {
                    ...response.data,
                    name: response.data.name
                }]);
                toggleModal();
            } catch (error) {
                setError(error.message || "Failed to add state");
            }
        } else {
            // Handle Update State
            try {
                const response = await axios.put(`${import.meta.env.VITE_APP_IMAGE}/apis/purpose/update/${selectedCustomer.id}/`, selectedCustomer, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Update the specific state entry
                setData(data.map(customer => customer.id === selectedCustomer.id ? response.data : customer));
                toggleModal();
            } catch (error) {
                setError(error.message || "Failed to update customer");
            }
        }
    };

    const handleAddState = () => {
        setIsAddMode(true);
        setNewState({ name: "" }); // Clear the new state form
        toggleModal();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.status === 200) {
                    setData(response.data);
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    document.title = "Expenses | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Expenses Information" />

                {/* Add State Button */}
                <Button color="success" onClick={handleAddState} className="mb-4">
                    Add Expense Type
                </Button>

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
                        // SearchPlaceholder="Search by Name, Department, or Designation..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                )}

                {/* Modal for adding/editing state */}
                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>
                        {isAddMode ? "Add new expanse modal" : "Edit expanse type"}
                    </ModalHeader>
                    <ModalBody>
                        <Form>
                            <Label for="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={isAddMode ? newState.name : selectedCustomer?.name || ''}
                                onChange={handleInputChange}
                            />
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" onClick={toggleModal}>Cancel</Button>
                        <Button color="primary" onClick={handleSubmit}>
                            {isAddMode ? "Add" : "Save"}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </div>
    );
};

AddExpanseModal.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default AddExpanseModal;
