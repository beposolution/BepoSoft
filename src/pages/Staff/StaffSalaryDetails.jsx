import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
    Button,
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalHeader,
    Row,
    Spinner,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Breadcrumbs from "../../components/Common/Breadcrumb";

const StaffSalaryDetails = () => {
    document.title = "Staff Salary Details | Beposoft";

    const { id } = useParams();
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    // -------------------------------------------------------------------------
    // SALARY DATA
    // -------------------------------------------------------------------------

    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // -------------------------------------------------------------------------
    // ADD INCREMENT
    // -------------------------------------------------------------------------

    const [incrementModal, setIncrementModal] = useState(false);
    const [incrementYear, setIncrementYear] = useState("");
    const [incrementAmount, setIncrementAmount] = useState("");
    const [incrementRemarks, setIncrementRemarks] = useState("");
    const [incrementSaving, setIncrementSaving] = useState(false);

    // -------------------------------------------------------------------------
    // EDIT INCREMENT
    // -------------------------------------------------------------------------

    const [editIncrementModal, setEditIncrementModal] = useState(false);
    const [selectedIncrement, setSelectedIncrement] = useState(null);

    const [editIncrementYear, setEditIncrementYear] = useState("");
    const [editIncrementAmount, setEditIncrementAmount] = useState("");
    const [editIncrementRemarks, setEditIncrementRemarks] = useState("");

    const [editIncrementSaving, setEditIncrementSaving] = useState(false);

    // -------------------------------------------------------------------------
    // FORMAT CURRENCY
    // -------------------------------------------------------------------------

    const formatCurrency = (value) => {
        const number = Number(value || 0);

        return number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // -------------------------------------------------------------------------
    // FORMAT DATE
    // -------------------------------------------------------------------------

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // -------------------------------------------------------------------------
    // FETCH STAFF SALARY DETAILS
    // -------------------------------------------------------------------------

    const fetchSalaryDetails = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staff/salary/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        staff: id,
                    },
                }
            );

            const salaryList = response?.data?.data || [];

            if (
                Array.isArray(salaryList) &&
                salaryList.length > 0
            ) {
                setSalaryData(salaryList[0]);
            } else {
                setSalaryData(null);
            }
        } catch (err) {
            console.error(
                "Salary fetch error:",
                err?.response?.data || err.message
            );

            const message =
                err?.response?.data?.message ||
                "Failed to fetch salary details.";

            setError(message);
            setSalaryData(null);

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // INITIAL LOAD
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (token && id) {
            fetchSalaryDetails();
        }
    }, [token, id]);

    // -------------------------------------------------------------------------
    // INCREMENT ARRAY
    // -------------------------------------------------------------------------

    const increments =
        Array.isArray(salaryData?.increments)
            ? salaryData.increments
            : [];

    // -------------------------------------------------------------------------
    // TOTAL INCREMENT AMOUNT
    // -------------------------------------------------------------------------

    const totalIncrementAmount = increments.reduce(
        (total, increment) => {
            return (
                total +
                Number(
                    increment?.increment_amount || 0
                )
            );
        },
        0
    );

    // -------------------------------------------------------------------------
    // LATEST INCREMENT YEAR
    // -------------------------------------------------------------------------

    const latestIncrementYear =
        increments.length > 0
            ? increments.reduce(
                (latest, increment) => {
                    const year = Number(
                        increment?.year || 0
                    );

                    return year > latest
                        ? year
                        : latest;
                },
                0
            )
            : null;

    // -------------------------------------------------------------------------
    // OPEN ADD INCREMENT MODAL
    // -------------------------------------------------------------------------

    const openAddIncrementModal = () => {
        if (!salaryData?.id) {
            toast.error(
                "Salary record not found."
            );
            return;
        }

        setIncrementYear(
            String(new Date().getFullYear())
        );

        setIncrementAmount("");
        setIncrementRemarks("");

        setIncrementModal(true);
    };

    // -------------------------------------------------------------------------
    // CLOSE ADD INCREMENT MODAL
    // -------------------------------------------------------------------------

    const closeAddIncrementModal = () => {
        if (incrementSaving) {
            return;
        }

        setIncrementModal(false);
        setIncrementYear("");
        setIncrementAmount("");
        setIncrementRemarks("");
    };

    // -------------------------------------------------------------------------
    // ADD SALARY INCREMENT
    // -------------------------------------------------------------------------

    const addSalaryIncrement = async () => {
        try {
            if (!salaryData?.id) {
                toast.error(
                    "Salary record not found."
                );
                return;
            }

            if (
                incrementYear === "" ||
                incrementYear === null ||
                incrementYear === undefined
            ) {
                toast.error(
                    "Please enter increment year."
                );
                return;
            }

            if (
                incrementAmount === "" ||
                incrementAmount === null ||
                incrementAmount === undefined
            ) {
                toast.error(
                    "Please enter increment amount."
                );
                return;
            }

            const year = Number(
                incrementYear
            );

            const amount = Number(
                incrementAmount
            );

            if (
                !Number.isInteger(year) ||
                year <= 0
            ) {
                toast.error(
                    "Please enter a valid increment year."
                );
                return;
            }

            if (
                Number.isNaN(amount) ||
                amount <= 0
            ) {
                toast.error(
                    "Increment amount must be greater than zero."
                );
                return;
            }

            const yearAlreadyExists =
                increments.some(
                    (increment) =>
                        Number(increment.year) ===
                        year
                );

            if (yearAlreadyExists) {
                toast.error(
                    `Increment for ${year} already exists.`
                );
                return;
            }

            setIncrementSaving(true);

            await axios.put(
                `${import.meta.env.VITE_APP_KEY}staff/salary/update/${salaryData.id}/`,
                {
                    year: year,
                    increment_amount: amount,
                    remarks:
                        incrementRemarks.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            toast.success(
                "Salary increment added successfully."
            );

            setIncrementModal(false);
            setIncrementYear("");
            setIncrementAmount("");
            setIncrementRemarks("");

            await fetchSalaryDetails();
        } catch (err) {
            console.error(
                "Add increment error:",
                err?.response?.data ||
                err.message
            );

            const backendMessage =
                err?.response?.data?.message;

            const backendErrors =
                err?.response?.data?.errors;

            let message =
                backendMessage ||
                "Failed to add salary increment.";

            if (
                backendErrors &&
                typeof backendErrors ===
                    "string"
            ) {
                message = backendErrors;
            }

            toast.error(message);
        } finally {
            setIncrementSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // OPEN EDIT INCREMENT MODAL
    // -------------------------------------------------------------------------

    const openEditIncrementModal = (
        increment
    ) => {
        if (!increment?.id) {
            toast.error(
                "Increment record not found."
            );
            return;
        }

        setSelectedIncrement(
            increment
        );

        setEditIncrementYear(
            increment.year !== null &&
            increment.year !== undefined
                ? String(increment.year)
                : ""
        );

        setEditIncrementAmount(
            increment.increment_amount !==
                null &&
            increment.increment_amount !==
                undefined
                ? String(
                    increment.increment_amount
                )
                : ""
        );

        setEditIncrementRemarks(
            increment.remarks || ""
        );

        setEditIncrementModal(true);
    };

    // -------------------------------------------------------------------------
    // CLOSE EDIT INCREMENT MODAL
    // -------------------------------------------------------------------------

    const closeEditIncrementModal = () => {
        if (editIncrementSaving) {
            return;
        }

        setEditIncrementModal(false);
        setSelectedIncrement(null);
        setEditIncrementYear("");
        setEditIncrementAmount("");
        setEditIncrementRemarks("");
    };

    // -------------------------------------------------------------------------
    // UPDATE SALARY INCREMENT
    // -------------------------------------------------------------------------

    const updateSalaryIncrement = async () => {
        try {
            if (!selectedIncrement?.id) {
                toast.error(
                    "Increment record not found."
                );
                return;
            }

            if (
                editIncrementYear === "" ||
                editIncrementYear === null ||
                editIncrementYear ===
                    undefined
            ) {
                toast.error(
                    "Please enter increment year."
                );
                return;
            }

            if (
                editIncrementAmount === "" ||
                editIncrementAmount === null ||
                editIncrementAmount ===
                    undefined
            ) {
                toast.error(
                    "Please enter increment amount."
                );
                return;
            }

            const year = Number(
                editIncrementYear
            );

            const amount = Number(
                editIncrementAmount
            );

            if (
                !Number.isInteger(year) ||
                year <= 0
            ) {
                toast.error(
                    "Please enter a valid increment year."
                );
                return;
            }

            if (
                Number.isNaN(amount) ||
                amount <= 0
            ) {
                toast.error(
                    "Increment amount must be greater than zero."
                );
                return;
            }

            const duplicateYear =
                increments.some(
                    (increment) =>
                        Number(increment.year) ===
                            year &&
                        Number(increment.id) !==
                            Number(
                                selectedIncrement.id
                            )
                );

            if (duplicateYear) {
                toast.error(
                    `Increment for ${year} already exists.`
                );
                return;
            }

            setEditIncrementSaving(true);

            await axios.put(
                `${import.meta.env.VITE_APP_KEY}staff/salary/increment/edit/${selectedIncrement.id}/`,
                {
                    year: year,
                    increment_amount: amount,
                    remarks:
                        editIncrementRemarks.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/json",
                    },
                }
            );

            toast.success(
                "Salary increment updated successfully."
            );

            setEditIncrementModal(false);
            setSelectedIncrement(null);
            setEditIncrementYear("");
            setEditIncrementAmount("");
            setEditIncrementRemarks("");

            await fetchSalaryDetails();
        } catch (err) {
            console.error(
                "Update increment error:",
                err?.response?.data ||
                err.message
            );

            const backendMessage =
                err?.response?.data?.message;

            const backendErrors =
                err?.response?.data?.errors;

            let message =
                backendMessage ||
                "Failed to update salary increment.";

            if (
                backendErrors &&
                typeof backendErrors ===
                    "string"
            ) {
                message = backendErrors;
            }

            toast.error(message);
        } finally {
            setEditIncrementSaving(false);
        }
    };

    // -------------------------------------------------------------------------
    // ADD INCREMENT NEW SALARY PREVIEW
    // -------------------------------------------------------------------------

    const addIncrementNewSalary =
        Number(
            salaryData?.salary || 0
        ) +
        Number(
            incrementAmount || 0
        );

    // -------------------------------------------------------------------------
    // EDIT INCREMENT NEW SALARY PREVIEW
    // -------------------------------------------------------------------------

    const editIncrementNewSalary =
        Number(
            selectedIncrement?.previous_salary ||
            0
        ) +
        Number(
            editIncrementAmount || 0
        );

    // -------------------------------------------------------------------------
    // UI
    // -------------------------------------------------------------------------

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Staff"
                        breadcrumbItem="Salary Details"
                    />

                    <ToastContainer />

                    {/* ----------------------------------------------------- */}
                    {/* BACK BUTTON */}
                    {/* ----------------------------------------------------- */}

                    <div className="mb-3">
                        <Button
                            type="button"
                            color="secondary"
                            onClick={() =>
                                navigate(-1)
                            }
                        >
                            Back
                        </Button>
                    </div>

                    {/* ----------------------------------------------------- */}
                    {/* LOADING */}
                    {/* ----------------------------------------------------- */}

                    {loading && (
                        <div
                            className="d-flex justify-content-center align-items-center"
                            style={{
                                minHeight: "300px",
                            }}
                        >
                            <Spinner
                                color="primary"
                            />

                            <span className="ms-2">
                                Loading salary
                                details...
                            </span>
                        </div>
                    )}

                    {/* ----------------------------------------------------- */}
                    {/* ERROR */}
                    {/* ----------------------------------------------------- */}

                    {!loading &&
                        error && (
                            <div
                                className="alert alert-danger"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                    {/* ----------------------------------------------------- */}
                    {/* NO SALARY */}
                    {/* ----------------------------------------------------- */}

                    {!loading &&
                        !error &&
                        !salaryData && (
                            <Card>
                                <CardBody>
                                    <div className="text-center py-5">
                                        <h5>
                                            No Salary
                                            Details Found
                                        </h5>

                                        <p className="text-muted mb-0">
                                            Salary has
                                            not been
                                            added for
                                            this staff.
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        )}

                    {/* ----------------------------------------------------- */}
                    {/* SALARY DETAILS */}
                    {/* ----------------------------------------------------- */}

                    {!loading &&
                        !error &&
                        salaryData && (
                            <>
                                {/* ========================================= */}
                                {/* STAFF DETAILS */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            Staff Details
                                        </CardTitle>

                                        <Row>
                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Staff
                                                    Name
                                                </div>

                                                <strong>
                                                    {salaryData.staff_name ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                           
                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Staff ID
                                                </div>

                                                <strong>
                                                    {salaryData.staff_id_number ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Department
                                                </div>

                                                <strong>
                                                    {salaryData.department_name ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                            <Col
                                                md={6}
                                                lg={3}
                                                className="mb-3"
                                            >
                                                <div className="text-muted">
                                                    Designation
                                                </div>

                                                <strong>
                                                    {salaryData.designation ||
                                                        "-"}
                                                </strong>
                                            </Col>

                                           
                                        </Row>
                                    </CardBody>
                                </Card>

                                {/* ========================================= */}
                                {/* CURRENT SALARY */}
                                {/* ========================================= */}

                                <Card className="mb-4">
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                            <div>
                                                <CardTitle className="mb-2">
                                                    Current
                                                    Salary
                                                </CardTitle>

                                                <div
                                                    style={{
                                                        fontSize:
                                                            "32px",
                                                        fontWeight:
                                                            "700",
                                                    }}
                                                >
                                                    ₹
                                                    {formatCurrency(
                                                        salaryData.salary
                                                    )}
                                                </div>

                                                <div className="text-muted mt-2">
                                                    Current
                                                    salary
                                                    after all
                                                    applicable
                                                    increments.
                                                </div>
                                            </div>

                                            <Button
                                                type="button"
                                                color="primary"
                                                onClick={
                                                    openAddIncrementModal
                                                }
                                            >
                                                Add
                                                Increment
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>

                                {/* ========================================= */}
                                {/* SUMMARY */}
                                {/* ========================================= */}

                                <Row className="mb-4">
                                    <Col
                                        md={4}
                                        className="mb-3 mb-md-0"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Increments
                                                </div>

                                                <h3 className="mb-0">
                                                    {
                                                        increments.length
                                                    }
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col
                                        md={4}
                                        className="mb-3 mb-md-0"
                                    >
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Total
                                                    Increment
                                                    Amount
                                                </div>

                                                <h3 className="mb-0">
                                                    ₹
                                                    {formatCurrency(
                                                        totalIncrementAmount
                                                    )}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col md={4}>
                                        <Card className="h-100">
                                            <CardBody>
                                                <div className="text-muted mb-2">
                                                    Latest
                                                    Increment
                                                    Year
                                                </div>

                                                <h3 className="mb-0">
                                                    {latestIncrementYear ||
                                                        "-"}
                                                </h3>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>

                                {/* ========================================= */}
                                {/* INCREMENT HISTORY */}
                                {/* ========================================= */}

                                <Card>
                                    <CardBody>
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                                            <CardTitle className="mb-0">
                                                Salary
                                                Increment
                                                History
                                            </CardTitle>

                                            <Button
                                                type="button"
                                                color="primary"
                                                size="sm"
                                                onClick={
                                                    openAddIncrementModal
                                                }
                                            >
                                                Add
                                                Increment
                                            </Button>
                                        </div>

                                        {increments.length ===
                                        0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-muted mb-0">
                                                    No salary
                                                    increments
                                                    found.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-hover align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th>
                                                                SL
                                                            </th>

                                                            <th>
                                                                Year
                                                            </th>

                                                            <th>
                                                                Previous
                                                                Salary
                                                            </th>

                                                            <th>
                                                                Increment
                                                                Amount
                                                            </th>

                                                            <th>
                                                                New
                                                                Salary
                                                            </th>

                                                            <th>
                                                                Remarks
                                                            </th>

                                                            <th>
                                                                Added
                                                                By
                                                            </th>

                                                            <th>
                                                                Created
                                                                Date
                                                            </th>

                                                            <th>
                                                                Updated
                                                                Date
                                                            </th>

                                                            <th>
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {increments.map(
                                                            (
                                                                increment,
                                                                index
                                                            ) => (
                                                                <tr
                                                                    key={
                                                                        increment.id
                                                                    }
                                                                >
                                                                    <td>
                                                                        {index +
                                                                            1}
                                                                    </td>

                                                                    <td>
                                                                        <strong>
                                                                            {increment.year ||
                                                                                "-"}
                                                                        </strong>
                                                                    </td>

                                                                    <td>
                                                                        ₹
                                                                        {formatCurrency(
                                                                            increment.previous_salary
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        ₹
                                                                        {formatCurrency(
                                                                            increment.increment_amount
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        <strong>
                                                                            ₹
                                                                            {formatCurrency(
                                                                                increment.new_salary
                                                                            )}
                                                                        </strong>
                                                                    </td>

                                                                    <td>
                                                                        {increment.remarks ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {increment.created_by_name ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {formatDate(
                                                                            increment.created_at
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {formatDate(
                                                                            increment.updated_at
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        <Button
                                                                            type="button"
                                                                            color="warning"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                openEditIncrementModal(
                                                                                    increment
                                                                                )
                                                                            }
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </>
                        )}

                    {/* ----------------------------------------------------- */}
                    {/* ADD INCREMENT MODAL */}
                    {/* ----------------------------------------------------- */}

                    <Modal
                        isOpen={incrementModal}
                        toggle={
                            closeAddIncrementModal
                        }
                        centered
                    >
                        <ModalHeader
                            toggle={
                                closeAddIncrementModal
                            }
                        >
                            Add Salary Increment
                        </ModalHeader>

                        <ModalBody>
                            <div className="mb-3">
                                <Label>
                                    Current Salary
                                </Label>

                                <Input
                                    type="text"
                                    value={`₹${formatCurrency(
                                        salaryData?.salary
                                    )}`}
                                    disabled
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Increment Year
                                </Label>

                                <Input
                                    type="number"
                                    value={
                                        incrementYear
                                    }
                                    placeholder="Enter Increment Year"
                                    onChange={(
                                        e
                                    ) =>
                                        setIncrementYear(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        incrementSaving
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Increment
                                    Amount
                                </Label>

                                <Input
                                    type="number"
                                    value={
                                        incrementAmount
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter Increment Amount"
                                    onChange={(
                                        e
                                    ) =>
                                        setIncrementAmount(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        incrementSaving
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Remarks
                                </Label>

                                <Input
                                    type="textarea"
                                    value={
                                        incrementRemarks
                                    }
                                    placeholder="Enter Remarks"
                                    onChange={(
                                        e
                                    ) =>
                                        setIncrementRemarks(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        incrementSaving
                                    }
                                />
                            </div>

                            {incrementAmount !==
                                "" &&
                                Number(
                                    incrementAmount
                                ) > 0 && (
                                    <div className="alert alert-info">
                                        <div>
                                            Current
                                            Salary:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    salaryData?.salary
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            Increment:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    incrementAmount
                                                )}
                                            </strong>
                                        </div>

                                        <hr />

                                        <div>
                                            New Salary:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    addIncrementNewSalary
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                )}

                            <div className="d-flex justify-content-end gap-2">
                                <Button
                                    type="button"
                                    color="secondary"
                                    onClick={
                                        closeAddIncrementModal
                                    }
                                    disabled={
                                        incrementSaving
                                    }
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    color="primary"
                                    onClick={
                                        addSalaryIncrement
                                    }
                                    disabled={
                                        incrementSaving
                                    }
                                >
                                    {incrementSaving
                                        ? "Adding..."
                                        : "Add Increment"}
                                </Button>
                            </div>
                        </ModalBody>
                    </Modal>

                    {/* ----------------------------------------------------- */}
                    {/* EDIT INCREMENT MODAL */}
                    {/* ----------------------------------------------------- */}

                    <Modal
                        isOpen={
                            editIncrementModal
                        }
                        toggle={
                            closeEditIncrementModal
                        }
                        centered
                    >
                        <ModalHeader
                            toggle={
                                closeEditIncrementModal
                            }
                        >
                            Edit Salary Increment
                        </ModalHeader>

                        <ModalBody>
                            <div className="mb-3">
                                <Label>
                                    Previous Salary
                                </Label>

                                <Input
                                    type="text"
                                    value={`₹${formatCurrency(
                                        selectedIncrement?.previous_salary
                                    )}`}
                                    disabled
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Increment Year
                                </Label>

                                <Input
                                    type="number"
                                    value={
                                        editIncrementYear
                                    }
                                    placeholder="Enter Increment Year"
                                    onChange={(
                                        e
                                    ) =>
                                        setEditIncrementYear(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        editIncrementSaving
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Increment
                                    Amount
                                </Label>

                                <Input
                                    type="number"
                                    value={
                                        editIncrementAmount
                                    }
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter Increment Amount"
                                    onChange={(
                                        e
                                    ) =>
                                        setEditIncrementAmount(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        editIncrementSaving
                                    }
                                />
                            </div>

                            <div className="mb-3">
                                <Label>
                                    Remarks
                                </Label>

                                <Input
                                    type="textarea"
                                    value={
                                        editIncrementRemarks
                                    }
                                    placeholder="Enter Remarks"
                                    onChange={(
                                        e
                                    ) =>
                                        setEditIncrementRemarks(
                                            e.target
                                                .value
                                        )
                                    }
                                    disabled={
                                        editIncrementSaving
                                    }
                                />
                            </div>

                            {editIncrementAmount !==
                                "" &&
                                Number(
                                    editIncrementAmount
                                ) > 0 && (
                                    <div className="alert alert-info">
                                        <div>
                                            Previous
                                            Salary:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    selectedIncrement?.previous_salary
                                                )}
                                            </strong>
                                        </div>

                                        <div>
                                            Increment:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    editIncrementAmount
                                                )}
                                            </strong>
                                        </div>

                                        <hr />

                                        <div>
                                            New Salary:
                                            <strong className="ms-2">
                                                ₹
                                                {formatCurrency(
                                                    editIncrementNewSalary
                                                )}
                                            </strong>
                                        </div>
                                    </div>
                                )}

                            <div className="d-flex justify-content-end gap-2">
                                <Button
                                    type="button"
                                    color="secondary"
                                    onClick={
                                        closeEditIncrementModal
                                    }
                                    disabled={
                                        editIncrementSaving
                                    }
                                >
                                    Cancel
                                </Button>

                                <Button
                                    type="button"
                                    color="primary"
                                    onClick={
                                        updateSalaryIncrement
                                    }
                                    disabled={
                                        editIncrementSaving
                                    }
                                >
                                    {editIncrementSaving
                                        ? "Updating..."
                                        : "Update Increment"}
                                </Button>
                            </div>
                        </ModalBody>
                    </Modal>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default StaffSalaryDetails;