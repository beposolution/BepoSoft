import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Label, Form } from "reactstrap";
import { FaEdit, FaTrash } from 'react-icons/fa';
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';
import { createAuditLog } from "../../services/auditService";

const CategoryTable = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [originalCustomer, setOriginalCustomer] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false); // state to differentiate between add and edit
    const [newState, setNewState] = useState({
        category_name: ""
    });
    const token = localStorage.getItem('token');
    const [role, setRole] = useState(null);
    const canEdit = ["ADMIN", "CEO", "COO", "HR"].includes(role);

    const toggleModal = () => setModal(!modal);

    useEffect(() => {
        const role = localStorage.getItem("active");
        setRole(role);
    }, []);

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
                accessorKey: 'category_name',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    <div style={{ textAlign: 'center' }}>{row.original.category_name}</div> // Center alignment for Name
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
        [canEdit],
    );

    const handleEdit = (customer) => {
        setSelectedCustomer({ ...customer });
        setOriginalCustomer({ ...customer });
        setIsAddMode(false);
        toggleModal();
    };

    // const handleDelete = async (id) => {
    //     // Optimistically remove the state from the UI
    //     const originalData = [...data];
    //     setData(data.filter(customer => customer.id !== id));

    //     try {
    //         await axios.delete(`${import.meta.env.VITE_APP_IMAGE}/update/delete/assetcategory/${id}`, {
    //             headers: { 'Authorization': `Bearer ${token}` }
    //         });
    //     } catch (error) {
    //         setError(error.message || "Failed to delete customer");
    //         setData(originalData); // Revert the UI if deletion fails
    //     }
    // };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        if (isAddMode) {
            setNewState((prev) => ({ ...prev, [name]: value }));
        } else {
            setSelectedCustomer((prev) => ({ ...prev, [name]: value }));
        }
    };

    const createCategoryAddLog = async (categoryData) => {
        try {
            const auditCreated = await createAuditLog({
                action: "asset_category_created_website",

                beforeData: {},

                afterData: {
                    id: categoryData?.id ?? null,
                    category_name:
                        categoryData?.category_name ??
                        newState.category_name ??
                        "",
                },
            });

            if (!auditCreated) {
                console.error(
                    "Asset Category created successfully, but DataLog creation failed."
                );
                return false;
            }

            return true;

        } catch (error) {
            console.error(
                "Asset Category create DataLog error:",
                error
            );

            return false;
        }
    };

    const createCategoryUpdateLog = async (
        beforeCategory,
        afterCategory
    ) => {
        try {
            const auditCreated = await createAuditLog({
                action: "asset_category_updated_website",

                beforeData: {
                    id: beforeCategory?.id ?? null,
                    category_name:
                        beforeCategory?.category_name ?? "",
                },

                afterData: {
                    id:
                        afterCategory?.id ??
                        beforeCategory?.id ??
                        null,

                    category_name:
                        afterCategory?.category_name ??
                        beforeCategory?.category_name ??
                        "",
                },
            });

            if (!auditCreated) {
                console.error(
                    "Asset Category updated successfully, but DataLog creation failed."
                );
                return false;
            }

            return true;

        } catch (error) {
            console.error(
                "Asset Category update DataLog error:",
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
                    `${import.meta.env.VITE_APP_IMAGE}/apis/add/assetcategory/`,
                    newState,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                // Preserve submitted category name if backend
                // does not return the complete category object
                const createdCategory = {
                    ...newState,
                    ...(response?.data || {}),

                    id:
                        response?.data?.id ??
                        null,

                    category_name:
                        response?.data?.category_name ??
                        newState.category_name,
                };

                try {
                    await createCategoryAddLog(
                        createdCategory
                    );
                } catch (auditError) {
                    console.error(
                        "Asset Category created, but DataLog failed:",
                        auditError
                    );
                }

                setData((prevData) => [
                    ...prevData,
                    createdCategory
                ]);

                toggleModal();

            } else {

                const response = await axios.put(
                    `${import.meta.env.VITE_APP_IMAGE}/apis/update/delete/assetcategory/${selectedCustomer.id}/`,
                    selectedCustomer,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                // Preserve the edited frontend value if backend
                // doesn't return category_name
                const updatedCategory = {
                    ...selectedCustomer,
                    ...(response?.data || {}),

                    id:
                        response?.data?.id ??
                        selectedCustomer.id,

                    category_name:
                        response?.data?.category_name ??
                        selectedCustomer.category_name,
                };

                try {
                    await createCategoryUpdateLog(
                        originalCustomer,
                        updatedCategory
                    );
                } catch (auditError) {
                    console.error(
                        "Asset Category updated, but DataLog failed:",
                        auditError
                    );
                }

                setData((prevData) =>
                    prevData.map((customer) =>
                        customer.id === selectedCustomer.id
                            ? updatedCategory
                            : customer
                    )
                );

                toggleModal();
            }

        } catch (error) {

            console.error(
                isAddMode
                    ? "Failed to add Asset Category:"
                    : "Failed to update Asset Category:",
                error
            );

            setError(
                error?.response?.data?.message ||
                error?.message ||
                (
                    isAddMode
                        ? "Failed to add Asset Category"
                        : "Failed to update Asset Category"
                )
            );

        } finally {

            // Always stop button loading
            setIsSubmitting(false);
        }
    };

    const handleAddState = () => {
        setIsAddMode(true);
        setNewState({ category_name: "" });
        toggleModal();
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/assetcategory/`, { headers: { 'Authorization': `Bearer ${token}` } });
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

    document.title = "States | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Category Information" />

                {/* Add State Button */}
                <Button color="success" onClick={handleAddState} className="mb-4">
                    Add Category
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
                        {isAddMode ? "Add New State" : "Edit State"}
                    </ModalHeader>
                    <ModalBody>
                        <Form>
                            <Label for="name">Name</Label>
                            <Input
                                id="name"
                                name="category_name"
                                value={isAddMode ? newState.category_name : selectedCustomer?.category_name || ''}
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

                                    {isAddMode
                                        ? "Creating..."
                                        : "Saving..."
                                    }
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

CategoryTable.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default CategoryTable;
