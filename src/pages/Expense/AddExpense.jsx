import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, FormFeedback } from "reactstrap";
import * as Yup from 'yup';
import { useFormik } from "formik";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { init } from "echarts";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FormLayouts = () => {
    document.title = "Expenses | Beposoft";
    const token = localStorage.getItem('token');

    const [companies, setCompanies] = useState([]);
    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [payment, setPayment] = useState('');
    const [EmiDetails, setEmiDetails] = useState([]);
    const [category, setCategory] = useState([]);
    const [purposeOfPayment, setPurposeOfPayment] = useState([]);
    const [userData, setUserData] = useState();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}profile/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(response?.data?.data?.name);
            } catch (error) {
                toast.error('Error fetching user data:');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch company data
                const companyResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}company/data/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setCompanies(companyResponse.data.data);

                // Fetch bank data
                const bankResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setBanks(bankResponse.data.data);

                // Fetch staff data
                const staffResponse = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                setStaffs(staffResponse.data.data);

                const fetchEmi = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/emi/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })
                setEmiDetails(fetchEmi.data.data);

                const fetchCategory = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/assetcategory/`, {

                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })
                setCategory(fetchCategory.data);

                const fetchPurposeOfPayment = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`, {

                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })

                setPurposeOfPayment(fetchPurposeOfPayment.data);


            } catch (error) {
                alert("An error occurred while fetching the data.");
            }
        };

        fetchData();
    }, [token]);



    const formik = useFormik({
        initialValues: {
            company: "",
            payed_by: "",
            bank: "",
            purpose_of_payment: "",   // ID
            purpose_name: "",         // NEW: normalized name like "emi"
            amount: "",
            expense_date: new Date().toISOString().split('T')[0],
            transaction_id: "",
            description: "",
            added_by: "",
            asset_types: "",
            expense_type: "",
            name: "",
            quantity: "",
            category: "",
            loan: ""
        },

        validationSchema: Yup.object({
            company: Yup.string().required("This field is required"),
            payed_by: Yup.string().required("This field is required"),
            bank: Yup.string().required("This field is required"),
            purpose_of_payment: Yup.string().required("This field is required"),
            purpose_name: Yup.string().nullable(), // NEW
            amount: Yup.string().required("This field is required"),
            expense_date: Yup.string().required("This field is required"),
            transaction_id: Yup.string().required("This field is required"),
            description: Yup.string().required("This field is required"),
            asset_types: Yup.string().required("Select any type"),
            expense_type: Yup.string().required("This field is required"),

            name: Yup.string().when("asset_types", {
                is: (val) => val !== "expenses",
                then: (schema) => schema.required("Name is required"),
            }),

            quantity: Yup.number().when("asset_types", {
                is: (val) => val !== "expenses",
                then: (schema) => schema.required("Quantity is required").integer("Quantity must be an integer"),
            }),

            category: Yup.number().when("asset_types", {
                is: (val) => val !== "expenses",
                then: (schema) => schema.required("category is required"),
            }),

            // ✅ Require loan only when purpose is EMI
            loan: Yup.number().when("purpose_name", {
                is: (val) => (val || "").toLowerCase() === "emi",
                then: (schema) => schema.required("Loan is required").integer("Loan ID must be an integer"),
            }),
        }),

        onSubmit: async (values, { resetForm }) => {
            try {
                let formData = { ...values };
                formData.added_by = userData;
                if (formData.loan) formData.loan = parseInt(formData.loan, 10);

                const isEmi = (formData.purpose_name || "").toLowerCase() === "emi";

                if (isEmi) {
                    // Always treat EMI as an expense with loan
                    delete formData.name;
                    delete formData.quantity;
                    delete formData.category;
                    formData.asset_types = "expenses";

                    await axios.post(
                        `${import.meta.env.VITE_APP_KEY}expense/add/`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Expense with EMI submitted successfully!");
                    setSuccessMessage("Expense with EMI submitted successfully!");
                } else if (values.asset_types === "expenses") {
                    // non-EMI expense
                    delete formData.name;
                    delete formData.quantity;
                    delete formData.category;

                    await axios.post(
                        `${import.meta.env.VITE_APP_KEY}expense/addexpectemi/`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Expense submitted successfully!");
                    setSuccessMessage("Expense submitted successfully!");
                } else if (values.asset_types === "assets") {
                    // ✅ Corrected endpoint spelling here
                    await axios.post(
                        `${import.meta.env.VITE_APP_KEY}assest/`,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success("Asset submitted successfully!");
                    setSuccessMessage("Asset submitted successfully!");
                }

                setErrorMessage('');
                resetForm();
            } catch (error) {
                // Show server message so you can see the exact backend error
                const msg = error?.response?.data?.message || error?.response?.data || "An error occurred while submitting the form.";
                setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
                setSuccessMessage('');
                console.error("Submit error:", error?.response || error);
            }
        }

    });

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="Forms" breadcrumbItem="ADD EXPENSES" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <Form onSubmit={formik.handleSubmit}>
                                        <div className="mb-3">
                                            {successMessage && (
                                                <div className="alert alert-success" role="alert">
                                                    {successMessage}
                                                </div>
                                            )}
                                            {errorMessage && (
                                                <div className="alert alert-danger" role="alert">
                                                    {errorMessage}
                                                </div>
                                            )}
                                        </div>

                                        <Row>
                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-company-Input">Company</Label>
                                                    <Input
                                                        type="select"
                                                        name="company"
                                                        className="form-control"
                                                        id="formrow-company-Input"
                                                        value={formik.values.company}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.company && formik.errors.company ? true : false}
                                                    >
                                                        <option value="" label="Select Your Company" />
                                                        {companies.map((company) => (
                                                            <option key={company.id} value={company.id} label={company.name} />
                                                        ))}
                                                    </Input>
                                                    {formik.errors.company && formik.touched.company ? (
                                                        <FormFeedback type="invalid">{formik.errors.company}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-payed_by-Input">Payed By</Label>
                                                    <Input
                                                        type="select"
                                                        name="payed_by"
                                                        className="form-control"
                                                        id="formrow-payed_by-Input"
                                                        value={formik.values.payed_by}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.payed_by && formik.errors.payed_by ? true : false}
                                                    >
                                                        <option value="" label="Payed by " />
                                                        {staffs.map((staff) => (
                                                            <option key={staff.id} value={staff.id} label={staff.name} />
                                                        ))}
                                                    </Input>
                                                    {formik.errors.payed_by && formik.touched.payed_by ? (
                                                        <FormFeedback type="invalid">{formik.errors.payed_by}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-bank-Input">Bank</Label>
                                                    <Input
                                                        type="select"
                                                        name="bank"
                                                        className="form-control"
                                                        id="formrow-bank-Input"
                                                        value={formik.values.bank}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.bank && formik.errors.bank ? true : false}
                                                    >
                                                        <option value="" label="Select Your Bank" />
                                                        {banks.map((bank) => (
                                                            <option key={bank.id} value={bank.id} label={bank.name} />
                                                        ))}
                                                    </Input>
                                                    {formik.errors.bank && formik.touched.bank ? (
                                                        <FormFeedback type="invalid">{formik.errors.bank}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-expense-type">Type of Expense</Label>
                                                    <Input
                                                        type="select"
                                                        name="expense_type"
                                                        id="formrow-expense-type"
                                                        className="form-control"
                                                        value={formik.values.expense_type}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.expense_type && formik.errors.expense_type ? true : false}
                                                    >
                                                        <option value="">Select Type</option>
                                                        <option value="miscellaneous">Miscellaneous</option>
                                                        <option value="permanent">Permanent</option>
                                                        <option value="emi">EMI</option>
                                                        <option value="cargo">Cargo</option>
                                                        <option value="purchase">Purchase</option>
                                                    </Input>
                                                    {formik.errors.expense_type && formik.touched.expense_type ? (
                                                        <FormFeedback type="invalid">{formik.errors.expense_type}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-company-Input">Type of Payment</Label>
                                                    <Input
                                                        type="select"
                                                        name="asset_types"
                                                        className="form-control"
                                                        id="formrow-company-Input"
                                                        value={formik.values.asset_types}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.asset_types && formik.errors.asset_types ? true : false}
                                                    >
                                                        <option value="">Select Payment</option>
                                                        <option value="assets" label="Assets" />
                                                        <option value="expenses" label="Expenses" />
                                                    </Input>
                                                    {formik.errors.company && formik.touched.company ? (
                                                        <FormFeedback type="invalid">{formik.errors.ASSET_CHOICES}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-name-Input">Name</Label>
                                                    <Input
                                                        name="name"
                                                        className="form-control"
                                                        id="formrow-name-Input"
                                                        value={formik.values.name}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.name && formik.errors.name ? true : false}
                                                        disabled={formik.values.asset_types === "expenses"} // Disable input when asset_types is "expenses"
                                                    />
                                                    {formik.errors.name && formik.touched.name ? (
                                                        <FormFeedback type="invalid">{formik.errors.name}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col md={3}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-quantity-Input">Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        name="quantity"
                                                        className="form-control"
                                                        id="formrow-quantity-Input"
                                                        value={formik.values.quantity}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.quantity && formik.errors.quantity ? true : false}
                                                        disabled={formik.values.asset_types === "expenses"} // Disable input when asset_types is "expenses"
                                                    />
                                                    {formik.errors.quantity && formik.touched.quantity ? (
                                                        <FormFeedback type="invalid">{formik.errors.quantity}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="dddf-loan">Select Category</Label>
                                                    <Input
                                                        type="select"
                                                        name="category"
                                                        id="ddf-loan"
                                                        className="form-control"
                                                        value={formik.values.category}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.category && formik.errors.category}
                                                        disabled={formik.values.asset_types === "expenses"}
                                                    >
                                                        <option value="">Select category</option>
                                                        {category && category.length > 0 ? (
                                                            category.map((category) => (
                                                                <option key={category.id} value={category.id}>{category.category_name}</option>
                                                            ))
                                                        ) : (
                                                            <option disabled>Loading category details...</option>
                                                        )}

                                                    </Input>
                                                    {formik.errors.category && formik.touched.category ? (
                                                        <FormFeedback type="invalid">{formik.errors.category}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurpose_of_payment">Purpose Of Payment</Label>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary w-md m-1"
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            const purposeName = window.prompt("Enter new purpose name:");
                                                            if (!purposeName) return;
                                                            try {
                                                                const res = await axios.post(
                                                                    `${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`,
                                                                    { name: purposeName },
                                                                    { headers: { 'Authorization': `Bearer ${token}` } }
                                                                );
                                                                // Refresh the list
                                                                const fetchPurposeOfPayment = await axios.get(
                                                                    `${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`,
                                                                    { headers: { 'Authorization': `Bearer ${token}` } }
                                                                );
                                                                setPurposeOfPayment(fetchPurposeOfPayment.data);
                                                                // Select the new purpose if API returns its id
                                                                if (res.data && res.data.id) {
                                                                    formik.setFieldValue("purpose_of_payment", res.data.id.toString());
                                                                }
                                                            } catch (err) {
                                                                alert("Failed to add purpose.");
                                                            }
                                                        }}
                                                    >
                                                        Add Purpose
                                                    </button>
                                                    <select
                                                        name="purpose_of_payment"
                                                        id="formrow-product_type-Input"
                                                        className="form-control"
                                                        value={formik.values.purpose_of_payment || ""}
                                                        onChange={(e) => {
                                                            const selectedId = e.target.value;
                                                            const selected = purposeOfPayment.find(p => String(p.id) === String(selectedId));
                                                            formik.setFieldValue("purpose_of_payment", selectedId);
                                                            formik.setFieldValue("purpose_name", (selected?.name || "").toLowerCase()); // NEW
                                                        }}
                                                        onBlur={formik.handleBlur}
                                                    >
                                                        <option value="">Choose...</option>
                                                        {purposeOfPayment.map((type) => (
                                                            <option key={type.id} value={type.id}>
                                                                {type.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formik.errors.purpose_of_payment && formik.touched.purpose_of_payment ? (
                                                        <FormFeedback type="invalid">{formik.errors.purpose_of_payment}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                            {/* ✅ Check if selected purpose_of_payment ID matches "emi" by looking up its name */}
                                            {formik.values.purpose_name === "emi" && (
                                                <Col lg={4}>
                                                    <div className="mb-3">
                                                        <Label htmlFor="formrow-loan">Select EMI</Label>
                                                        <Input
                                                            type="select"
                                                            name="loan"
                                                            id="formrow-loan"
                                                            className="form-control"
                                                            value={formik.values.loan}
                                                            onChange={formik.handleChange}
                                                            onBlur={formik.handleBlur}
                                                            invalid={!!(formik.touched.loan && formik.errors.loan)}
                                                        >
                                                            <option value="">Select EMI</option>
                                                            {EmiDetails && EmiDetails.length > 0 ? (
                                                                EmiDetails.map((emi) => (
                                                                    <option key={emi.id} value={emi.id}>{emi.emi_name}</option>
                                                                ))
                                                            ) : (
                                                                <option disabled>Loading EMI details...</option>
                                                            )}
                                                        </Input>
                                                        {formik.errors.loan && formik.touched.loan ? (
                                                            <FormFeedback type="invalid">{formik.errors.loan}</FormFeedback>
                                                        ) : null}
                                                    </div>
                                                </Col>
                                            )}


                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Amount</Label>
                                                    <Input
                                                        type="text"
                                                        name="amount"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Payed Amount"
                                                        value={formik.values.amount}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.amount && formik.errors.amount ? true : false}
                                                    />
                                                    {formik.errors.amount && formik.touched.amount ? (
                                                        <FormFeedback type="invalid">{formik.errors.amount}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Date</Label>
                                                    <Input
                                                        type="date"
                                                        name="expense_date"
                                                        className="form-control"
                                                        id="formrow-Inputexpense_date"
                                                        value={formik.values.expense_date}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.expense_date && formik.errors.expense_date ? true : false}
                                                    />
                                                    {formik.errors.expense_date && formik.touched.expense_date ? (
                                                        <FormFeedback type="invalid">{formik.errors.expense_date}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-Inputpurpose_of_payment">Transaction ID</Label>
                                                    <Input
                                                        type="text"
                                                        name="transaction_id"
                                                        className="form-control"
                                                        id="formrow-Input-transaction_id"
                                                        placeholder="Enter the transaction ID"
                                                        value={formik.values.transaction_id}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.transaction_id && formik.errors.transaction_id ? true : false}
                                                    />
                                                    {formik.errors.transaction_id && formik.touched.transaction_id ? (
                                                        <FormFeedback type="invalid">{formik.errors.transaction_id}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-InputZip">Description</Label>
                                                    <Input
                                                        type="textarea"
                                                        name="description"
                                                        className="form-control"
                                                        id="formrow-InputZip"
                                                        placeholder="Enter Payed description"
                                                        value={formik.values.description}
                                                        onChange={formik.handleChange}
                                                        onBlur={formik.handleBlur}
                                                        invalid={formik.touched.description && formik.errors.description ? true : false}
                                                    />
                                                    {formik.errors.description && formik.touched.description ? (
                                                        <FormFeedback type="invalid">{formik.errors.description}</FormFeedback>
                                                    ) : null}
                                                </div>
                                            </Col>

                                        </Row>
                                        <div>
                                            <button type="submit" className="btn btn-primary w-md">
                                                Submit
                                            </button>
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

export default FormLayouts;
