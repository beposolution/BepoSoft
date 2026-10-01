import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { createAuditLog } from "../../services/auditService";

const FormLayouts = () => {
    document.title = "BEPOSOFT | Add Bank";

    const [message, setMessage] = useState(null); // For success or error message
    const [messageType, setMessageType] = useState(null); // For determining success or error message type
    const [accountTypes, setAccountTypes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = localStorage.getItem('name');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAccountTypes = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}add/bank/account/type/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 200) {
                    setAccountTypes(response.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching account types", error);
            }
        };

        fetchAccountTypes();
    }, []);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(
                    `${import.meta.env.VITE_APP_KEY}company/data/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 200) {
                    setCompanies(response.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching companies", error);
            }
        };

        fetchCompanies();
    }, []);

    const createBankDataLog = async (values, responseData = null) => {
        try {
            // Resolve Account Type name from FK
            const selectedAccountType = accountTypes.find(
                (type) => String(type.id) === String(values.account_type)
            );

            // Resolve Company name from FK
            const selectedCompany = companies.find(
                (company) => String(company.id) === String(values.company)
            );

            const afterData = {
                name: responseData?.name ?? values.name ?? "",

                account_number:
                    responseData?.account_number ??
                    values.account_number ??
                    "",

                account_type:
                    responseData?.account_type_name ??
                    selectedAccountType?.account_type ??
                    "",

                ifsc_code:
                    responseData?.ifsc_code ??
                    values.ifsc_code ??
                    "",

                branch:
                    responseData?.branch ??
                    values.branch ??
                    "",

                open_balance:
                    responseData?.open_balance ??
                    values.open_balance ??
                    "",

                company:
                    responseData?.company_name ??
                    selectedCompany?.name ??
                    "",

                interest_rate:
                    responseData?.interest_rate ??
                    values.interest_rate ??
                    "",

                check:
                    responseData?.check ??
                    values.check ??
                    "",

                created_user:
                    user ?? "",
            };

            const auditCreated = await createAuditLog({
                action: "bank_created_website",
                beforeData: {},
                afterData: afterData,
            });

            if (!auditCreated) {
                console.error(
                    "Bank created successfully, but DataLog creation failed."
                );

                return false;
            }

            return true;

        } catch (error) {
            console.error(
                "Bank DataLog creation error:",
                error
            );

            return false;
        }
    };

    const formik = useFormik({

        initialValues: {
            name: "",
            account_number: "",
            ifsc_code: "",
            branch: "",
            open_balance: "",
            check: "",
            account_type: "",
            company: "",
            interest_rate: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("This field is required"),
            account_number: Yup.string().required("This field is required"),
            account_type: Yup.string().required("This field is required"),
            ifsc_code: Yup.string().required("This field is required"),
            branch: Yup.string().required("This field is required"),
            open_balance: Yup.string().required("This field is required"),
            check: Yup.string().required("This field is required"),
            company: Yup.string().required("Please select a company"),

            interest_rate: Yup.string().when("account_type", {
                is: (val) => {
                    const type = accountTypes.find((t) => t.id == val);
                    return type?.account_type === "OD";
                },
                then: () => Yup.string().required("Interest Rate is required for OD"),
                otherwise: () => Yup.string().notRequired(),
            }),
        }),

        onSubmit: async (values, { resetForm }) => {

            // Prevent double click / duplicate submission
            if (isSubmitting) {
                return;
            }

            setIsSubmitting(true);

            try {
                const token = localStorage.getItem("token");

                const response = await axios.post(
                    `${import.meta.env.VITE_APP_KEY}add/bank/`,
                    values,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                    }
                );

                if (response.status === 201) {

                    // -------------------------------------------------
                    // BANK CREATED SUCCESSFULLY
                    // CREATE DATALOG
                    // -------------------------------------------------

                    try {
                        const createdBank =
                            response?.data?.data ?? null;

                        await createBankDataLog(
                            values,
                            createdBank
                        );

                    } catch (auditError) {

                        console.error(
                            "Bank created, but DataLog failed:",
                            auditError
                        );
                    }


                    // -------------------------------------------------
                    // SUCCESS MESSAGE
                    // -------------------------------------------------

                    setMessage(
                        "Bank account added successfully!"
                    );

                    setMessageType("success");


                    // -------------------------------------------------
                    // CLEAR ALL FORM VALUES
                    // -------------------------------------------------

                    resetForm({
                        values: {
                            name: "",
                            account_number: "",
                            ifsc_code: "",
                            branch: "",
                            open_balance: "",
                            check: "",
                            account_type: "",
                            company: "",
                            interest_rate: "",
                        },
                    });

                } else {

                    setMessage(
                        response.data.message ||
                        "Something went wrong. Please try again."
                    );

                    setMessageType("error");
                }

            } catch (error) {

                if (
                    error.response &&
                    error.response.status === 401
                ) {

                    localStorage.removeItem("token");

                    alert(
                        "Your session has expired. Please log in again."
                    );

                    navigate("/login");

                } else {

                    setMessage(
                        error?.response?.data?.message ||
                        "Something went wrong. Please try again."
                    );

                    setMessageType("error");
                }

            } finally {

                // Re-enable only after API + audit processing finishes
                setIsSubmitting(false);
            }
        }
    });

    const selectedAccountType = accountTypes.find(
        (type) => type.id == formik.values.account_type
    );

    const isOD = selectedAccountType?.account_type === "OD ACCOUNT";

    useEffect(() => {
        if (!isOD) {
            formik.setFieldValue("interest_rate", "");
        }
    }, [formik.values.account_type]);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="ADD BANK" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">ADD BANK</CardTitle>

                                    {/* Display success or error message */}
                                    {message && (
                                        <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'}`} role="alert">
                                            {message}
                                        </div>
                                    )}

                                    <Form onSubmit={formik.handleSubmit}>

                                        <Row>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-firstname-Input">Bank Name</Label>
                                                    <Input
                                                        type="text"
                                                        name="name"
                                                        className="form-control"
                                                        id="formrow-firstname-Input"
                                                        placeholder="Enter Bank Name"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && formik.errors.name}
                                                    />
                                                    {formik.errors.name && formik.touched.name && (
                                                        <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Account Type</Label>
                                                    <Input
                                                        type="select"
                                                        name="account_type"
                                                        value={formik.values.account_type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.account_type && !!formik.errors.account_type}
                                                    >
                                                        <option value="">Select Account Type</option>
                                                        {accountTypes.map((type) => (
                                                            <option key={type.id} value={type.id}>
                                                                {type.account_type}
                                                            </option>
                                                        ))}
                                                    </Input>

                                                    {formik.errors.account_type && formik.touched.account_type && (
                                                        <FormFeedback>{formik.errors.account_type}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label>Company</Label>

                                                    <Input
                                                        type="select"
                                                        name="company"
                                                        value={formik.values.company}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={
                                                            formik.touched.company &&
                                                            !!formik.errors.company
                                                        }
                                                    >
                                                        <option value="">Select Company</option>

                                                        {companies.map((company) => (
                                                            <option
                                                                key={company.id}
                                                                value={company.id}
                                                            >
                                                                {company.name}
                                                            </option>
                                                        ))}
                                                    </Input>

                                                    {formik.touched.company && formik.errors.company && (
                                                        <FormFeedback>
                                                            {formik.errors.company}
                                                        </FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            {isOD && (
                                                <Row>
                                                    <Col md={6}>
                                                        <div className="mb-3">
                                                            <Label>Interest Rate (%)</Label>
                                                            <Input
                                                                type="text"
                                                                name="interest_rate"
                                                                placeholder="Enter Interest Rate"
                                                                value={formik.values.interest_rate}
                                                                onChange={formik.handleChange}
                                                                onBlur={formik.handleBlur}
                                                                invalid={formik.touched.interest_rate && !!formik.errors.interest_rate}
                                                            />
                                                            {formik.errors.interest_rate && formik.touched.interest_rate && (
                                                                <FormFeedback>{formik.errors.interest_rate}</FormFeedback>
                                                            )}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            )}


                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">A/C Number</Label>
                                                    <Input
                                                        type="text"
                                                        name="account_number"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your A/C Number"
                                                        value={formik.values.account_number}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.account_number && formik.errors.account_number}
                                                    />
                                                    {formik.errors.account_number && formik.touched.account_number && (
                                                        <FormFeedback type="invalid">{formik.errors.account_number}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-password-Input">IFSC Code</Label>
                                                    <Input
                                                        type="text"
                                                        name="ifsc_code"
                                                        className="form-control"
                                                        id="formrow-password-Input"
                                                        placeholder="Enter Your IFSC Code"
                                                        autoComplete="off"
                                                        value={formik.values.ifsc_code}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.ifsc_code && formik.errors.ifsc_code}
                                                    />
                                                    {formik.errors.ifsc_code && formik.touched.ifsc_code && (
                                                        <FormFeedback type="invalid">{formik.errors.ifsc_code}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputCity">Branch</Label>
                                                    <Input
                                                        type="text"
                                                        name="branch"
                                                        className="form-control"
                                                        id="formrow-InputCity"
                                                        placeholder="Enter Your Branch"
                                                        value={formik.values.branch}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.branch && formik.errors.branch}
                                                    />
                                                    {formik.errors.branch && formik.touched.branch && (
                                                        <FormFeedback type="invalid">{formik.errors.branch}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Opening balance</Label>
                                                    <Input
                                                        type="text"
                                                        name="open_balance"
                                                        className="form-control"
                                                        id="formrow-Inputopen_balance"
                                                        placeholder="Enter Your open balance"
                                                        value={formik.values.open_balance}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.open_balance && formik.errors.open_balance}
                                                    />
                                                    {formik.errors.open_balance && formik.touched.open_balance && (
                                                        <FormFeedback type="invalid">{formik.errors.open_balance}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-email-Input">Created User</Label>
                                                    <Input
                                                        type="text"
                                                        name="created_user"
                                                        className="form-control"
                                                        id="formrow-email-Input"
                                                        placeholder="Enter Your A/C Number"
                                                        value={user}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.created_user && formik.errors.created_user}
                                                    />
                                                    {formik.errors.created_user && formik.touched.created_user && (
                                                        <FormFeedback type="invalid">{formik.errors.created_user}</FormFeedback>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <div className="mb-3">
                                            <div className="form-check">
                                                <Input
                                                    type="checkbox"
                                                    className="form-check-Input"
                                                    id="formrow-customCheck"
                                                    name="check"
                                                    value={formik.values.check}
                                                    onChange={formik.handleChange}
                                                    onBlur={formik.handleBlur}
                                                    invalid={formik.touched.check && formik.errors.check}
                                                />
                                                <Label className="form-check-Label" htmlFor="formrow-customCheck">
                                                    Check me out
                                                </Label>
                                            </div>
                                            {formik.errors.check && formik.touched.check && (
                                                <FormFeedback type="invalid">{formik.errors.check}</FormFeedback>
                                            )}
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                className="btn btn-primary w-md"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? "Submitting..." : "Submit"}
                                            </button>
                                        </div>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default FormLayouts;
