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

const VehicleServiceHistory = () => {
    document.title = "Vehicle Service History | Beposoft";

    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_APP_KEY;

    const [vehicleGroups, setVehicleGroups] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    const [pagination, setPagination] = useState({
        count: 0,
        next: null,
        previous: null,
    });

    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [vehicleLoading, setVehicleLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editLoadingId, setEditLoadingId] = useState(null);

    const [pageError, setPageError] = useState("");
    const [searchText, setSearchText] = useState("");

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState(null);

    const getTodayDate = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const getApiErrorMessage = (error, fallback) => {
        const responseData = error?.response?.data;

        if (responseData?.errors) {
            if (typeof responseData.errors === "string") {
                return responseData.errors;
            }

            if (typeof responseData.errors === "object") {
                const firstKey = Object.keys(responseData.errors)[0];
                const firstValue = responseData.errors[firstKey];

                if (Array.isArray(firstValue)) {
                    return firstValue[0];
                }

                if (typeof firstValue === "string") {
                    return firstValue;
                }
            }
        }

        return (
            responseData?.error ||
            responseData?.message ||
            responseData?.detail ||
            error?.message ||
            fallback
        );
    };

    const normalizeListResponse = (responseData) => {
        
        const groups =
            responseData?.results?.data ||
            responseData?.data?.data ||
            responseData?.data ||
            responseData?.results ||
            [];

        return Array.isArray(groups) ? groups : [];
    };

    const fetchServiceHistory = async (
        url = `${baseUrl}vehicle/service/history/`
    ) => {
        try {
            setTableLoading(true);
            setPageError("");

            console.log(
                "[Vehicle Service History][GET LIST] Request URL:",
                url
            );

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log(
                "[Vehicle Service History][GET LIST] Status:",
                response.status
            );
            console.log(
                "[Vehicle Service History][GET LIST] Response:",
                response.data
            );

            if (response.status === 200) {
                const groups = normalizeListResponse(response.data);

                console.log(
                    "[Vehicle Service History][GET LIST] Parsed vehicle groups:",
                    groups
                );

                setVehicleGroups(groups);

                setPagination({
                    count:
                        response?.data?.count ??
                        response?.data?.pagination?.count ??
                        groups.length,
                    next:
                        response?.data?.next ??
                        response?.data?.pagination?.next ??
                        null,
                    previous:
                        response?.data?.previous ??
                        response?.data?.pagination?.previous ??
                        null,
                });
            } else {
                throw new Error(
                    "Failed to fetch vehicle service history"
                );
            }
        } catch (error) {
            console.error(
                "[Vehicle Service History][GET LIST] Error:",
                error
            );
            console.error(
                "[Vehicle Service History][GET LIST] Error response:",
                error?.response?.data
            );

            const message = getApiErrorMessage(
                error,
                "Failed to fetch vehicle service history"
            );

            setPageError(message);
            toast.error(message);
            setVehicleGroups([]);
            setPagination({
                count: 0,
                next: null,
                previous: null,
            });
        } finally {
            setTableLoading(false);
        }
    };

    const fetchVehicles = async () => {
        try {
            setVehicleLoading(true);

            console.log(
                "[Vehicle Service History][GET VEHICLES] Request URL:",
                `${baseUrl}vehicles/`
            );

            const response = await axios.get(`${baseUrl}vehicles/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log(
                "[Vehicle Service History][GET VEHICLES] Status:",
                response.status
            );
            console.log(
                "[Vehicle Service History][GET VEHICLES] Response:",
                response.data
            );

            if (response.status === 200) {
                const list =
                    response?.data?.data ||
                    response?.data?.results?.data ||
                    response?.data?.results ||
                    [];

                setVehicles(Array.isArray(list) ? list : []);
            } else {
                throw new Error("Failed to fetch vehicle list");
            }
        } catch (error) {
            console.error(
                "[Vehicle Service History][GET VEHICLES] Error:",
                error
            );
            console.error(
                "[Vehicle Service History][GET VEHICLES] Error response:",
                error?.response?.data
            );

            const message = getApiErrorMessage(
                error,
                "Failed to fetch vehicle list"
            );

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
                fetchServiceHistory(),
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
            vehicle: "",
            service_date: getTodayDate(),
            service_type: "",
            service_center: "",
            odometer_km: "",
            service_cost: "",
            description: "",
            next_service_date: "",
        },

        validationSchema: Yup.object({
            vehicle: Yup.string().required(
                "Please select a vehicle"
            ),

            service_date: Yup.string()
                .nullable()
                .test(
                    "valid-service-date",
                    "Please enter a valid service date",
                    (value) => !value || !Number.isNaN(Date.parse(value))
                ),

            service_type: Yup.string()
                .nullable()
                .max(
                    200,
                    "Service type cannot exceed 200 characters"
                ),

            service_center: Yup.string()
                .nullable()
                .max(
                    200,
                    "Service center cannot exceed 200 characters"
                ),

            odometer_km: Yup.number()
                .nullable()
                .transform((value, originalValue) =>
                    originalValue === "" ? null : value
                )
                .typeError("Odometer KM must be a number")
                .integer("Odometer KM must be a whole number")
                .min(0, "Odometer KM cannot be negative"),

            service_cost: Yup.number()
                .nullable()
                .transform((value, originalValue) =>
                    originalValue === "" ? null : value
                )
                .typeError("Service cost must be a number")
                .min(0, "Service cost cannot be negative"),

            description: Yup.string().nullable(),

            next_service_date: Yup.string()
                .nullable()
                .test(
                    "valid-next-service-date",
                    "Please enter a valid next service date",
                    (value) => !value || !Number.isNaN(Date.parse(value))
                ),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setPageError("");

                const payload = {
                    vehicle: Number(values.vehicle),
                    service_date: values.service_date || null,
                    service_type:
                        values.service_type.trim() || null,
                    service_center:
                        values.service_center.trim() || null,
                    odometer_km:
                        values.odometer_km === ""
                            ? null
                            : Number(values.odometer_km),
                    service_cost:
                        values.service_cost === ""
                            ? null
                            : Number(values.service_cost),
                    description:
                        values.description.trim() || null,
                    next_service_date:
                        values.next_service_date || null,
                };

                console.log(
                    isEditMode
                        ? "[Vehicle Service History][PUT] Payload:"
                        : "[Vehicle Service History][POST] Payload:",
                    payload
                );

                let response;

                if (isEditMode && selectedServiceId) {
                    const url = `${baseUrl}vehicle/service/history/edit/${selectedServiceId}/`;

                    console.log(
                        "[Vehicle Service History][PUT] Request URL:",
                        url
                    );

                    response = await axios.put(url, payload, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    console.log(
                        "[Vehicle Service History][PUT] Status:",
                        response.status
                    );
                    console.log(
                        "[Vehicle Service History][PUT] Response:",
                        response.data
                    );
                } else {
                    const url = `${baseUrl}vehicle/service/history/`;

                    console.log(
                        "[Vehicle Service History][POST] Request URL:",
                        url
                    );

                    response = await axios.post(url, payload, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    });

                    console.log(
                        "[Vehicle Service History][POST] Status:",
                        response.status
                    );
                    console.log(
                        "[Vehicle Service History][POST] Response:",
                        response.data
                    );
                }

                if (
                    response.status === 201 ||
                    response.status === 200
                ) {
                    toast.success(
                        isEditMode
                            ? "Vehicle service history updated successfully"
                            : "Vehicle service history created successfully"
                    );

                    resetForm({
                        values: {
                            vehicle: "",
                            service_date: getTodayDate(),
                            service_type: "",
                            service_center: "",
                            odometer_km: "",
                            service_cost: "",
                            description: "",
                            next_service_date: "",
                        },
                    });

                    setIsEditMode(false);
                    setSelectedServiceId(null);

                    await fetchServiceHistory();
                } else {
                    throw new Error(
                        isEditMode
                            ? "Failed to update vehicle service history"
                            : "Failed to create vehicle service history"
                    );
                }
            } catch (error) {
                console.error(
                    isEditMode
                        ? "[Vehicle Service History][PUT] Error:"
                        : "[Vehicle Service History][POST] Error:",
                    error
                );
                console.error(
                    "[Vehicle Service History][SAVE] Error response:",
                    error?.response?.data
                );

                const responseData = error?.response?.data;

                let message = getApiErrorMessage(
                    error,
                    "Something went wrong. Please try again."
                );

                if (
                    responseData?.errors &&
                    typeof responseData.errors === "object"
                ) {
                    const fieldNames = [
                        "vehicle",
                        "service_date",
                        "service_type",
                        "service_center",
                        "odometer_km",
                        "service_cost",
                        "description",
                        "next_service_date",
                    ];

                    fieldNames.forEach((fieldName) => {
                        if (responseData.errors[fieldName]) {
                            const fieldError =
                                responseData.errors[fieldName];

                            const fieldMessage = Array.isArray(
                                fieldError
                            )
                                ? fieldError[0]
                                : String(fieldError);

                            formik.setFieldTouched(
                                fieldName,
                                true,
                                false
                            );

                            formik.setFieldError(
                                fieldName,
                                fieldMessage
                            );
                        }
                    });
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
        setSelectedServiceId(null);
        setPageError("");

        formik.resetForm({
            values: {
                vehicle: "",
                service_date: getTodayDate(),
                service_type: "",
                service_center: "",
                odometer_km: "",
                service_cost: "",
                description: "",
                next_service_date: "",
            },
        });
    };

    const handleEditService = async (serviceId) => {
        if (!serviceId) {
            toast.error("Invalid service history ID");
            return;
        }

        try {
            setEditLoadingId(serviceId);
            setPageError("");

            const url = `${baseUrl}vehicle/service/history/edit/${serviceId}/`;

            console.log(
                "[Vehicle Service History][GET DETAIL] Service ID:",
                serviceId
            );
            console.log(
                "[Vehicle Service History][GET DETAIL] Request URL:",
                url
            );

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log(
                "[Vehicle Service History][GET DETAIL] Status:",
                response.status
            );
            console.log(
                "[Vehicle Service History][GET DETAIL] Response:",
                response.data
            );

            if (response.status === 200) {
                const serviceData =
                    response?.data?.data || response?.data;

                console.log(
                    "[Vehicle Service History][GET DETAIL] Parsed service data:",
                    serviceData
                );

                if (!serviceData?.id) {
                    throw new Error(
                        "Service history detail response does not contain an ID"
                    );
                }

                formik.setValues({
                    vehicle:
                        serviceData?.vehicle !== undefined &&
                        serviceData?.vehicle !== null
                            ? String(serviceData.vehicle)
                            : "",
                    service_date:
                        serviceData?.service_date || "",
                    service_type:
                        serviceData?.service_type || "",
                    service_center:
                        serviceData?.service_center || "",
                    odometer_km:
                        serviceData?.odometer_km !== undefined &&
                        serviceData?.odometer_km !== null
                            ? String(serviceData.odometer_km)
                            : "",
                    service_cost:
                        serviceData?.service_cost !== undefined &&
                        serviceData?.service_cost !== null
                            ? String(serviceData.service_cost)
                            : "",
                    description:
                        serviceData?.description || "",
                    next_service_date:
                        serviceData?.next_service_date || "",
                });

                setSelectedServiceId(serviceData.id);
                setIsEditMode(true);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });

                toast.success(
                    "Vehicle service history details loaded"
                );
            } else {
                throw new Error(
                    "Failed to fetch vehicle service history details"
                );
            }
        } catch (error) {
            console.error(
                "[Vehicle Service History][GET DETAIL] Error:",
                error
            );
            console.error(
                "[Vehicle Service History][GET DETAIL] Error response:",
                error?.response?.data
            );

            const message = getApiErrorMessage(
                error,
                "Failed to fetch vehicle service history details"
            );

            setPageError(message);
            toast.error(message);
        } finally {
            setEditLoadingId(null);
        }
    };

    const serviceRows = useMemo(() => {
        const rows = [];

        vehicleGroups.forEach((group) => {
            const vehicle = group?.vehicle || {};
            const serviceHistory = Array.isArray(
                group?.service_history
            )
                ? group.service_history
                : [];

            serviceHistory.forEach((service) => {
                rows.push({
                    ...service,

                    vehicle:
                        service?.vehicle ??
                        vehicle?.id ??
                        null,

                    vehicle_name:
                        service?.vehicle_name ||
                        vehicle?.name ||
                        "-",

                    registration_number:
                        service?.registration_number ||
                        vehicle?.registration_number ||
                        "-",

                    vehicle_model:
                        service?.vehicle_model ||
                        vehicle?.model ||
                        "-",
                });
            });
        });

        return rows;
    }, [vehicleGroups]);

    const filteredRows = useMemo(() => {
        if (!searchText.trim()) {
            return serviceRows;
        }

        const search = searchText.trim().toLowerCase();

        return serviceRows.filter((item) => {
            const values = [
                item?.vehicle_name,
                item?.registration_number,
                item?.vehicle_model,
                item?.service_date,
                item?.service_type,
                item?.service_center,
                item?.odometer_km,
                item?.service_cost,
                item?.description,
                item?.next_service_date,
                item?.created_by_name,
            ];

            return values.some((value) =>
                value !== null &&
                value !== undefined
                    ? String(value)
                          .toLowerCase()
                          .includes(search)
                    : false
            );
        });
    }, [serviceRows, searchText]);

    const totalServices = useMemo(() => {
        return vehicleGroups.reduce((sum, group) => {
            const total = Number(
                group?.summary?.total_services ?? 0
            );

            return sum + (Number.isNaN(total) ? 0 : total);
        }, 0);
    }, [vehicleGroups]);

    const totalServiceCost = useMemo(() => {
        return vehicleGroups.reduce((sum, group) => {
            const cost = Number(
                group?.summary?.total_service_cost ?? 0
            );

            return sum + (Number.isNaN(cost) ? 0 : cost);
        }, 0);
    }, [vehicleGroups]);

    const formatNumber = (value) => {
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

        return number.toLocaleString();
    };

    const formatCurrency = (value) => {
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

        return `₹${number.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

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
                        breadcrumbItem="Vehicle Service History"
                    />

                    {loading ? (
                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody className="text-center py-5">
                                        <Spinner color="primary" />

                                        <div className="mt-3">
                                            Loading vehicle service
                                            history page...
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
                                                ? "Update Vehicle Service"
                                                : "Add Vehicle Service"}
                                        </CardTitle>

                                        {isEditMode &&
                                            selectedServiceId && (
                                                <div className="alert alert-info py-2">
                                                    Editing Service ID:{" "}
                                                    <strong>
                                                        {
                                                            selectedServiceId
                                                        }
                                                    </strong>
                                                </div>
                                            )}

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
                                                        ) || null
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
                                                <Label htmlFor="service_date">
                                                    Service Date
                                                </Label>

                                                <Input
                                                    id="service_date"
                                                    name="service_date"
                                                    type="date"
                                                    value={
                                                        formik
                                                            .values
                                                            .service_date
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
                                                            .service_date &&
                                                        !!formik
                                                            .errors
                                                            .service_date
                                                    }
                                                />

                                                {formik.touched
                                                    .service_date &&
                                                formik.errors
                                                    .service_date ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .service_date
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="service_type">
                                                    Service Type
                                                </Label>

                                                <Input
                                                    id="service_type"
                                                    name="service_type"
                                                    type="text"
                                                    maxLength={200}
                                                    placeholder="Enter service type"
                                                    value={
                                                        formik
                                                            .values
                                                            .service_type
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
                                                            .service_type &&
                                                        !!formik
                                                            .errors
                                                            .service_type
                                                    }
                                                />

                                                {formik.touched
                                                    .service_type &&
                                                formik.errors
                                                    .service_type ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .service_type
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="service_center">
                                                    Service Center
                                                </Label>

                                                <Input
                                                    id="service_center"
                                                    name="service_center"
                                                    type="text"
                                                    maxLength={200}
                                                    placeholder="Enter service center"
                                                    value={
                                                        formik
                                                            .values
                                                            .service_center
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
                                                            .service_center &&
                                                        !!formik
                                                            .errors
                                                            .service_center
                                                    }
                                                />

                                                {formik.touched
                                                    .service_center &&
                                                formik.errors
                                                    .service_center ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .service_center
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="odometer_km">
                                                    Odometer KM
                                                </Label>

                                                <Input
                                                    id="odometer_km"
                                                    name="odometer_km"
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="Enter odometer KM"
                                                    value={
                                                        formik
                                                            .values
                                                            .odometer_km
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
                                                            .odometer_km &&
                                                        !!formik
                                                            .errors
                                                            .odometer_km
                                                    }
                                                />

                                                {formik.touched
                                                    .odometer_km &&
                                                formik.errors
                                                    .odometer_km ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .odometer_km
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="service_cost">
                                                    Service Cost
                                                </Label>

                                                <InputGroup>
                                                    <InputGroupText>
                                                        ₹
                                                    </InputGroupText>

                                                    <Input
                                                        id="service_cost"
                                                        name="service_cost"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        placeholder="Enter service cost"
                                                        value={
                                                            formik
                                                                .values
                                                                .service_cost
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
                                                                .service_cost &&
                                                            !!formik
                                                                .errors
                                                                .service_cost
                                                        }
                                                    />

                                                    {formik.touched
                                                        .service_cost &&
                                                    formik.errors
                                                        .service_cost ? (
                                                        <FormFeedback>
                                                            {
                                                                formik
                                                                    .errors
                                                                    .service_cost
                                                            }
                                                        </FormFeedback>
                                                    ) : null}
                                                </InputGroup>
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="description">
                                                    Description
                                                </Label>

                                                <Input
                                                    id="description"
                                                    name="description"
                                                    type="textarea"
                                                    rows="4"
                                                    placeholder="Enter service description"
                                                    value={
                                                        formik
                                                            .values
                                                            .description
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
                                                            .description &&
                                                        !!formik
                                                            .errors
                                                            .description
                                                    }
                                                />

                                                {formik.touched
                                                    .description &&
                                                formik.errors
                                                    .description ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .description
                                                        }
                                                    </FormFeedback>
                                                ) : null}
                                            </div>

                                            <div className="mb-3">
                                                <Label htmlFor="next_service_date">
                                                    Next Service Date
                                                </Label>

                                                <Input
                                                    id="next_service_date"
                                                    name="next_service_date"
                                                    type="date"
                                                    value={
                                                        formik
                                                            .values
                                                            .next_service_date
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
                                                            .next_service_date &&
                                                        !!formik
                                                            .errors
                                                            .next_service_date
                                                    }
                                                />

                                                {formik.touched
                                                    .next_service_date &&
                                                formik.errors
                                                    .next_service_date ? (
                                                    <FormFeedback>
                                                        {
                                                            formik
                                                                .errors
                                                                .next_service_date
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
                                                          ? "Update Service"
                                                          : "Add Service"}
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
                                                Vehicle Service
                                                History
                                            </CardTitle>

                                            <div
                                                className="d-flex flex-wrap gap-2"
                                                style={{
                                                    minWidth:
                                                        "300px",
                                                }}
                                            >
                                                <InputGroup>
                                                    <InputGroupText>
                                                        <i className="bx bx-search" />
                                                    </InputGroupText>

                                                    <Input
                                                        type="text"
                                                        placeholder="Search vehicle, service, center..."
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
                                                    onClick={() =>
                                                        fetchServiceHistory()
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

                                        <Row className="mb-3 g-3">
                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0 h-100">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Vehicles
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {
                                                                pagination.count
                                                            }
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0 h-100">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total
                                                            Services
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {formatNumber(
                                                                totalServices
                                                            )}
                                                        </h4>
                                                    </CardBody>
                                                </Card>
                                            </Col>

                                            <Col md={4}>
                                                <Card className="border shadow-none mb-0 h-100">
                                                    <CardBody className="py-3">
                                                        <h6 className="text-muted mb-1">
                                                            Total
                                                            Service Cost
                                                        </h6>

                                                        <h4 className="mb-0">
                                                            {formatCurrency(
                                                                totalServiceCost
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
                                                    Loading vehicle
                                                    service history...
                                                </div>
                                            </div>
                                        ) : filteredRows.length ===
                                          0 ? (
                                            <div className="text-center py-5 text-muted">
                                                No vehicle service
                                                history found
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
                                                                        "150px",
                                                                }}
                                                            >
                                                                Vehicle
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "140px",
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
                                                                Model
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "120px",
                                                                }}
                                                            >
                                                                Service
                                                                Date
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "150px",
                                                                }}
                                                            >
                                                                Service
                                                                Type
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "160px",
                                                                }}
                                                            >
                                                                Service
                                                                Center
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "125px",
                                                                }}
                                                            >
                                                                Odometer
                                                                KM
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "125px",
                                                                }}
                                                            >
                                                                Service
                                                                Cost
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "220px",
                                                                }}
                                                            >
                                                                Description
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "140px",
                                                                }}
                                                            >
                                                                Next
                                                                Service
                                                                Date
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "140px",
                                                                }}
                                                            >
                                                                Created
                                                                By
                                                            </th>

                                                            <th
                                                                style={{
                                                                    minWidth:
                                                                        "170px",
                                                                }}
                                                            >
                                                                Created
                                                                At
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
                                                        {filteredRows.map(
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
                                                                        {item.vehicle_name ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.registration_number ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.vehicle_model ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.service_date ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.service_type ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {item.service_center ||
                                                                            "-"}
                                                                    </td>

                                                                    <td>
                                                                        {formatNumber(
                                                                            item.odometer_km
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        {formatCurrency(
                                                                            item.service_cost
                                                                        )}
                                                                    </td>

                                                                    <td>
                                                                        <div
                                                                            style={{
                                                                                minWidth:
                                                                                    "200px",
                                                                                maxWidth:
                                                                                    "280px",
                                                                                whiteSpace:
                                                                                    "normal",
                                                                                wordBreak:
                                                                                    "break-word",
                                                                            }}
                                                                        >
                                                                            {item.description ||
                                                                                "-"}
                                                                        </div>
                                                                    </td>

                                                                    <td>
                                                                        {item.next_service_date ||
                                                                            "-"}
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
                                                                                handleEditService(
                                                                                    item.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                editLoadingId ===
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {editLoadingId ===
                                                                            item.id
                                                                                ? "Loading..."
                                                                                : "Edit"}
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        )}

                                        {!tableLoading &&
                                            pagination.count > 0 && (
                                                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                                                    <div className="text-muted">
                                                        Total
                                                        Vehicles:{" "}
                                                        {
                                                            pagination.count
                                                        }
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            color="primary"
                                                            outline
                                                            size="sm"
                                                            disabled={
                                                                !pagination.previous ||
                                                                tableLoading
                                                            }
                                                            onClick={() =>
                                                                fetchServiceHistory(
                                                                    pagination.previous
                                                                )
                                                            }
                                                        >
                                                            Previous
                                                        </Button>

                                                        <Button
                                                            color="primary"
                                                            outline
                                                            size="sm"
                                                            disabled={
                                                                !pagination.next ||
                                                                tableLoading
                                                            }
                                                            onClick={() =>
                                                                fetchServiceHistory(
                                                                    pagination.next
                                                                )
                                                            }
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
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

export default VehicleServiceHistory;
