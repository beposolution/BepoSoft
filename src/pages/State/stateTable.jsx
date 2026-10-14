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
import { createAuditLog } from "../../services/auditService";

const StateTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false); // New state to differentiate between add and edit
    const [newState, setNewState] = useState({ name: "" }); // State for the new state form
    const token = localStorage.getItem('token');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [originalAuditData, setOriginalAuditData] = useState(null);

    const toggleModal = () => setModal(!modal);

    const columns = useMemo(
        () => [
            {
                header: () => <div style={{ textAlign: 'center' }}>ID</div>,  // Center alignment for header
                accessorKey: 'id',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    <div style={{ textAlign: 'center' }}>{row?.index + 1}</div> // Center alignment for ID value
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

        // Keep original value separately for audit log
        setOriginalAuditData({
            name: customer?.name || "",
        });

        setModal(true);
    };

    const handleDelete = async (id) => {
        // Optimistically remove the state from the UI
        const originalData = [...data];
        setData(data.filter(customer => customer.id !== id));

        try {
            await axios.delete(`${import.meta.env.VITE_APP_KEY}state/update/${id}/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            toast.error("Delete failed");
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

    const clearForm = () => {
        setNewState({
            name: "",
        });

        setSelectedCustomer(null);
        setOriginalAuditData(null);
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;

        clearForm();
        setIsAddMode(false);
        setModal(false);
    };

    const handleSubmit = async () => {
        // Prevent multiple clicks
        if (isSubmitting) return;

        const stateName = isAddMode
            ? newState.name?.trim()
            : selectedCustomer?.name?.trim();

        // Validation
        if (!stateName) {
            toast.error("State name is required");
            return;
        }

        try {
            setIsSubmitting(true);

            // ========================================================
            // ADD STATE
            // ========================================================

            if (isAddMode) {
                const payload = {
                    name: newState.name.trim(),
                };

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}add/state/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (
                    response.status === 201 ||
                    response.status === 200
                ) {
                    // ------------------------------------------------
                    // AUDIT LOG
                    // ------------------------------------------------

                    try {
                        const createdState =
                            response?.data?.data ??
                            response?.data ??
                            null;

                        const auditCreated =
                            await createAuditLog({
                                action: "state_created_website",

                                beforeData: {},

                                afterData: {
                                    name:
                                        createdState?.name ??
                                        payload.name,
                                },
                            });

                        if (!auditCreated) {
                            console.error(
                                "State created successfully, but DataLog creation failed."
                            );
                        }
                    } catch (auditError) {
                        console.error(
                            "State created successfully, but audit log failed:",
                            auditError
                        );
                    }

                    toast.success(
                        "State Added Successfully"
                    );

                    // Refresh table
                    await fetchData();

                    // Clear old error if any
                    setError(null);

                    // Clear fields
                    clearForm();

                    setIsAddMode(false);

                    // Close modal
                    setModal(false);
                } else {
                    throw new Error(
                        "Failed to add state"
                    );
                }
            }

            // ========================================================
            // UPDATE STATE
            // ========================================================

            else {
                if (!selectedCustomer?.id) {
                    toast.error(
                        "Invalid state selected"
                    );
                    return;
                }

                const payload = {
                    ...selectedCustomer,
                    name: selectedCustomer.name.trim(),
                };

                const afterData = {
                    name: payload.name,
                };

                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}state/update/${selectedCustomer.id}/`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (
                    response.status === 200 ||
                    response.status === 201
                ) {
                    // ------------------------------------------------
                    // AUDIT LOG
                    // ------------------------------------------------

                    try {
                        const auditCreated =
                            await createAuditLog({
                                action: "state_updated_website",

                                beforeData:
                                    originalAuditData || {},

                                afterData:
                                    afterData,
                            });

                        if (!auditCreated) {
                            console.error(
                                "State updated successfully, but DataLog creation failed."
                            );
                        }
                    } catch (auditError) {
                        console.error(
                            "State updated successfully, but audit log failed:",
                            auditError
                        );
                    }

                    toast.success(
                        "State Updated Successfully"
                    );

                    // Refresh table
                    await fetchData();

                    setError(null);

                    // Clear fields
                    clearForm();

                    setIsAddMode(false);

                    // Close modal
                    setModal(false);
                }
            }
        } catch (error) {
            console.error(
                "State save error:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                (isAddMode
                    ? "Add state failed"
                    : "Update failed")
            );

            setError(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to save state"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddState = () => {
        setIsAddMode(true);
        setSelectedCustomer(null);
        setOriginalAuditData(null);

        setNewState({
            name: "",
        });

        setModal(true);
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}states/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 200) {
                setData(response.data.data || []);
                setError(null);
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
                <Breadcrumbs title="Tables" breadcrumbItem="STATES INFORMATION" />

                {/* Add State Button */}
                <Button color="success" onClick={handleAddState} className="mb-4">
                    Add State
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
                <Modal
                    isOpen={modal}
                    toggle={handleCloseModal}
                    backdrop={isSubmitting ? "static" : true}
                    keyboard={!isSubmitting}
                >
                    <ModalHeader
                        toggle={
                            isSubmitting
                                ? undefined
                                : handleCloseModal
                        }
                    >
                        {isAddMode ? "Add New State" : "Edit State"}
                    </ModalHeader>
                    <ModalBody>
                        <Form>
                            <Label for="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={isAddMode ? newState.name : selectedCustomer?.name || ''}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                            />
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="secondary"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>

                                    {isAddMode
                                        ? "Adding..."
                                        : "Saving..."}
                                </>
                            ) : isAddMode ? (
                                "Add"
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </ModalFooter>
                </Modal>
            </div>
        </div>
    );
};

StateTable.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default StateTable;
