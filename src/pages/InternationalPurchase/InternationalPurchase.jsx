
import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import {
    Card,
    Col,
    Container,
    Table,
    Button,
    Row,
    CardBody,
    CardTitle,
    Label,
    Form,
    Input,
    FormFeedback,
    Spinner,
    Alert,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InternationalPurchase = () => {
    document.title = "International Purchase | Beposoft";

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_APP_KEY;

    const productId = useRef(1);

    const [companies, setCompanies] = useState([]);
    const [countryCodes, setCountryCodes] = useState([]);
    const [countryLoading, setCountryLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [createdInvoice, setCreatedInvoice] = useState("");

    const getToday = () => {
        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            today.getDate()
        ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const createEmptyProduct = () => ({
        localId: productId.current++,
        product_name: "",
        color: "",
        size: "",
        total_pcs: "",
        unit_price: "",
        total_price: "0.00",
        image: null,
        imagePreview: "",
        note: "",
    });

    const [products, setProducts] = useState(
        () => [createEmptyProduct()]
    );

    // ==========================================
    // FETCH COMPANY LIST
    // ==========================================

    const fetchCompanies = async () => {
        setLoading(true);
        setError("");

        try {
            console.log(
                "Fetching companies:",
                `${BASE_URL}company/data/`
            );

            const response = await axios.get(
                `${BASE_URL}company/data/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log(
                "Company API response:",
                response.data
            );

            const companyList =
                response.data?.data ??
                response.data?.results ??
                response.data ??
                [];

            if (!Array.isArray(companyList)) {
                throw new Error(
                    "Invalid company API response"
                );
            }

            setCompanies(companyList);

        } catch (err) {
            console.error(
                "Company API error:",
                err.response?.data || err.message
            );

            setError("Failed to load companies.");
            toast.error("Failed to load companies.");

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FETCH COUNTRY CODES
    // ==========================================

    const fetchCountryCodes = async () => {
        setCountryLoading(true);

        try {
            console.log(
                "Fetching country codes:",
                `${BASE_URL}country/codes/`
            );

            const response = await axios.get(
                `${BASE_URL}country/codes/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("Country API status:", response.status);
            console.log("Country API response:", response.data);

            if (
                response.data.status === "success" &&
                Array.isArray(response.data.data)
            ) {
                setCountryCodes(response.data.data);

                console.log(
                    "Country codes loaded:",
                    response.data.data
                );
            } else {
                setCountryCodes([]);
                toast.error("Failed to fetch country codes.");
            }

        } catch (error) {
            console.error(
                "Country API error:",
                error.response?.data || error.message
            );

            setCountryCodes([]);
            toast.error("Error fetching country codes.");

        } finally {
            setCountryLoading(false);
        }
    };

    useEffect(() => {
        console.log("International Purchase page opened");

        if (!token) {
            setError("Authentication token not found.");
            setLoading(false);
            setCountryLoading(false);
            return;
        }

        fetchCompanies();
        fetchCountryCodes();

    }, [token]);

    // ==========================================
    // IMAGE PREVIEW
    // ==========================================

    const readImage = (file, callback) => {
        if (!file) {
            callback("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            callback(reader.result);
        };

        reader.onerror = () => {
            toast.error("Unable to read image.");
        };

        reader.readAsDataURL(file);
    };

    const handleProductImage = (localId, file) => {
        if (
            file &&
            !file.type.startsWith("image/")
        ) {
            toast.error("Please select a valid image.");
            return;
        }

        setProducts((previous) =>
            previous.map((product) =>
                product.localId === localId
                    ? {
                        ...product,
                        image: file || null,
                        imagePreview: "",
                    }
                    : product
            )
        );

        readImage(file, (preview) => {
            setProducts((previous) =>
                previous.map((product) =>
                    product.localId === localId &&
                        product.image === file
                        ? {
                            ...product,
                            imagePreview: preview,
                        }
                        : product
                )
            );
        });
    };

    // ==========================================
    // PRODUCT MANAGEMENT
    // ==========================================

    const addProduct = () => {
        setProducts((previous) => [
            ...previous,
            createEmptyProduct(),
        ]);
    };

    const removeProduct = (localId) => {
        setProducts((previous) =>
            previous.filter(
                (product) =>
                    product.localId !== localId
            )
        );
    };

    const handleProductChange = (
        localId,
        field,
        value
    ) => {
        setProducts((previous) =>
            previous.map((product) => {
                if (product.localId !== localId) {
                    return product;
                }

                const updatedProduct = {
                    ...product,
                    [field]: value,
                };

                const quantity =
                    Number(updatedProduct.total_pcs) || 0;

                const unitPrice =
                    Number(updatedProduct.unit_price) || 0;

                updatedProduct.total_price = (
                    quantity * unitPrice
                ).toFixed(2);

                return updatedProduct;
            })
        );
    };

    // ==========================================
    // TOTAL CALCULATION
    // ==========================================

    const totalPieces = products.reduce(
        (total, product) =>
            total + (Number(product.total_pcs) || 0),
        0
    );

    const grandTotal = products.reduce(
        (total, product) =>
            total + (Number(product.total_price) || 0),
        0
    );

    // ==========================================
    // PRODUCT VALIDATION
    // ==========================================

    const validateProducts = () => {
        if (products.length === 0) {
            toast.error(
                "Please add at least one product."
            );

            return false;
        }

        for (let i = 0; i < products.length; i++) {
            const product = products[i];

            if (!product.product_name.trim()) {
                toast.error(
                    `Enter product name in row ${i + 1}`
                );

                return false;
            }

            if (
                product.total_pcs === "" ||
                !Number.isInteger(
                    Number(product.total_pcs)
                ) ||
                Number(product.total_pcs) <= 0
            ) {
                toast.error(
                    `Enter valid quantity in row ${i + 1}`
                );

                return false;
            }

            if (
                product.unit_price === "" ||
                !Number.isFinite(
                    Number(product.unit_price)
                ) ||
                Number(product.unit_price) < 0 ||
                !/^\d+(?:\.\d{1,2})?$/.test(String(product.unit_price))
            ) {
                toast.error(
                    `Enter valid unit price in row ${i + 1}`
                );

                return false;
            }

            if (
                Number(product.unit_price) >
                9999999999.99 ||
                Number(product.total_price) >
                9999999999.99
            ) {
                toast.error(
                    `Price exceeds the allowed limit in row ${i + 1}`
                );

                return false;
            }
        }

        return true;
    };

    // ==========================================
    // FORMIK
    // ==========================================

    const formik = useFormik({
        initialValues: {
            buyer: "",
            date: getToday(),
            supplierCompany: "",
            supplierName: "",
            supplierEmail: "",
            supplierPhone: "",
            supplierAddress: "",
            supplierCountry: "",
            description: "",
        },

        validationSchema: Yup.object({
            buyer: Yup.string()
                .required("Please select a buyer company"),

            date: Yup.string()
                .required("Date is required"),

            supplierCompany: Yup.string()
                .max(200)
                .required("Supplier company is required"),

            supplierName: Yup.string()
                .max(200),

            supplierEmail: Yup.string()
                .email("Enter a valid email address")
                .max(200),

            supplierPhone: Yup.string()
                .max(20, "Maximum 20 characters"),

            supplierAddress: Yup.string()
                .max(500, "Maximum 500 characters"),

            supplierCountry: Yup.string()
                .test(
                    "country-id",
                    "Enter a valid country ID",
                    (value) =>
                        !value ||
                        /^[1-9]\d*$/.test(value)
                ),

            description: Yup.string(),
        }),

        onSubmit: async (values, helpers) => {
            if (isSubmitting) return;

            if (!validateProducts()) return;

            if (!token) {
                toast.error(
                    "Authentication token not found."
                );
                return;
            }

            setIsSubmitting(true);
            setError("");
            setCreatedInvoice("");

            try {
                const formData = new FormData();

                // ==================================
                // PURCHASE DETAILS
                // ==================================

                formData.append(
                    "buyer",
                    values.buyer
                );

                formData.append(
                    "date",
                    values.date
                );

                formData.append(
                    "supplierCompany",
                    values.supplierCompany.trim()
                );

                formData.append(
                    "supplierName",
                    values.supplierName.trim()
                );

                formData.append(
                    "supplierEmail",
                    values.supplierEmail.trim()
                );

                formData.append(
                    "supplierPhone",
                    values.supplierPhone.trim()
                );

                formData.append(
                    "supplierAddress",
                    values.supplierAddress.trim()
                );

                if (values.supplierCountry) {
                    formData.append(
                        "supplierCountry",
                        values.supplierCountry
                    );
                }

                formData.append("description", values.description);

                // The API decodes this JSON array before serializer validation.
                const items = products.map((product) => ({
                    product_name: product.product_name.trim(),
                    color: product.color.trim(),
                    size: product.size.trim(),
                    total_pcs: Number(product.total_pcs),
                    unit_price: Number(product.unit_price).toFixed(2),
                    note: product.note.trim(),
                }));

                formData.append("items", JSON.stringify(items));

                // The backend reads request.FILES.get(f"item_image_{index}").
                products.forEach((product, index) => {
                    if (product.image instanceof File) {
                        formData.append(
                            `item_image_${index}`,
                            product.image,
                            product.image.name
                        );
                    }
                });

                const response = await axios.post(
                    `${BASE_URL}international/purchase/`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );

                console.log(
                    "Purchase response status:",
                    response.status
                );

                console.log(
                    "Purchase response data:",
                    response.data
                );

                if (
                    response.status === 201 &&
                    response.data?.status === "success"
                ) {
                    const invoice =
                        response.data?.invoice ??
                        response.data?.data?.invoice ??
                        "";

                    setCreatedInvoice(invoice);

                    toast.success(
                        "International Purchase created successfully!"
                    );

                    helpers.resetForm({
                        values: {
                            buyer: "",
                            date: getToday(),
                            supplierCompany: "",
                            supplierName: "",
                            supplierEmail: "",
                            supplierPhone: "",
                            supplierAddress: "",
                            supplierCountry: "",
                            description: "",
                        },
                    });

                    setProducts([
                        createEmptyProduct(),
                    ]);
                } else {
                    throw new Error(response.data?.message || "Unexpected purchase response.");
                }

            } catch (err) {
                const responseData = err.response?.data;
                console.error("Purchase error status:", err.response?.status);
                console.error("Purchase error response:", JSON.stringify(responseData, null, 2));

                const flattenErrors = (value, path = "") => {
                    if (typeof value === "string") {
                        return [path ? `${path}: ${value}` : value];
                    }
                    if (Array.isArray(value)) {
                        return value.flatMap((entry, index) =>
                            flattenErrors(entry, typeof entry === "object"
                                ? `${path}[${index + 1}]` : path));
                    }
                    if (value && typeof value === "object") {
                        return Object.entries(value).flatMap(([key, entry]) =>
                            flattenErrors(entry, path ? `${path}.${key}` : key));
                    }
                    return [];
                };

                const messages = flattenErrors(responseData?.errors);
                const errorMessage = messages.length
                    ? messages.join("\n")
                    : responseData?.message || responseData?.detail || err.message || "Failed to create International Purchase.";
                setError(errorMessage);
                toast.error(errorMessage, { autoClose: 8000 });
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const isInvalid = (name) =>
        Boolean(
            formik.touched[name] &&
            formik.errors[name]
        );

    // ==========================================
    // COMMON FORM FIELD
    // ==========================================

    const renderField = (
        name,
        label,
        type = "text",
        placeholder = ""
    ) => (
        <div className="mb-3">
            <Label htmlFor={name}>
                {label}
            </Label>

            <Input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                value={formik.values[name]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                invalid={isInvalid(name)}
            />

            {isInvalid(name) && (
                <FormFeedback>
                    {formik.errors[name]}
                </FormFeedback>
            )}
        </div>
    );

    // ==========================================
    // PAGE UI
    // ==========================================

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>

                    <Breadcrumbs
                        title="Purchase"
                        breadcrumbItem="INTERNATIONAL PURCHASE"
                    />

                    {error && (
                        <Alert
                            color="danger"
                            fade={false}
                            toggle={() => setError("")}
                            style={{
                                overflowWrap: "anywhere",
                                whiteSpace: "pre-wrap",
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {createdInvoice && (
                        <Alert color="success" fade={false}>
                            International Purchase created
                            successfully.

                            <strong className="ms-2">
                                Invoice: {createdInvoice}
                            </strong>
                        </Alert>
                    )}

                    <Form onSubmit={formik.handleSubmit}>

                        {/* PURCHASE INFORMATION */}

                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody>

                                        <CardTitle className="mb-4">
                                            INTERNATIONAL PURCHASE
                                        </CardTitle>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">

                                                    <Label htmlFor="buyer">
                                                        Buyer Company
                                                        <span className="text-danger">
                                                            {" "}*
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        type="select"
                                                        id="buyer"
                                                        name="buyer"
                                                        value={
                                                            formik.values.buyer
                                                        }
                                                        onChange={
                                                            formik.handleChange
                                                        }
                                                        onBlur={
                                                            formik.handleBlur
                                                        }
                                                        invalid={
                                                            isInvalid("buyer")
                                                        }
                                                        disabled={loading}
                                                    >
                                                        <option value="">
                                                            {loading
                                                                ? "Loading companies..."
                                                                : "Select Buyer Company"}
                                                        </option>

                                                        {companies.map(
                                                            (company) => (
                                                                <option
                                                                    key={
                                                                        company.id
                                                                    }
                                                                    value={
                                                                        company.id
                                                                    }
                                                                >
                                                                    {
                                                                        company.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </Input>

                                                    {isInvalid("buyer") && (
                                                        <FormFeedback>
                                                            {
                                                                formik.errors.buyer
                                                            }
                                                        </FormFeedback>
                                                    )}

                                                    {!loading &&
                                                        companies.length === 0 && (
                                                            <Button
                                                                type="button"
                                                                color="link"
                                                                onClick={
                                                                    fetchCompanies
                                                                }
                                                            >
                                                                Reload companies
                                                            </Button>
                                                        )}
                                                </div>
                                            </Col>

                                            <Col md={2}>
                                                {renderField(
                                                    "date",
                                                    "Purchase Date *",
                                                    "date"
                                                )}
                                            </Col>

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label>
                                                        Invoice Number
                                                    </Label>

                                                    <Input
                                                        type="text"
                                                        value={
                                                            createdInvoice ||
                                                            "Auto Generated"
                                                        }
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label>Status</Label>

                                                    <Input
                                                        type="text"
                                                        value="Pending"
                                                        readOnly
                                                    />
                                                </div>
                                            </Col>
                                        </Row>

                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* SUPPLIER DETAILS */}

                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody>

                                        <CardTitle className="mb-4">
                                            SUPPLIER DETAILS
                                        </CardTitle>

                                        <Row>
                                            <Col md={6}>
                                                {renderField(
                                                    "supplierCompany",
                                                    "Supplier Company *",
                                                    "text",
                                                    "Enter supplier company"
                                                )}
                                            </Col>

                                            <Col md={6}>
                                                {renderField(
                                                    "supplierName",
                                                    "Supplier Name",
                                                    "text",
                                                    "Enter supplier name"
                                                )}
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                {renderField(
                                                    "supplierEmail",
                                                    "Supplier Email",
                                                    "email",
                                                    "Enter email address"
                                                )}
                                            </Col>

                                            <Col md={4}>
                                                {renderField(
                                                    "supplierPhone",
                                                    "Supplier Phone",
                                                    "tel",
                                                    "Enter phone number"
                                                )}
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">

                                                    <Label htmlFor="supplierCountry">
                                                        Supplier Country
                                                    </Label>

                                                    <Input
                                                        type="select"
                                                        id="supplierCountry"
                                                        name="supplierCountry"
                                                        className="form-control"
                                                        value={formik.values.supplierCountry}
                                                        onChange={(e) => {
                                                            const selectedCountryId = e.target.value;

                                                            formik.setFieldValue(
                                                                "supplierCountry",
                                                                selectedCountryId
                                                            );

                                                            console.log(
                                                                "Selected Country ID:",
                                                                selectedCountryId
                                                            );
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                        invalid={isInvalid("supplierCountry")}
                                                        disabled={countryLoading || isSubmitting}
                                                    >
                                                        <option value="">
                                                            {countryLoading
                                                                ? "Loading countries..."
                                                                : "Select Supplier Country"}
                                                        </option>

                                                        {countryCodes.map((country) => (
                                                            <option
                                                                key={country.id}
                                                                value={country.id}
                                                            >
                                                                {country.country_name || country.country_code}
                                                            </option>
                                                        ))}

                                                    </Input>

                                                    {isInvalid("supplierCountry") && (
                                                        <FormFeedback>
                                                            {formik.errors.supplierCountry}
                                                        </FormFeedback>
                                                    )}

                                                    {!countryLoading && countryCodes.length === 0 && (
                                                        <Button
                                                            type="button"
                                                            color="link"
                                                            className="p-0 mt-2"
                                                            onClick={fetchCountryCodes}
                                                            disabled={isSubmitting}
                                                        >
                                                            Reload Countries
                                                        </Button>
                                                    )}

                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={12}>
                                                {renderField(
                                                    "supplierAddress",
                                                    "Supplier Address",
                                                    "textarea",
                                                    "Enter complete supplier address"
                                                )}
                                            </Col>
                                        </Row>

                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* PURCHASE PRODUCTS */}

                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody>

                                        <div className="d-flex justify-content-between align-items-center mb-4">

                                            <CardTitle className="mb-0">
                                                PURCHASE PRODUCTS
                                            </CardTitle>

                                        </div>

                                        <div className="table-responsive">

                                            <Table className="table-bordered table-hover align-middle mb-0">

                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>REFERENCE IMAGE</th>
                                                        <th>PRODUCT NAME</th>
                                                        <th>COLOR</th>
                                                        <th>SIZE</th>
                                                        <th>TOTAL PCS</th>
                                                        <th>UNIT PRICE</th>
                                                        <th>TOTAL PRICE</th>
                                                        <th>NOTE</th>
                                                        <th>ACTION</th>
                                                    </tr>
                                                </thead>

                                                <tbody>

                                                    {products.length > 0 ? (
                                                        products.map(
                                                            (product, index) => (
                                                                <tr
                                                                    key={
                                                                        product.localId
                                                                    }
                                                                >

                                                                    <td>
                                                                        {index + 1}
                                                                    </td>

                                                                    {/* PRODUCT IMAGE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "150px",
                                                                        }}
                                                                    >
                                                                        {product.imagePreview && (
                                                                            <img
                                                                                src={
                                                                                    product.imagePreview
                                                                                }
                                                                                alt="Product"
                                                                                className="rounded border mb-2"
                                                                                style={{
                                                                                    width: "75px",
                                                                                    height: "75px",
                                                                                    objectFit: "contain",
                                                                                }}
                                                                            />
                                                                        )}

                                                                        <Input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            bsSize="sm"
                                                                            onChange={(e) =>
                                                                                handleProductImage(
                                                                                    product.localId,
                                                                                    e.target.files?.[0] ||
                                                                                    null
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* PRODUCT NAME */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "230px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Product name"
                                                                            maxLength={500}
                                                                            value={
                                                                                product.product_name
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "product_name",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* COLOR */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "110px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Color"
                                                                            maxLength={100}
                                                                            value={
                                                                                product.color
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "color",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* SIZE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "100px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="Size"
                                                                            maxLength={100}
                                                                            value={
                                                                                product.size
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "size",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* TOTAL PIECES */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "100px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="number"
                                                                            min="1"
                                                                            step="1"
                                                                            placeholder="Qty"
                                                                            value={
                                                                                product.total_pcs
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "total_pcs",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* UNIT PRICE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "120px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            placeholder="0.00"
                                                                            value={
                                                                                product.unit_price
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "unit_price",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* TOTAL PRICE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "130px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="text"
                                                                            value={
                                                                                product.total_price
                                                                            }
                                                                            className="bg-light fw-bold"
                                                                            readOnly
                                                                        />
                                                                    </td>

                                                                    {/* NOTE */}

                                                                    <td
                                                                        style={{
                                                                            minWidth: "180px",
                                                                        }}
                                                                    >
                                                                        <Input
                                                                            type="textarea"
                                                                            rows="1"
                                                                            placeholder="Product note"
                                                                            value={
                                                                                product.note
                                                                            }
                                                                            onChange={(e) =>
                                                                                handleProductChange(
                                                                                    product.localId,
                                                                                    "note",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>

                                                                    {/* REMOVE */}

                                                                    <td>
                                                                        <Button
                                                                            type="button"
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                removeProduct(
                                                                                    product.localId
                                                                                )
                                                                            }
                                                                        >
                                                                            <i className="bx bx-trash me-1" />
                                                                            Remove
                                                                        </Button>
                                                                    </td>

                                                                </tr>
                                                            )
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan="10"
                                                                className="text-center text-muted py-4"
                                                            >
                                                                No products added.
                                                                Click Add Product.
                                                            </td>
                                                        </tr>
                                                    )}

                                                </tbody>

                                                <tfoot className="table-light">
                                                    <tr>
                                                        <td
                                                            colSpan="5"
                                                            className="text-end fw-bold"
                                                        >
                                                            TOTAL
                                                        </td>

                                                        <td className="fw-bold">
                                                            {totalPieces}
                                                        </td>

                                                        <td></td>

                                                        <td className="fw-bold">
                                                            {grandTotal.toFixed(2)}
                                                        </td>

                                                        <td colSpan="2"></td>
                                                    </tr>
                                                </tfoot>

                                            </Table>
                                        </div>

                                        <Button
                                            type="button"
                                            color="soft-primary"
                                            className="mt-3"
                                            onClick={addProduct}
                                        >
                                            + Add Another Product
                                        </Button>

                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                        {/* DESCRIPTION AND SIGNATURE */}

                        <Row>

                            <Col md={8}>
                                <Card>
                                    <CardBody>

                                        <CardTitle className="mb-4">
                                            ADDITIONAL DETAILS
                                        </CardTitle>

                                        <div className="mb-4">
                                            <Label htmlFor="description">
                                                Description
                                            </Label>

                                            <Input
                                                type="textarea"
                                                id="description"
                                                name="description"
                                                rows="5"
                                                placeholder="Enter additional purchase information"
                                                value={
                                                    formik.values.description
                                                }
                                                onChange={
                                                    formik.handleChange
                                                }
                                                onBlur={
                                                    formik.handleBlur
                                                }
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <Label>Prepared Signature</Label>
                                            <div className="text-muted">
                                                Automatically assigned from the logged-in user's saved signature, if available.
                                            </div>
                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>

                            {/* PURCHASE SUMMARY */}

                            <Col md={4}>
                                <Card>
                                    <CardBody>

                                        <CardTitle className="mb-4">
                                            PURCHASE SUMMARY
                                        </CardTitle>

                                        <div className="border-bottom pb-3 mb-3">
                                            Total Products

                                            <strong className="float-end">
                                                {products.length}
                                            </strong>
                                        </div>

                                        <div className="border-bottom pb-3 mb-3">
                                            Total Pieces

                                            <strong className="float-end">
                                                {totalPieces}
                                            </strong>
                                        </div>

                                        <div className="border-bottom pb-3 mb-3">
                                            Purchase Amount

                                            <strong className="float-end">
                                                {grandTotal.toFixed(2)}
                                            </strong>
                                        </div>

                                        <div className="bg-primary rounded p-3">

                                            <span className="fw-bold text-white">
                                                GRAND TOTAL
                                            </span>

                                            <h3 className="text-white mt-2 mb-0">
                                                {grandTotal.toFixed(2)}
                                            </h3>

                                        </div>

                                        <div className="mt-3">
                                            Status:

                                            <span className="badge bg-warning ms-2">
                                                Pending
                                            </span>
                                        </div>

                                    </CardBody>
                                </Card>
                            </Col>

                        </Row>

                        {/* SUBMIT BUTTON */}

                        <Row>
                            <Col xl={12}>
                                <Card>
                                    <CardBody>

                                        <Button
                                            color="primary"
                                            type="submit"
                                            className="w-100 py-3"
                                            disabled={
                                                isSubmitting ||
                                                loading ||
                                                !token
                                            }
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner
                                                        size="sm"
                                                        className="me-2"
                                                    />
                                                    Creating International Purchase...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bx bx-save me-2" />
                                                    CREATE INTERNATIONAL PURCHASE
                                                </>
                                            )}
                                        </Button>

                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                    </Form>

                    <ToastContainer />

                </Container>
            </div>
        </React.Fragment>
    );
};

export default InternationalPurchase;
