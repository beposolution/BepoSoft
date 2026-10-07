import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Form } from "reactstrap";
import { FaEdit, FaTrash } from 'react-icons/fa';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';
import { createAuditLog } from "../../services/auditService";

const AddExpanseModal = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [originalCustomer, setOriginalCustomer] = useState(null);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false); // state to differentiate between add and edit
    const [newState, setNewState] = useState({ name: "" });
    const token = localStorage.getItem('token');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [role, setRole] = useState(null);

    const canEdit = ["ADMIN", "CEO", "COO", "HR"].includes(role);

    useEffect(() => {
        const activeRole = localStorage.getItem("active");
        setRole(activeRole);
    }, []);

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
            ...(canEdit
                ? [
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
                ]
                : []),
        ],
        [canEdit]
    );

    const handleEdit = (customer) => {
        setSelectedCustomer({ ...customer });
        setOriginalCustomer({ ...customer });
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

    const createExpenseTypeAddLog = async (expenseData) => {
        try {
            const auditCreated = await createAuditLog({
                action: "expense_type_created_website",

                beforeData: {},

                afterData: {
                    id: expenseData?.id ?? null,
                    name: expenseData?.name ?? newState.name ?? "",
                },
            });

            if (!auditCreated) {
                console.error(
                    "Expense Type created successfully, but DataLog creation failed."
                );
                return false;
            }

            return true;

        } catch (error) {
            console.error(
                "Expense Type create DataLog error:",
                error
            );

            return false;
        }
    };

    const createExpenseTypeUpdateLog = async (
        beforeExpense,
        afterExpense
    ) => {
        try {
            const auditCreated = await createAuditLog({
                action: "expense_type_updated_website",

                beforeData: {
                    id: beforeExpense?.id ?? null,
                    name: beforeExpense?.name ?? "",
                },

                afterData: {
                    id: afterExpense?.id ?? beforeExpense?.id ?? null,
                    name: afterExpense?.name ?? beforeExpense?.name ?? "",
                },
            });

            if (!auditCreated) {
                console.error(
                    "Expense Type updated successfully, but DataLog creation failed."
                );
                return false;
            }

            return true;

        } catch (error) {
            console.error(
                "Expense Type update DataLog error:",
                error
            );

            return false;
        }
    };

    const handleSubmit = async () => {

        // Prevent double click
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {

            if (isAddMode) {

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`,
                    newState,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const createdExpense = response?.data ?? newState;


                try {
                    await createExpenseTypeAddLog(
                        createdExpense
                    );
                } catch (auditError) {
                    console.error(
                        "Expense Type created, but DataLog failed:",
                        auditError
                    );
                }

                setData((prevData) => [
                    ...prevData,
                    {
                        ...response.data,
                        name: response.data.name
                    }
                ]);

                toggleModal();

            } else {

                const response = await axios.put(
                    `${import.meta.env.VITE_APP_IMAGE}/apis/purpose/update/${selectedCustomer.id}/`,
                    selectedCustomer,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                const updatedExpense = {
                    ...selectedCustomer,
                    ...(response?.data || {}),
                    id: response?.data?.id ?? selectedCustomer.id,
                    name: response?.data?.name ?? selectedCustomer.name,
                };

                try {
                    await createExpenseTypeUpdateLog(
                        originalCustomer,
                        updatedExpense
                    );
                } catch (auditError) {
                    console.error(
                        "Expense Type updated, but DataLog failed:",
                        auditError
                    );
                }

                // update

                setData((prevData) =>
                    prevData.map((customer) =>
                        customer.id === selectedCustomer.id
                            ? {
                                ...customer,
                                ...selectedCustomer,
                                ...(response?.data || {}),
                                name:
                                    response?.data?.name ??
                                    selectedCustomer.name,
                            }
                            : customer
                    )
                );

                toggleModal();
            }

        } catch (error) {

            console.error(
                isAddMode
                    ? "Failed to add expense type:"
                    : "Failed to update expense type:",
                error
            );

            setError(
                error?.response?.data?.message ||
                error?.message ||
                (
                    isAddMode
                        ? "Failed to add expense type"
                        : "Failed to update expense type"
                )
            );

        } finally {

            // Always stop loading
            setIsSubmitting(false);
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
                        <Button
                            color="secondary"
                            onClick={toggleModal}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="d-flex align-items-center justify-content-center"
                            style={{ minWidth: "100px" }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>

                                    {isAddMode ? "Creating..." : "Saving..."}
                                </>
                            ) : (
                                isAddMode ? "Add" : "Save"
                            )}
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
