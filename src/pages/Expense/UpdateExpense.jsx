import React, { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Input, Label, Row, Button, Form } from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UpdateExpense = () => {
    const { id } = useParams(); // Get expense ID from URL
    const token = localStorage.getItem("token")
    const [companies, setCompanies] = useState([]);
    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [EmiDetails, setEmiDetails] = useState([]);
    const [category, setCategory] = useState([]);
    const [purposeOfPayment, setPurposeOfPayment] = useState([]);
    const navigate = useNavigate();
    const [expense, setExpense] = useState(null);
    const [userData, setUserData] = useState();

    const expenseId = id;

    // For editable form fields
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                // First fetch the expense record using the basic list endpoint
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}expense/add/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const allExpenses = response.data.data;
                const matchedExpense = allExpenses.find(item => String(item.id) === String(expenseId));
                setExpense(matchedExpense);
                // Initialize formData with matchedExpense
                setFormData({
                    company: matchedExpense?.company?.id || "",
                    payed_by: matchedExpense?.payed_by?.id || "",
                    bank: matchedExpense?.bank?.id || "",
                    asset_types: matchedExpense?.asset_types || "expenses",
                    name: matchedExpense?.name || "Expense",
                    quantity: matchedExpense?.quantity || 0,
                    category: matchedExpense?.category_id || "",
                    purpose_of_payment: matchedExpense?.purpose_of_payment?.toString() || "", // <-- use ID, not name!
                    purpose_of_pay: matchedExpense?.purpose_of_pay || "",
                    date: matchedExpense?.expense_date || "",
                    emi_details: matchedExpense?.loan ? String(matchedExpense.loan) : "",
                    transaction_id: matchedExpense?.transaction_id || "",
                    description: matchedExpense?.description || "",
                    amount: matchedExpense?.amount || "",
                    expense_type: matchedExpense?.expense_type || "",
                });
            } catch (error) {
                toast.error("Error fetching expense data:");
            }
        };
        fetchExpense();
    }, [expenseId, token]);

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
                setCategory(Array.isArray(fetchCategory?.data) ? fetchCategory?.data : []);

                const fetchPurposeOfPayment = await axios.get(`${import.meta.env.VITE_APP_IMAGE}/apis/add/purpose/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                })
                setPurposeOfPayment(Array.isArray(fetchPurposeOfPayment?.data) ? fetchPurposeOfPayment?.data : []);

            } catch (error) {
                alert("An error occurred while fetching the data.");
            }
        };

        fetchData();
    }, [token]);

    // Handle form input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle update submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        const selectedPurpose = purposeOfPayment.find(
            p => p.id.toString() === (formData.purpose_of_payment || "")
        );
        const isEmi = (selectedPurpose?.name || "").toLowerCase() === "emi";

        // If EMI, require loan
        if (isEmi) {
            const loanId = parseInt(formData.emi_details, 10);
            if (!Number.isInteger(loanId)) {
                alert("Please select an EMI (loan) for EMI payments.");
                return;
            }
        }

        // If EMI, force asset_types to expenses
        const assetType = isEmi ? "expenses" : (formData.asset_types || "expenses");

        const payload = {
            company: parseInt(formData.company, 10),
            payed_by: parseInt(formData.payed_by, 10),
            bank: parseInt(formData.bank, 10),
            purpose_of_payment: formData.purpose_of_payment
                ? parseInt(formData.purpose_of_payment, 10)
                : null,
            amount: formData.amount,
            expense_date: formData.date,
            transaction_id: formData.transaction_id,
            description: formData.description,
            expense_type: formData.expense_type || null,
            asset_types: assetType,
            ...(assetType === "assets" && {
                name: formData.name,
                quantity: formData.quantity ? parseInt(formData.quantity, 10) : null,
                category: formData.category ? parseInt(formData.category, 10) : null,
            }),
            ...(isEmi && { loan: parseInt(formData.emi_details, 10) }),
        };

        // Pick the correct endpoint
        const apiUrl = isEmi
            ? `${import.meta.env.VITE_APP_KEY}expense/get/${expenseId}/`                // serializer includes "loan"
            : (assetType === "assets"
                ? `${import.meta.env.VITE_APP_KEY}asset/update/${expenseId}/`
                : `${import.meta.env.VITE_APP_KEY}expense/addexpectemiupdate/${expenseId}/`);

        try {
            await axios.put(apiUrl, payload, { headers: { Authorization: `Bearer ${token}` } });
            alert("Expense updated successfully!");
            navigate("/expense/list");
        } catch (error) {
            const msg = error?.response?.data
                ? JSON.stringify(error.response.data)
                : "Failed to update expense.";
            alert("Failed to update expense: " + msg);
        }
    };


    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="EXPENSE UPDATE" />
                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardBody>
                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={3}>
                                            <div className="mb-3">
                                                <Label>Company</Label>
                                                <select className="form-control"
                                                    type="select"
                                                    name="company"
                                                    value={formData.company || ""}
                                                    onChange={handleChange}
                                                >
                                                    <option value="" label="Select Your Company" />
                                                    {companies.map((company) => (
                                                        <option key={company.id} value={company.id}>
                                                            {company.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="mb-3">
                                                <Label>Payed By</Label>
                                                <select className="form-control" name="payed_by" type="select" value={formData.payed_by || ""} onChange={handleChange} >
                                                    <option value="" label="Select Payed By" />
                                                    {staffs.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="mb-3">
                                                <Label>Bank</Label>
                                                <select className="form-control" name="bank" type="select" value={formData.bank || ""} onChange={handleChange} >
                                                    <option value="" label="Select Bank" />
                                                    {banks.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {option.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </Col>
                                        <Col md={3}>
                                            <div className="mb-3">
                                                <Label htmlFor="formrow-expense-type">Type of Expense</Label>
                                                <Input
                                                    type="select"
                                                    name="expense_type"
                                                    id="formrow-expense-type"
                                                    className="form-control"
                                                    value={formData.expense_type || ""}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="miscellaneous">Miscellaneous</option>
                                                    <option value="permanent">Permanent</option>
                                                    <option value="emi">EMI</option>
                                                    <option value="cargo">Cargo</option>
                                                    <option value="purchase">Purchase</option>
                                                </Input>
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={4}>
                                            <div className="mb-3">
                                                <Label>Type of Payment</Label>
                                                <select className="form-control" name="asset_types" type="select" value={formData.asset_types || ""} onChange={handleChange} >
                                                    <option value="">Select Payment</option>
                                                    <option value="assets" label="Asset" />
                                                    <option value="expenses" label="Expense" />
                                                </select>
                                            </div>
                                        </Col>
                                        {formData.asset_types === "assets" && (
                                            <>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>Name</Label>
                                                        <Input name="name" value={formData.name || ""} onChange={handleChange} />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>Quantity</Label>
                                                        <Input name="quantity" value={formData.quantity || ""} onChange={handleChange} />
                                                    </div>
                                                </Col>
                                                <Col md={4}>
                                                    <div className="mb-3">
                                                        <Label>Select Category</Label>
                                                        <select className="form-control" name="category" type="select" value={formData.category || ""} onChange={handleChange} >
                                                            <option value="" label="Select Category" />
                                                            {category.map((c) => (
                                                                <option key={c.id} value={c.id}>{c.category_name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </Col>
                                            </>)}
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
                                                            setPurposeOfPayment(Array.isArray(fetchPurposeOfPayment.data.data) ? fetchPurposeOfPayment.data.data : []);
                                                            // Select the new purpose if API returns its id
                                                            if (res.data && res.data.id) {
                                                                setFormData(prev => ({ ...prev, purpose_of_pay: res.data.id.toString() }));
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
                                                    className="form-control"
                                                    value={formData.purpose_of_payment || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData(prev => ({ ...prev, purpose_of_payment: value }));
                                                        const p = purposeOfPayment.find(pp => pp.id.toString() === value);
                                                        const isEmi = (p?.name || "").toLowerCase() === "emi";
                                                        if (isEmi) {
                                                            // Flip to expenses, hide/clear asset-only fields
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                asset_types: "expenses",
                                                                name: "",
                                                                quantity: "",
                                                                category: ""
                                                            }));
                                                        }
                                                    }}
                                                >
                                                    <option value="">Choose...</option>
                                                    {purposeOfPayment
                                                        .filter((type) => type.name)
                                                        .map((p) => (
                                                            <option key={p.id} value={p.id.toString()}>{p.name}</option>
                                                        ))}
                                                </select>
                                            </div>
                                        </Col>

                                        {purposeOfPayment.find(p => p.id.toString() === formData.purpose_of_payment)?.name?.toLowerCase() === "emi" && (
                                            <Col lg={4}>
                                                <div className="mb-3">
                                                    <Label htmlFor="formrow-loan">Select EMI</Label>
                                                    <select
                                                        className="form-control"
                                                        name="emi_details"
                                                        type="select"
                                                        value={formData.emi_details}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">Select EMI</option>{
                                                            EmiDetails.map((emi) => (
                                                                <option key={emi.id} value={emi.id.toString()}>{emi.emi_name}</option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            </Col>
                                        )}

                                        <Col lg={4}>
                                            <div className="mb-3">
                                                <Label>Date</Label>
                                                <input type="date" className="form-control" name="date" value={formData.date || ""} onChange={handleChange} />
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="mb-3">
                                                <Label>Amount</Label>
                                                <input type="text" className="form-control" name="amount" value={formData.amount} onChange={handleChange} />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col lg={4}>
                                            <div className="mb-3">
                                                <Label>Transaction ID</Label>
                                                <Input name="transaction_id" value={formData.transaction_id || ""} onChange={handleChange} />
                                            </div>
                                        </Col>
                                        <Col lg={4}>
                                            <div className="mb-3">
                                                <Label>Description</Label>
                                                <Input type="textarea" name="description" value={formData.description || ""} onChange={handleChange} />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Button color="primary" type="submit">Update Expense</Button>
                                </Form>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default UpdateExpense;