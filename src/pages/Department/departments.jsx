import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import {
    Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Form
} from "reactstrap";
import { FaEdit, FaTrash } from 'react-icons/fa'; 
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DepartmentTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false); // New state to differentiate between add and edit
    const [newState, setNewState] = useState({ name: "" }); // State for the new state form
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
                accessorKey: 'name',
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
            // {
            //     header: () => <div style={{ textAlign: 'center' }}>DELETE</div>,
            //     accessorKey: 'deleteActions',
            //     enableColumnFilter: false,
            //     enableSorting: false,
            //     cell: ({ row }) => (
            //         <div style={{ display: 'flex', justifyContent: 'center' }}>
            //             <button
            //                 className="btn btn-danger d-flex align-items-center"
            //                 style={{ height: '30px', padding: '0 10px' }}
            //                 onClick={() => handleDelete(row.original.id)}
            //             >
            //                 <FaTrash style={{ marginRight: '5px' }} />
            //                 Delete
            //             </button>
            //         </div>
            //     ),
            // },
        ],
        []
    );

    const handleEdit = (customer) => {
        setSelectedCustomer(customer);
        setIsAddMode(false);
        toggleModal();
    };

    const handleDelete = async (id) => {
        // Optimistically remove the state from the UI
        const originalData = [...data];
        setData(data.filter(customer => customer.id !== id));

        try {
            await axios.delete(`${import.meta.env.VITE_APP_KEY}department/update/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            setError(error.message || "Failed to delete customer");
            setData(originalData); // Revert the UI if deletion fails
        }
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
                const response = await axios.post(`${import.meta.env.VITE_APP_KEY}add/department/`, newState, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setData([...data, response.data]); // Add new state to table data
                await fetchData();
                toggleModal();
            } catch (error) {
                setError(error.message || "Failed to add state");
            }
        } else {
            // Handle Update State
            try {
                const response = await axios.put(`${import.meta.env.VITE_APP_KEY}department/update/${selectedCustomer.id}/`, selectedCustomer, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                // Update the specific state entry
                setData(data.map(customer => customer.id === selectedCustomer.id ? response.data : customer));
                await fetchData();
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

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}departments/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 200) {
                setData(response.data.data);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            setError(error.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    document.title = "States | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Departmenet Information" />

                {/* Add State Button */}
                <Button color="success" onClick={handleAddState} className="mb-4">
                    Add Department
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
                        SearchPlaceholder="Search by Name, Department, or Designation..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                )}

                {/* Modal for adding/editing state */}
                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>
                        {isAddMode ? "add new department" : "edit existing department"}
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

DepartmentTable.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default DepartmentTable;
