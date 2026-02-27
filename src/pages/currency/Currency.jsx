import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Label,
    Form,
} from "reactstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Currency = () => {
    const [data, setData] = useState([]);
    const [country, setCountry] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState(null);
    const [modal, setModal] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        currency: "",
        country: "",
    });

    const token = localStorage.getItem("token");
    const toggleModal = () => {
        setModal(!modal);

        if (modal) {
            // Reset when closing
            setFormData({
                currency: "",
                country: "",
            });
            setSelectedCurrency(null);
        }
    };

    const fetchData = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}currency/add/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setData(response.data.data);
            } else {
                throw new Error("Failed to fetch currencies");
            }
        } catch (error) {
            setError(error.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };


    const fetchCountry = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}country/codes/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setCountry(response.data.data);
                console.log("Countries fetched", response.data.data);
            }
        } catch (error) {
            console.log("State fetch error", error);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
            fetchCountry();
        }
    }, [token]);


    const columns = useMemo(
        () => [
            {
                header: () => <div style={{ textAlign: "center" }}>ID</div>,
                accessorKey: "id",
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    <div style={{ textAlign: "center" }}>{row.index + 1}</div>
                ),
            },
            {
                header: "Currency",
                accessorKey: "currency",
                cell: ({ row }) => (
                    <div style={{ textAlign: "center" }}>
                        {row.original.currency}
                    </div>
                ),
            },
            {
                header: "Country",
                accessorKey: "country_name",
                cell: ({ row }) => (
                    <div style={{ textAlign: "center" }}>
                        {row.original.country_name || "-"}
                    </div>
                ),
            },
            {
                header: () => <div style={{ textAlign: "center" }}>EDIT</div>,
                accessorKey: "editActions",
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                        <button
                            className="btn btn-primary d-flex align-items-center"
                            style={{ height: "30px", padding: "0 10px" }}
                            onClick={() => handleEdit(row.original)}
                        >
                            <FaEdit style={{ marginRight: "5px" }} />
                            Edit
                        </button>
                    </div>
                ),
            },
        ],
        [data]
    );

    const handleEdit = (item) => {
        setSelectedCurrency(item);
        setIsAddMode(false);

        setFormData({
            currency: item.currency || "",
            country: item.country || "",
        });

        toggleModal();
    };


    const handleAddCurrency = () => {
        setIsAddMode(true);
        setSelectedCurrency(null);

        setFormData({
            currency: "",
            country: "",
        });

        toggleModal();
    };


    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        // Prevent double click
        if (isSubmitting) return;

        // Validation
        if (!formData.currency.trim()) {
            toast.error("Currency required");
            return;
        }

        if (!formData.country) {
            toast.error("Country required");
            return;
        }

        try {
            setIsSubmitting(true);

            if (isAddMode) {
                // ADD CURRENCY
                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}currency/add/`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 201 || response.status === 200) {
                    toast.success("Currency Added Successfully");

                    await fetchData();

                    setFormData({
                        currency: "",
                        country: "",
                    });

                    toggleModal();
                }
            } else {
                // UPDATE CURRENCY
                const response = await axios.put(
                    `${import.meta.env.VITE_APP_KEY}currency/edit/${selectedCurrency.id}/`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    toast.success("Currency Updated Successfully");

                    await fetchData();
                    toggleModal();
                }
            }
        } catch (error) {
            const msg =
                error.response?.data?.message ||
                JSON.stringify(error.response?.data?.errors) ||
                error.message;

            toast.error(msg);
            setError(msg);
            setError(error.message || "Failed to save currency");
        } finally {
            setIsSubmitting(false);
        }
    };

    document.title = "Currency | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="CURRENCY INFORMATION" />

                <Button color="success" onClick={handleAddCurrency} className="m-1">
                    Add Currency
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
                        SearchPlaceholder="Search by Currency..."
                        pagination="pagination"
                        paginationWrapper="dataTables_paginate paging_simple_numbers"
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                )}

                <Modal isOpen={modal} toggle={toggleModal}>
                    <ModalHeader toggle={toggleModal}>
                        {isAddMode ? "Add Currency" : "Edit Currency"}
                    </ModalHeader>

                    <ModalBody>
                        <Form>
                            <Label>Currency</Label>
                            <Input
                                name="currency"
                                value={formData.currency}
                                onChange={handleInputChange}
                            />

                            <Label className="mt-3">Select Country</Label>
                            <Input
                                type="select"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Country</option>
                                {country.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.country_name} ({item.country_code})
                                    </option>
                                ))}
                            </Input>
                        </Form>
                    </ModalBody>

                    <ModalFooter>
                        <Button color="secondary" onClick={toggleModal}>
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    Saving...
                                </>
                            ) : isAddMode ? "Add" : "Save"}
                        </Button>

                    </ModalFooter>
                </Modal>
            </div>
            <ToastContainer />
        </div>
    );
};

export default Currency;
