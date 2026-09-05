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
import Select from "react-select";

const VehicleKMEntry = () => {
    document.title = "Vehicle KM Entry | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [entries, setEntries] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [viewLoadingId, setViewLoadingId] = useState(null);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedEntryId, setSelectedEntryId] = useState(null);

    const getTodayDate = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const fetchEntries = async () => {
        try {
            setTableLoading(true);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}vehicle/km/entry/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                setEntries(response?.data?.data || []);
            } else {
                setEntries([]);
                throw new Error("Failed to fetch vehicle KM entries");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch vehicle KM entries";

            setPageError(message);
            toast.error(message);
            setEntries([]);
        } finally {
            setTableLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            setVehicleLoading(true);

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
                throw new Error("Failed to fetch vehicle list");
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch vehicle list";

            toast.error(message);
            setVehicles([]);
        } finally {
            setVehicleLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            setPageError("Token not found");
            return;
        }

        const init = async () => {
            setLoading(true);

            await Promise.all([
                fetchEntries(),
                fetchVehicles(),
            ]);

            setLoading(false);
        };

        init();
    }, [token]);

    const vehicleOptions = useMemo(() => {
        return vehicles.map((vehicle) => ({
            value: vehicle.id,
            label: vehicle.registration_number
                ? `${vehicle.name} - ${vehicle.registration_number}`
                : vehicle.name,
        }));
    }, [vehicles]);

    const formik = useFormik({
        initialValues: {
            date: getTodayDate(),
            vehicle: "",
            starting_km: "",
            end_km: "",
            petrol: "",
        },

        validationSchema: Yup.object({
            date: Yup.string().required("Date is required"),

            vehicle: Yup.string().required(
                "Please select a vehicle"
            ),

            starting_km: Yup.number()
                .typeError("Starting KM must be a number")
                .integer("Starting KM must be a whole number")
                .min(0, "Starting KM cannot be negative")
                .required("Starting KM is required"),

            end_km: Yup.number()
                .typeError("End KM must be a number")
                .integer("End KM must be a whole number")
                .min(0, "End KM cannot be negative")
                .required("End KM is required")
                .test(
                    "end-greater-than-start",
                    "End KM cannot be less than Starting KM",
                    function (value) {
                        const { starting_km } = this.parent;

                        if (
                            value === undefined ||
                            value === null ||
                            starting_km === "" ||
                            starting_km === undefined ||
                            starting_km === null
                        ) {
                            return true;
                        }

                        return Number(value) >= Number(starting_km);
                    }
                ),

            petrol: Yup.number()
                .typeError("Petrol must be a number")
                .min(0, "Petrol cannot be negative")
                .required("Petrol is required"),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    date: values.date,
                    vehicle: Number(values.vehicle),
                    starting_km: Number(values.starting_km),
                    end_km: Number(values.end_km),
                    petrol: Number(values.petrol),
                };

                let response;

                if (isEditMode && selectedEntryId) {
                    response = await axios.put(
                        `${baseUrl}vehicle/km/entry/${selectedEntryId}/`,
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
                        `${baseUrl}vehicle/km/entry/`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                }

                if (
                    response.status === 201 ||
                    response.status === 200
                ) {
                    toast.success(
                        isEditMode
                            ? "Vehicle KM entry updated successfully"
                            : "Vehicle KM entry created successfully"
                    );

                    resetForm({
                        values: {
                            date: getTodayDate(),
                            vehicle: "",
                            starting_km: "",
                            end_km: "",
                            petrol: "",
                        },
                    });

                    setIsEditMode(false);
                    setSelectedEntryId(null);

                    await fetchEntries();
                } else {
                    toast.error(
                        isEditMode
                            ? "Failed to update vehicle KM entry"
                            : "Failed to create vehicle KM entry"
                    );
                }
            } catch (error) {
                const responseData = error?.response?.data;
                let message =
                    "Something went wrong. Please try again.";

                if (responseData?.errors) {
                    const firstErrorKey =
                        Object.keys(responseData.errors)[0];

                    const firstErrorValue =
                        responseData.errors[firstErrorKey];

                    if (Array.isArray(firstErrorValue)) {
                        message = firstErrorValue[0];
                    } else if (
                        typeof firstErrorValue === "string"
                    ) {
                        message = firstErrorValue;
                    } else if (
                        typeof firstErrorValue === "object" &&
                        firstErrorValue !== null
                    ) {
                        const nestedKey =
                            Object.keys(firstErrorValue)[0];

                        const nestedValue =
                            firstErrorValue[nestedKey];

                        if (Array.isArray(nestedValue)) {
                            message = nestedValue[0];
                        } else if (
                            typeof nestedValue === "string"
                        ) {
                            message = nestedValue;
                        }
                    }

                    if (
                        firstErrorKey &&
                        [
                            "date",
                            "vehicle",
                            "starting_km",
                            "end_km",
                            "petrol",
                        ].includes(firstErrorKey)
                    ) {
                        formik.setFieldTouched(
                            firstErrorKey,
                            true,
                            false
                        );

                        formik.setFieldError(
                            firstErrorKey,
                            message
                        );
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
        setSelectedEntryId(null);
        setPageError("");

        formik.resetForm({
            values: {
                date: getTodayDate(),
                vehicle: "",
                starting_km: "",
                end_km: "",
                petrol: "",
            },
        });
    };

    const handleViewEntry = async (entryId) => {
        try {
            setViewLoadingId(entryId);
            setPageError("");

            const response = await axios.get(
                `${baseUrl}vehicle/km/entry/${entryId}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 200) {
                const entryData = response?.data?.data;

                formik.setValues({
                    date: entryData?.date
                        ? String(entryData.date)
                        : "",
                    vehicle: entryData?.vehicle
                        ? String(entryData.vehicle)
                        : "",
                    starting_km:
                        entryData?.starting_km !== undefined &&
                        entryData?.starting_km !== null
                            ? String(entryData.starting_km)
                            : "",
                    end_km:
                        entryData?.end_km !== undefined &&
                        entryData?.end_km !== null
                            ? String(entryData.end_km)
                            : "",
                    petrol:
                        entryData?.petrol !== undefined &&
                        entryData?.petrol !== null
                            ? String(entryData.petrol)
                            : "",
                });

                setSelectedEntryId(entryId);
                setIsEditMode(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                toast.success(
                    "Vehicle KM entry details loaded"
                );
            } else {
                throw new Error(
                    "Failed to fetch vehicle KM entry details"
                );
            }
        } catch (error) {
            const message =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Failed to fetch vehicle KM entry details";

            setPageError(message);
            toast.error(message);
        } finally {
            setViewLoadingId(null);
        }
    };

    const usedKmPreview = useMemo(() => {
        const start = Number(formik.values.starting_km);
        const end = Number(formik.values.end_km);

        if (
            formik.values.starting_km === "" ||
            formik.values.end_km === "" ||
            Number.isNaN(start) ||
            Number.isNaN(end)
        ) {
            return 0;
        }

        return Math.max(end - start, 0);
    }, [
        formik.values.starting_km,
        formik.values.end_km,
    ]);

    const filteredEntries = useMemo(() => {
        if (!searchText.trim()) return entries;

        const search = searchText.toLowerCase();

        return entries.filter((item) => {
            const dateText = item?.date
                ? String(item.date).toLowerCase()
                : "";

            const vehicleText = item?.vehicle_name
                ? String(item.vehicle_name).toLowerCase()
                : "";

            const registrationText =
                item?.registration_number
                    ? String(
                          item.registration_number
                      ).toLowerCase()
                    : "";

            const createdByText =
                item?.created_by_name
                    ? String(
                          item.created_by_name
                      ).toLowerCase()
                    : "";

            return (
                dateText.includes(search) ||
                vehicleText.includes(search) ||
                registrationText.includes(search) ||
                createdByText.includes(search)
            );
        });
    }, [entries, searchText]);

    const formatDateTime = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString();
    };

    const formatNumber = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        return Number(value).toLocaleString();
    };

    const formatPetrol = (value) => {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "-";
        }

        const number = Number(value);

        if (Number.isNaN(number)) {
            return value;
        }

        return number.toFixed(2);
    };

    const totalUsedKm = useMemo(() => {
        return entries.reduce(
            (sum, item) =>
                sum + Number(item?.used_km || 0),
            0
        );
    }, [entries]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs
                        title="Vehicle"
                        breadcrumbItem="Vehicle KM Entry"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />

                                        <div className="mt-3">
                                            Loading vehicle KM entry page...
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
                                                ? "Update Vehicle KM Entry"
                                                : "Create Vehicle KM Entry"}
                                        </CardTitle>

                                        {pageError ? (
                                            <div className="alert alert-danger py-2">
                                                {pageError}
                                            </div>
                                        ) : null}

                                        <Form
                                            onSubmit={
                                                formik.handleSubmit
                                            }
                                        >
                                            <div className="mb-3">
                                                <Label htmlFor="date">
                                                    Date
                                                </Label>

                                                <Input
                                                    id="date"
                                                    name="date"
                                                    type="date"
                                                    value={
                                                        formik
                                                            .values
                                                            .date
                                                    }
                                                    onChange={
                                                        formik.handleChange
                                                    }
                                                    onBlur={
                                                        formik.handleBlur
                                                    }
                                                    invalid={
                                                        formik
                                                            .touched
                                                            .date &&
                                                        !!formik
                                                            .errors
                                                            .date
                                                    }
                                                />

                                                {formik.touched
                                                    .date &&
                                                formik.errors
                                                    .date ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .date
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="vehicle">
                                                    Vehicle
                                                </Label>

                                                <Select
                                                    inputId="vehicle"
                                                    name="vehicle"
                                                    options={
                                                        vehicleOptions
                                                    }
                                                    placeholder={
                                                        vehicleLoading
                                                            ? "Loading vehicles..."
                                                            : "Search and select vehicle"
                                                    }
                                                    value={
                                                        vehicleOptions.find(
                                                            (
                                                                option
                                                            ) =>
                                                                String(
                                                                    option.value
                                                                ) ===
                                                                String(
                                                                    formik
                                                                        .values
                                                                        .vehicle
                                                                )
                                                        ) ||
                                                        null
                                                    }
                                                    onChange={(
                                                        selectedOption
                                                    ) => {
                                                        formik.setFieldValue(
                                                            "vehicle",
                                                            selectedOption
                                                                ? String(
                                                                      selectedOption.value
                                                                  )
                                                                : ""
                                                        );
                                                    }}
                                                    onBlur={() =>
                                                        formik.setFieldTouched(
                                                            "vehicle",
                                                            true
                                                        )
                                                    }
                                                    isClearable
                                                    isSearchable
                                                    isDisabled={
                                                        vehicleLoading
                                                    }
                                                    classNamePrefix="react-select"
                                                    className={
                                                        formik
                                                            .touched
                                                            .vehicle &&
                                                        formik
                                                            .errors
                                                            .vehicle
                                                            ? "is-invalid"
                                                            : ""
                                                    }
                                                    noOptionsMessage={() =>
                                                        "No vehicles found"
                                                    }
                                                />

                                                {formik.touched
                                                    .vehicle &&
                                                formik.errors
                                                    .vehicle ? (
                                                    <div className="invalid-feedback d-block">
                                                        {
                                                            formik
                                                                .errors
                                                                .vehicle
                                                        }
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="starting_km">
                                                    Starting KM
                                                </Label>

                                                <Input
                                                    id="starting_km"
                                                    name="starting_km"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="Enter starting KM"
                                                    value={
                                                        formik
                                                            .values
                                                            .starting_km
                                                    }
                                                    onChange={
                                                        formik.handleChange
                                                    }
                                                    onBlur={
                                                        formik.handleBlur
                                                    }
                                                    invalid={
                                                        formik
                                                            .touched
                                                            .starting_km &&
                                                        !!formik
                                                            .errors
                                                            .starting_km
                                                    }
                                                />

                                                {formik.touched
                                                    .starting_km &&
                                                formik.errors
                                                    .starting_km ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .starting_km
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="end_km">
                                                    End KM
                                                </Label>

                                                <Input
                                                    id="end_km"
                                                    name="end_km"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="Enter end KM"
                                                    value={
                                                        formik
                                                            .values
                                                            .end_km
                                                    }
                                                    onChange={
                                                        formik.handleChange
                                                    }
                                                    onBlur={
                                                        formik.handleBlur
                                                    }
                                                    invalid={
                                                        formik
                                                            .touched
                                                            .end_km &&
                                                        !!formik
                                                            .errors
                                                            .end_km
                                                    }
                                                />

                                                {formik.touched
                                                    .end_km &&
                                                formik.errors
                                                    .end_km ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .end_km
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="used_km">
                                                    Used KM
                                                </Label>

                                                <Input
                                                    id="used_km"
                                                    type="number"
                                                    value={
                                                        usedKmPreview
                                                    }
                                                    readOnly
                                                    disabled
                                                />

                                                <small className="text-muted">
                                                    Automatically calculated
                                                    from End KM - Starting KM.
                                                </small>
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="petrol">
                                                    Petrol
                                                </Label>

                                                <Input
                                                    id="petrol"
                                                    name="petrol"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="Enter petrol"
                                                    value={
                                                        formik
                                                            .values
                                                            .petrol
                                                    }
                                                    onChange={
                                                        formik.handleChange
                                                    }
                                                    onBlur={
                                                        formik.handleBlur
                                                    }
                                                    invalid={
                                                        formik
                                                            .touched
                                                            .petrol &&
                                                        !!formik
                                                            .errors
                                                            .petrol
                                                    }
                                                />

                                                {formik.touched
                                                    .petrol &&
                                                formik.errors
                                                    .petrol ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .petrol
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="d-flex gap-2 mt-4 flex-wrap">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={
                                                        submitting
                                                    }
                                                >
                                                    {submitting
                                                        ? isEditMode
                                                            ? "Updating..."
                                                            : "Saving..."
                                                        : isEditMode
                                                        ? "Update Entry"
                                                        : "Create Entry"}
                                                </Button>

                                                <Button
                                                    color="light"
                                                    type="button"
                                                    onClick={
                                                        clearFormAndMode
                                                    }
                                                    disabled={
                                                        submitting
                                                    }
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
                                                Vehicle KM Entry List
                                            </CardTitle>

                                            <div
                                                className="d-flex flex-wrap gap-2"
                                                style={{
                                                    minWidth:
                                                        "280px",
                                                }}
                                            >
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>

                                                    <Input
                                                        type="text"
                                                        placeholder="Search vehicle, registration, date..."
                                                        value={
                                                            searchText
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            setSearchText(
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    />
                                                </InputGroup>

                                                <Button
                                                    color="primary"
                                                    outline
                                                    onClick={
                                                        fetchEntries
                                                    }
                                                    disabled={
                                                        tableLoading
                                                    }
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
                                                            Total Entries
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {
                                                                entries.length
                                                            }
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
                                                                filteredEntries.length
                                                            }
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total Used KM
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {formatNumber(
                                                                totalUsedKm
                                                            )}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>

                                        {tableLoading ? (
                                            <div className="text-center py-5">
                                                <Spinner color="primary" />

                                                <div className="mt-2">
                                                    Loading vehicle KM entries...
                                                </div>
                                            </div>
                                        ) : filteredEntries.length ===
                                          0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No vehicle KM entries found
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
                                                                        "60px",
                                                                }}
                                                            >
                                                                #
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                            >
                                                                Date
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "170px",
                                                                }}
                                                            >
                                                                Vehicle
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "150px",
                                                                }}
                                                            >
                                                                Registration
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                            >
                                                                Starting KM
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "110px",
                                                                }}
                                                            >
                                                                End KM
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "110px",
                                                                }}
                                                            >
                                                                Used KM
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "100px",
                                                                }}
                                                            >
                                                                Petrol
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "140px",
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
                                                                        "100px",
                                                                }}
                                                            >
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {filteredEntries.map(
                                                            (
                                                                item,
                                                                index
                                                            ) => (
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
                                                                        {item.date ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.vehicle_name ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.registration_number ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {formatNumber(
                                                                            item.starting_km
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {formatNumber(
                                                                            item.end_km
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        <strong>
                                                                            {formatNumber(
                                                                                item.used_km
                                                                            )}
                                                                        </strong>
                                                                    </td>

                                                                    <td>
                                                                        {formatPetrol(
                                                                            item.petrol
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {item.created_by_name ||
                                                                            item.created_by ||
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
                                                                                handleViewEntry(
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

export default VehicleKMEntry;
