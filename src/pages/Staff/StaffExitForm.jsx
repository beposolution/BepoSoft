import axios from "axios";
import React, { useEffect, useState } from "react";
import {
    Card,
    Col,
    Container,
    Row,
    CardBody,
    CardTitle,
    Label,
    Form,
    Input,
    FormFeedback,
    Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Select from "react-select";

const StaffExitForm = () => {
    document.title = "Staff Exit Form | Beposoft";

    const token = localStorage.getItem("token");

    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const staffOptions = staffList.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const getStaffNameById = (id) => {
        const found = staffList.find((item) => String(item.id) === String(id));
        return found ? found.name : "";
    };

    const writeStaffExitLog = async (employeeId, values) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                {
                    before_data: {
                        status: "Staff Exit Data",
                    },
                    after_data: {
                        action: "Staff Exit Data",
                        employee: values.employee ? Number(values.employee) : null,
                        employee_name: getStaffNameById(values.employee),
                        exit_date: values.exit_date || "",
                        reason: values.reason || "",
                        reason_type: values.reason_type || "",
                        exit_reason_note: values.exit_reason_note || "",
                        asset_responsibility: values.asset_responsibility || "",
                        handover_to: values.handover_to ? Number(values.handover_to) : null,
                        handover_to_name: getStaffNameById(values.handover_to),
                        handover_date: values.handover_date || "",

                        logistics_clearance: !!values.logistics_clearance,
                        logistics_clearance_date: values.logistics_clearance_date || "",
                        logistics_clearance_by: values.logistics_clearance_by
                            ? Number(values.logistics_clearance_by)
                            : null,
                        logistics_clearance_by_name: getStaffNameById(values.logistics_clearance_by),
                        logistics_clearance_note: values.logistics_clearance_note || "",
                        logistics_clearence_signature:
                            values.logistics_clearence_signature?.name || "",

                        finance_clearance: !!values.finance_clearance,
                        finance_clearance_date: values.finance_clearance_date || "",
                        finance_clearance_by: values.finance_clearance_by
                            ? Number(values.finance_clearance_by)
                            : null,
                        finance_clearance_by_name: getStaffNameById(values.finance_clearance_by),
                        finance_clearance_note: values.finance_clearance_note || "",
                        finance_clearance_signature:
                            values.finance_clearance_signature?.name || "",

                        hr_clearance: !!values.hr_clearance,
                        hr_clearance_date: values.hr_clearance_date || "",
                        hr_clearance_by: values.hr_clearance_by
                            ? Number(values.hr_clearance_by)
                            : null,
                        hr_clearance_by_name: getStaffNameById(values.hr_clearance_by),
                        hr_clearance_note: values.hr_clearance_note || "",
                        hr_clearance_signature: values.hr_clearance_signature?.name || "",

                        sales_clearance: !!values.sales_clearance,
                        sales_clearance_date: values.sales_clearance_date || "",
                        sales_clearance_by: values.sales_clearance_by
                            ? Number(values.sales_clearance_by)
                            : null,
                        sales_clearance_by_name: getStaffNameById(values.sales_clearance_by),
                        sales_clearance_note: values.sales_clearance_note || "",
                        sales_clearance_signature:
                            values.sales_clearance_signature?.name || "",

                        it_clearance: !!values.it_clearance,
                        it_clearance_date: values.it_clearance_date || "",
                        it_clearance_by: values.it_clearance_by
                            ? Number(values.it_clearance_by)
                            : null,
                        it_clearance_by_name: getStaffNameById(values.it_clearance_by),
                        it_clearance_note: values.it_clearance_note || "",
                        it_clearance_signature: values.it_clearance_signature?.name || "",

                        employee_signature: values.employee_signature?.name || "",
                        exit_form_date: values.exit_form_date || "",
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (err) {
            console.warn(
                "Staff Exit DataLog failed:",
                err?.response?.data || err.message
            );
        }
    };

    const formik = useFormik({
        initialValues: {
            employee: "",
            exit_date: "",
            reason: "",
            reason_type: "resignation",
            exit_reason_note: "",
            asset_responsibility: "",
            handover_to: "",
            handover_date: "",

            logistics_clearance: false,
            logistics_clearance_date: "",
            logistics_clearance_by: "",
            logistics_clearance_note: "",
            logistics_clearence_signature: "",

            finance_clearance: false,
            finance_clearance_date: "",
            finance_clearance_by: "",
            finance_clearance_note: "",
            finance_clearance_signature: "",

            hr_clearance: false,
            hr_clearance_date: "",
            hr_clearance_by: "",
            hr_clearance_note: "",
            hr_clearance_signature: "",

            sales_clearance: false,
            sales_clearance_date: "",
            sales_clearance_by: "",
            sales_clearance_note: "",
            sales_clearance_signature: "",

            it_clearance: false,
            it_clearance_date: "",
            it_clearance_by: "",
            it_clearance_note: "",
            it_clearance_signature: "",

            employee_signature: "",
            exit_form_date: "",
        },
        validationSchema: Yup.object({
            employee: Yup.string().required("Please select employee"),
            exit_date: Yup.string().required("This field is required"),
            reason_type: Yup.string().required("This field is required"),
            reason: Yup.string().nullable(),
            exit_reason_note: Yup.string().nullable(),
            asset_responsibility: Yup.string().nullable(),
            handover_to: Yup.string().nullable(),
            handover_date: Yup.string().nullable(),
            logistics_clearance_date: Yup.string().nullable(),
            logistics_clearance_by: Yup.string().nullable(),
            logistics_clearance_note: Yup.string().nullable(),
            finance_clearance_date: Yup.string().nullable(),
            finance_clearance_by: Yup.string().nullable(),
            finance_clearance_note: Yup.string().nullable(),
            hr_clearance_date: Yup.string().nullable(),
            hr_clearance_by: Yup.string().nullable(),
            hr_clearance_note: Yup.string().nullable(),
            sales_clearance_date: Yup.string().nullable(),
            sales_clearance_by: Yup.string().nullable(),
            sales_clearance_note: Yup.string().nullable(),
            it_clearance_date: Yup.string().nullable(),
            it_clearance_by: Yup.string().nullable(),
            it_clearance_note: Yup.string().nullable(),
            exit_form_date: Yup.string().nullable(),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                setSubmitting(true);
                setError(null);
                setSuccess(null);

                const formData = new FormData();

                for (let key in values) {
                    if (
                        key === "logistics_clearence_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        key === "finance_clearance_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        key === "hr_clearance_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        key === "sales_clearance_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        key === "it_clearance_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        key === "employee_signature" &&
                        values[key]
                    ) {
                        formData.append(key, values[key]);
                    } else if (
                        values[key] !== "" &&
                        values[key] !== null &&
                        values[key] !== undefined
                    ) {
                        formData.append(key, values[key]);
                    }
                }

                for (let pair of formData.entries()) {
                    console.log(pair[0], pair[1]);
                }

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}employee/exit/add/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 201 || response.status === 200) {
                    await writeStaffExitLog(values.employee, values);

                    setSuccess("Staff exit form submitted successfully");
                    toast.success("Staff exit form submitted successfully!", {
                        position: "top-right",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "colored",
                    });

                    resetForm();
                } else {
                    setError("Failed to submit the form");
                    toast.error("Failed to submit the form!");
                }
            } catch (error) {
                const responseData = error?.response?.data;

                let message = "Something went wrong. Please try again.";

                if (responseData?.errors?.employee) {
                    message = Array.isArray(responseData.errors.employee)
                        ? responseData.errors.employee[0]
                        : responseData.errors.employee;

                    formik.setFieldTouched("employee", true, false);
                    formik.setFieldError("employee", message);
                } else if (responseData?.errors) {
                    const firstErrorKey = Object.keys(responseData.errors)[0];
                    const firstErrorValue = responseData.errors[firstErrorKey];

                    if (Array.isArray(firstErrorValue)) {
                        message = firstErrorValue[0];
                    } else if (typeof firstErrorValue === "string") {
                        message = firstErrorValue;
                    } else {
                        message =
                            responseData?.message ||
                            responseData?.detail ||
                            message;
                    }
                } else {
                    message =
                        responseData?.message ||
                        responseData?.detail ||
                        error.message ||
                        message;
                }

                setError(message);
                setSuccess(null);

                toast.error(message, {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                });
            } finally {
                setSubmitting(false);
            }
        },
    });

    const fetchStaffUsers = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}staffs/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                setStaffList(response.data.data || []);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            setError(error.message || "Failed to fetch staff users");
            toast.error("Failed to fetch staff users");
        }
    };

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    await fetchStaffUsers();
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        } else {
            setError("Token not found");
            setLoading(false);
        }
    }, [token]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="Staff Exit Form" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">Staff Exit Form</CardTitle>

                                    {loading && <p>Loading...</p>}
                                    {error && <p className="text-danger">{error}</p>}
                                    {success && <p className="text-success">{success}</p>}

                                    <Form onSubmit={formik.handleSubmit}>
                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="employee">Employee</Label>
                                                    <Select
                                                        inputId="employee"
                                                        name="employee"
                                                        options={staffOptions}
                                                        placeholder="Select Employee"
                                                        value={staffOptions.find(
                                                            (option) => String(option.value) === String(formik.values.employee)
                                                        ) || null}
                                                        onChange={(selectedOption) => {
                                                            formik.setFieldValue("employee", selectedOption ? selectedOption.value : "");
                                                        }}
                                                        onBlur={() => formik.setFieldTouched("employee", true)}
                                                        isClearable
                                                        isSearchable
                                                        classNamePrefix="react-select"
                                                        className={
                                                            formik.touched.employee && formik.errors.employee ? "is-invalid" : ""
                                                        }
                                                        noOptionsMessage={() => "No employees found"}
                                                    />
                                                    {formik.errors.employee && formik.touched.employee ? (
                                                        <div className="invalid-feedback d-block">{formik.errors.employee}</div>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="exit_date">Exit Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="exit_date"
                                                        id="exit_date"
                                                        value={formik.values.exit_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.exit_date && !!formik.errors.exit_date}
                                                    />
                                                    {formik.errors.exit_date && formik.touched.exit_date ? (
                                                        <FormFeedback>{formik.errors.exit_date}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="reason_type">Reason Type</Label>
                                                    <select
                                                        name="reason_type"
                                                        id="reason_type"
                                                        className={`form-control ${formik.touched.reason_type && formik.errors.reason_type
                                                            ? "is-invalid"
                                                            : ""
                                                            }`}
                                                        value={formik.values.reason_type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="resignation">Resignation</option>
                                                        <option value="termination">Termination</option>
                                                        <option value="absconding">Absconding</option>
                                                    </select>
                                                    {formik.errors.reason_type && formik.touched.reason_type ? (
                                                        <FormFeedback type="invalid">{formik.errors.reason_type}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="reason">Reason</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="reason"
                                                        id="reason"
                                                        placeholder="Enter Reason"
                                                        value={formik.values.reason}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.reason && !!formik.errors.reason}
                                                    />
                                                    {formik.errors.reason && formik.touched.reason ? (
                                                        <FormFeedback>{formik.errors.reason}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="exit_reason_note">Exit Reason Note</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="exit_reason_note"
                                                        id="exit_reason_note"
                                                        placeholder="Enter Exit Reason Note"
                                                        value={formik.values.exit_reason_note}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.exit_reason_note && !!formik.errors.exit_reason_note
                                                        }
                                                    />
                                                    {formik.errors.exit_reason_note && formik.touched.exit_reason_note ? (
                                                        <FormFeedback>{formik.errors.exit_reason_note}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="asset_responsibility">Asset Responsibility</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="asset_responsibility"
                                                        id="asset_responsibility"
                                                        placeholder="Enter Asset Responsibility"
                                                        value={formik.values.asset_responsibility}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.asset_responsibility &&
                                                            !!formik.errors.asset_responsibility
                                                        }
                                                    />
                                                    {formik.errors.asset_responsibility &&
                                                        formik.touched.asset_responsibility ? (
                                                        <FormFeedback>{formik.errors.asset_responsibility}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="handover_to">Handover To</Label>
                                                    <Select
                                                        inputId="handover_to"
                                                        name="handover_to"
                                                        options={staffOptions}
                                                        placeholder="Select Handover Staff"
                                                        value={staffOptions.find(
                                                            (option) => String(option.value) === String(formik.values.handover_to)
                                                        ) || null}
                                                        onChange={(selectedOption) => {
                                                            formik.setFieldValue("handover_to", selectedOption ? selectedOption.value : "");
                                                        }}
                                                        onBlur={() => formik.setFieldTouched("handover_to", true)}
                                                        isClearable
                                                        isSearchable
                                                        classNamePrefix="react-select"
                                                        className={
                                                            formik.touched.handover_to && formik.errors.handover_to ? "is-invalid" : ""
                                                        }
                                                        noOptionsMessage={() => "No staff found"}
                                                    />
                                                    {formik.errors.handover_to && formik.touched.handover_to ? (
                                                        <div className="invalid-feedback d-block">{formik.errors.handover_to}</div>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="handover_date">Handover Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="handover_date"
                                                        id="handover_date"
                                                        value={formik.values.handover_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.handover_date && !!formik.errors.handover_date}
                                                    />
                                                    {formik.errors.handover_date && formik.touched.handover_date ? (
                                                        <FormFeedback>{formik.errors.handover_date}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">Logistics Clearance</CardTitle>
                                                <Row>
                                                    <Col lg={2}>
                                                        <div className="mb-3 mt-4">
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    name="logistics_clearance"
                                                                    id="logistics_clearance"
                                                                    className="form-check-input"
                                                                    checked={formik.values.logistics_clearance}
                                                                    onChange={(e) =>
                                                                        formik.setFieldValue("logistics_clearance", e.target.checked)
                                                                    }
                                                                />
                                                                <Label
                                                                    className="form-check-label"
                                                                    htmlFor="logistics_clearance"
                                                                >
                                                                    Clearance Approved
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="logistics_clearance_date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="logistics_clearance_date"
                                                                id="logistics_clearance_date"
                                                                value={formik.values.logistics_clearance_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="logistics_clearance_by">Approved By</Label>
                                                            <Select
                                                                inputId="logistics_clearance_by"
                                                                name="logistics_clearance_by"
                                                                options={staffOptions}
                                                                placeholder="Select Staff"
                                                                value={
                                                                    staffOptions.find(
                                                                        (option) =>
                                                                            String(option.value) ===
                                                                            String(formik.values.logistics_clearance_by)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption) => {
                                                                    formik.setFieldValue(
                                                                        "logistics_clearance_by",
                                                                        selectedOption ? selectedOption.value : ""
                                                                    );
                                                                }}
                                                                onBlur={() => formik.setFieldTouched("logistics_clearance_by", true)}
                                                                isClearable
                                                                isSearchable
                                                                classNamePrefix="react-select"
                                                                noOptionsMessage={() => "No staff found"}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="logistics_clearence_signature">Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="logistics_clearence_signature"
                                                                id="logistics_clearence_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "logistics_clearence_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="logistics_clearance_note">Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="logistics_clearance_note"
                                                                id="logistics_clearance_note"
                                                                placeholder="Enter Logistics Clearance Note"
                                                                value={formik.values.logistics_clearance_note}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">Finance Clearance</CardTitle>
                                                <Row>
                                                    <Col lg={2}>
                                                        <div className="mb-3 mt-4">
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    name="finance_clearance"
                                                                    id="finance_clearance"
                                                                    className="form-check-input"
                                                                    checked={formik.values.finance_clearance}
                                                                    onChange={(e) =>
                                                                        formik.setFieldValue("finance_clearance", e.target.checked)
                                                                    }
                                                                />
                                                                <Label className="form-check-label" htmlFor="finance_clearance">
                                                                    Clearance Approved
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="finance_clearance_date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="finance_clearance_date"
                                                                id="finance_clearance_date"
                                                                value={formik.values.finance_clearance_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="finance_clearance_by">Approved By</Label>
                                                            <Select
                                                                inputId="finance_clearance_by"
                                                                name="finance_clearance_by"
                                                                options={staffOptions}
                                                                placeholder="Select Staff"
                                                                value={
                                                                    staffOptions.find(
                                                                        (option) =>
                                                                            String(option.value) ===
                                                                            String(formik.values.finance_clearance_by)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption) => {
                                                                    formik.setFieldValue(
                                                                        "finance_clearance_by",
                                                                        selectedOption ? selectedOption.value : ""
                                                                    );
                                                                }}
                                                                onBlur={() => formik.setFieldTouched("finance_clearance_by", true)}
                                                                isClearable
                                                                isSearchable
                                                                classNamePrefix="react-select"
                                                                noOptionsMessage={() => "No staff found"}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="finance_clearance_signature">Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="finance_clearance_signature"
                                                                id="finance_clearance_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "finance_clearance_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="finance_clearance_note">Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="finance_clearance_note"
                                                                id="finance_clearance_note"
                                                                placeholder="Enter Finance Clearance Note"
                                                                value={formik.values.finance_clearance_note}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">HR Clearance</CardTitle>
                                                <Row>
                                                    <Col lg={2}>
                                                        <div className="mb-3 mt-4">
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    name="hr_clearance"
                                                                    id="hr_clearance"
                                                                    className="form-check-input"
                                                                    checked={formik.values.hr_clearance}
                                                                    onChange={(e) =>
                                                                        formik.setFieldValue("hr_clearance", e.target.checked)
                                                                    }
                                                                />
                                                                <Label className="form-check-label" htmlFor="hr_clearance">
                                                                    Clearance Approved
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="hr_clearance_date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="hr_clearance_date"
                                                                id="hr_clearance_date"
                                                                value={formik.values.hr_clearance_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="hr_clearance_by">Approved By</Label>
                                                            <Select
                                                                inputId="hr_clearance_by"
                                                                name="hr_clearance_by"
                                                                options={staffOptions}
                                                                placeholder="Select Staff"
                                                                value={
                                                                    staffOptions.find(
                                                                        (option) =>
                                                                            String(option.value) === String(formik.values.hr_clearance_by)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption) => {
                                                                    formik.setFieldValue(
                                                                        "hr_clearance_by",
                                                                        selectedOption ? selectedOption.value : ""
                                                                    );
                                                                }}
                                                                onBlur={() => formik.setFieldTouched("hr_clearance_by", true)}
                                                                isClearable
                                                                isSearchable
                                                                classNamePrefix="react-select"
                                                                noOptionsMessage={() => "No staff found"}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="hr_clearance_signature">Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="hr_clearance_signature"
                                                                id="hr_clearance_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "hr_clearance_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="hr_clearance_note">Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="hr_clearance_note"
                                                                id="hr_clearance_note"
                                                                placeholder="Enter HR Clearance Note"
                                                                value={formik.values.hr_clearance_note}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">Sales Clearance</CardTitle>
                                                <Row>
                                                    <Col lg={2}>
                                                        <div className="mb-3 mt-4">
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    name="sales_clearance"
                                                                    id="sales_clearance"
                                                                    className="form-check-input"
                                                                    checked={formik.values.sales_clearance}
                                                                    onChange={(e) =>
                                                                        formik.setFieldValue("sales_clearance", e.target.checked)
                                                                    }
                                                                />
                                                                <Label className="form-check-label" htmlFor="sales_clearance">
                                                                    Clearance Approved
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="sales_clearance_date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="sales_clearance_date"
                                                                id="sales_clearance_date"
                                                                value={formik.values.sales_clearance_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="sales_clearance_by">Approved By</Label>
                                                            <Select
                                                                inputId="sales_clearance_by"
                                                                name="sales_clearance_by"
                                                                options={staffOptions}
                                                                placeholder="Select Staff"
                                                                value={
                                                                    staffOptions.find(
                                                                        (option) =>
                                                                            String(option.value) ===
                                                                            String(formik.values.sales_clearance_by)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption) => {
                                                                    formik.setFieldValue(
                                                                        "sales_clearance_by",
                                                                        selectedOption ? selectedOption.value : ""
                                                                    );
                                                                }}
                                                                onBlur={() => formik.setFieldTouched("sales_clearance_by", true)}
                                                                isClearable
                                                                isSearchable
                                                                classNamePrefix="react-select"
                                                                noOptionsMessage={() => "No staff found"}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="sales_clearance_signature">Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="sales_clearance_signature"
                                                                id="sales_clearance_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "sales_clearance_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="sales_clearance_note">Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="sales_clearance_note"
                                                                id="sales_clearance_note"
                                                                placeholder="Enter Sales Clearance Note"
                                                                value={formik.values.sales_clearance_note}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">IT Clearance</CardTitle>
                                                <Row>
                                                    <Col lg={2}>
                                                        <div className="mb-3 mt-4">
                                                            <div className="form-check">
                                                                <Input
                                                                    type="checkbox"
                                                                    name="it_clearance"
                                                                    id="it_clearance"
                                                                    className="form-check-input"
                                                                    checked={formik.values.it_clearance}
                                                                    onChange={(e) =>
                                                                        formik.setFieldValue("it_clearance", e.target.checked)
                                                                    }
                                                                />
                                                                <Label className="form-check-label" htmlFor="it_clearance">
                                                                    Clearance Approved
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="it_clearance_date">Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="it_clearance_date"
                                                                id="it_clearance_date"
                                                                value={formik.values.it_clearance_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={3}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="it_clearance_by">Approved By</Label>
                                                            <Select
                                                                inputId="it_clearance_by"
                                                                name="it_clearance_by"
                                                                options={staffOptions}
                                                                placeholder="Select Staff"
                                                                value={
                                                                    staffOptions.find(
                                                                        (option) =>
                                                                            String(option.value) === String(formik.values.it_clearance_by)
                                                                    ) || null
                                                                }
                                                                onChange={(selectedOption) => {
                                                                    formik.setFieldValue(
                                                                        "it_clearance_by",
                                                                        selectedOption ? selectedOption.value : ""
                                                                    );
                                                                }}
                                                                onBlur={() => formik.setFieldTouched("it_clearance_by", true)}
                                                                isClearable
                                                                isSearchable
                                                                classNamePrefix="react-select"
                                                                noOptionsMessage={() => "No staff found"}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={4}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="it_clearance_signature">Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="it_clearance_signature"
                                                                id="it_clearance_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "it_clearance_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>

                                                <Row>
                                                    <Col lg={12}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="it_clearance_note">Note</Label>
                                                            <Input
                                                                type="textarea"
                                                                name="it_clearance_note"
                                                                id="it_clearance_note"
                                                                placeholder="Enter IT Clearance Note"
                                                                value={formik.values.it_clearance_note}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <Card className="mt-3">
                                            <CardBody>
                                                <CardTitle className="mb-4">Final Confirmation</CardTitle>
                                                <Row>
                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="employee_signature">Employee Signature</Label>
                                                            <Input
                                                                type="file"
                                                                name="employee_signature"
                                                                id="employee_signature"
                                                                onChange={(event) => {
                                                                    formik.setFieldValue(
                                                                        "employee_signature",
                                                                        event.currentTarget.files[0]
                                                                    );
                                                                }}
                                                            />
                                                        </div>
                                                    </Col>

                                                    <Col lg={6}>
                                                        <div className="mb-3">
                                                            <Label htmlFor="exit_form_date">Exit Form Date</Label>
                                                            <Input
                                                                type="date"
                                                                name="exit_form_date"
                                                                id="exit_form_date"
                                                                value={formik.values.exit_form_date}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                invalid={formik.touched.exit_form_date && !!formik.errors.exit_form_date}
                                                            />
                                                            {formik.errors.exit_form_date && formik.touched.exit_form_date ? (
                                                                <FormFeedback>{formik.errors.exit_form_date}</FormFeedback>
                                                            ) : null}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>

                                        <div className="mb-3 mt-4">
                                            <Button type="submit" color="primary" disabled={submitting || formik.isSubmitting}>
                                                {submitting || formik.isSubmitting ? "Submitting..." : "Submit"}
                                            </Button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default StaffExitForm;