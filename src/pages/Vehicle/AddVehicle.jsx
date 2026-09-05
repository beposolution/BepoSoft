import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    CardTitle,
    Col,
    Container,
    Row,
    Form,
    Label,
    Input,
    Button,
    FormFeedback,
    Table,
    Spinner,
    InputGroup,
    InputGroupText,
} from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const AddVehicle = () => {
    document.title = "Vehicle Management | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [vehicles, setVehicles] = useState([]);

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState(null);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);

    const fetchVehicles = async () => {
        try {
            setTableLoading(true);
            setPageError("");

            const response = await axios.get(`${baseUrl}vehicles/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 200) {
                setVehicles(response?.data?.data || []);
            } else {
                setVehicles([]);
                throw new Error("Failed to fetch vehicles");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch vehicles";

            setPageError(message);
            toast.error(message);
            setVehicles([]);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setPageError("Token not found");
            return;
        }

        const init = async () => {
            setLoading(true);
            await fetchVehicles();
            setLoading(false);
        };

        init();
    }, [token]);

    const formik = useFormik({
        initialValues: {
            name: "",
            registration_number: "",
        },

        validationSchema: Yup.object({
            name: Yup.string()
                .trim()
                .required("Vehicle name is required"),
            registration_number: Yup.string()
                .trim()
                .nullable(),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    name: values.name.trim(),
                    registration_number: values.registration_number.trim()
                        ? values.registration_number.trim()
                        : null,
                };

                let response;

                if (isEditMode && selectedVehicleId) {
                    response = await axios.put(
                        `${baseUrl}vehicles/${selectedVehicleId}/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                } else {
                    response = await axios.post(
                        `${baseUrl}vehicles/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                if (response.status === 201 || response.status === 200) {
                    toast.success(
                        isEditMode
                            ? "Vehicle updated successfully"
                            : "Vehicle created successfully"
                    );

                    resetForm();
                    setIsEditMode(false);
                    setSelectedVehicleId(null);

                    await fetchVehicles();
                } else {
                    toast.error(
                        isEditMode
                            ? "Failed to update vehicle"
                            : "Failed to create vehicle"
                    );
                }
            } catch (error) {
                const responseData = error?.response?.data;
                let message = "Something went wrong. Please try again.";

                if (responseData?.errors) {
                    const firstErrorKey = Object.keys(responseData.errors)[0];
                    const firstErrorValue = responseData.errors[firstErrorKey];

                    if (Array.isArray(firstErrorValue)) {
                        message = firstErrorValue[0];
                    } else if (typeof firstErrorValue === "string") {
                        message = firstErrorValue;
                    }

                    if (firstErrorKey) {
                        formik.setFieldTouched(firstErrorKey, true, false);
                        formik.setFieldError(firstErrorKey, message);
                    }
                } else {
                    message =
                        responseData?.error ||
                        responseData?.message ||
                        responseData?.detail ||
                        error?.message ||
                        message;
                }

                setPageError(message);
                toast.error(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    const clearFormAndMode = () => {
        setIsEditMode(false);
        setSelectedVehicleId(null);
        setPageError("");
        formik.resetForm();
    };

    const handleViewVehicle = async (vehicleId) => {
        try {
            setViewLoadingId(vehicleId);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}vehicles/${vehicleId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                const vehicleData = response?.data?.data;

                formik.setValues({
                    name: vehicleData?.name
                        ? String(vehicleData.name)
                        : "",
                    registration_number:
                        vehicleData?.registration_number
                            ? String(vehicleData.registration_number)
                            : "",
                });

                setSelectedVehicleId(vehicleId);
                setIsEditMode(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                toast.success("Vehicle details loaded");
            } else {
                throw new Error("Failed to fetch vehicle details");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch vehicle details";

            setPageError(message);
            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const filteredVehicles = useMemo(() => {
        if (!searchText.trim()) return vehicles;

        const search = searchText.toLowerCase();

        return vehicles.filter((item) => {
            const nameText = item?.name
                ? String(item.name).toLowerCase()
                : "";

            const registrationText = item?.registration_number
                ? String(item.registration_number).toLowerCase()
                : "";

            const createdByText = item?.createed_by_name
                ? String(item.createed_by_name).toLowerCase()
                : "";

            return (
                nameText.includes(search) ||
                registrationText.includes(search) ||
                createdByText.includes(search)
            );
        });
    }, [vehicles, searchText]);

    const formatDateTime = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Vehicle"
                        breadcrumbItem="Vehicle Management"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />
                                        <div className="mt-3">
                                            Loading vehicle page...
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    ) : (
                        <Row>
                            <Col xl={4}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <CardTitle className="mb-4">
                                            {isEditMode
                                                ? "Update Vehicle"
                                                : "Create Vehicle"}
                                        </CardTitle>

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        <Form onSubmit={formik.handleSubmit}>
                                            <div className="mb-3">
                                                <Label htmlFor="name">
                                                    Vehicle Name
                                                </Label>

                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="Enter vehicle name"
                                                    value={formik.values.name}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={
                                                        formik.touched.name &&
                                                        !!formik.errors.name
                                                    }
                                                />

                                                {formik.touched.name &&
                                                formik.errors.name ? (
                                                    <FormFeedback>
                                                        {formik.errors.name}
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="registration_number">
                                                    Registration Number
                                                </Label>

                                                <Input
                                                    id="registration_number"
                                                    name="registration_number"
                                                    type="text"
                                                    placeholder="Enter registration number"
                                                    value={
                                                        formik.values
                                                            .registration_number
                                                    }
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={
                                                        formik.touched
                                                            .registration_number &&
                                                        !!formik.errors
                                                            .registration_number
                                                    }
                                                />

                                                {formik.touched
                                                    .registration_number &&
                                                formik.errors
                                                    .registration_number ? (
                                                    <FormFeedback>
                                                        {
                                                            formik.errors
                                                                .registration_number
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="d-flex gap-2 mt-4 flex-wrap">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={submitting}
                                                >
                                                    {submitting
                                                        ? isEditMode
                                                            ? "Updating..."
                                                            : "Saving..."
                                                        : isEditMode
                                                        ? "Update Vehicle"
                                                        : "Create Vehicle"}
                                                </Button>

                                                <Button
                                                    color="light"
                                                    type="button"
                                                    onClick={clearFormAndMode}
                                                    disabled={submitting}
                                                >
                                                    {isEditMode
                                                        ? "Cancel"
                                                        : "Reset"}
                                                </Button>
                                            </div>
                                        </Form>
                                    </CardBody>
                                </Card>
                            </Col>

                            <Col xl={8}>
                                <Card className="shadow-sm">
                                    <CardBody>
                                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
                                            <CardTitle className="mb-0">
                                                Vehicle List
                                            </CardTitle>

                                            <div
                                                className="d-flex flex-wrap gap-2"
                                                style={{ minWidth: "280px" }}
                                            >
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>

                                                    <Input
                                                        type="text"
                                                        placeholder="Search vehicle, registration..."
                                                        value={searchText}
                                                        onChange={(e) =>
                                                            setSearchText(
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </InputGroup>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={fetchVehicles}
                                                    disabled={tableLoading}
                                                >
                                                    {tableLoading
                                                        ? "Refreshing..."
                                                        : "Refresh"}
                                                </Button>
                                            </div>
                                        </div>

                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Vehicles
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {vehicles.length}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Showing Results
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {
                                                                filteredVehicles.length
                                                            }
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Search Status
                                                        </h6>

                                                        <h6 className="mb-0">
                                                            {searchText.trim()
                                                                ? "Filtered"
                                                                : "All Records"}
                                                        </h6>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />

                                                <div className="mt-2">
                                                    Loading vehicles...
                                                </div>
                                            </div>
                                        ) : filteredVehicles.length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No vehicles found
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <Table
                                                    className="table table-bordered align-middle mb-0"
                                                    hover
                                                >
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "70px",
                                                                }}
                                                            >
                                                                #
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "180px",
                                                                }}
                                                            >
                                                                Vehicle Name
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "180px",
                                                                }}
                                                            >
                                                                Registration No.
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "150px",
                                                                }}
                                                            >
                                                                Created By
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "170px",
                                                                }}
                                                            >
                                                                Created At
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "130px",
                                                                }}
                                                            >
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredVehicles.map(
                                                            (item, index) => (
                                                                <tr
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    <td>
                                                                        {index +
                                                                            1}
                                                                    </td>

                                                                    <td>
                                                                        {item.name ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.registration_number ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.createed_by_name ||
                                                                            item.createed_by ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {formatDateTime(
                                                                            item.created_at
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        <Button
                                                                            color="info"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleViewVehicle(
                                                                                    item.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                viewLoadingId ===
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {viewLoadingId ===
                                                                            item.id
                                                                                ? "Loading..."
                                                                                : "View"}
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>

                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AddVehicle;
