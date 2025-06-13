import React, { useEffect, useState } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Input, Label, Row, Button, Form } from "reactstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const UpdateExpense = () => {
    const { id } = useParams(); // Get expense ID from URL
    const token = localStorage.getItem("token")
    const [companies, setCompanies] = useState([]);
    const [banks, setBanks] = useState([]);
    const [staffs, setStaffs] = useState([]);
    const [EmiDetails, setEmiDetails] = useState("");
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
                });
            } catch (error) {
                console.error("Error fetching expense data:", error);
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
                console.error('Error fetching user data:', error);
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
                console.error("Error fetching data:", error);
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
        try {
            const payload = {
                ...formData,
                ...(formData.purpose_of_pay === "emi" ? { loan: formData.emi_details } : {}),
            };

            let apiUrl = "";
            // Condition 1: asset_types === "asset"
            if (formData.asset_types === "assets") {
                apiUrl = `${import.meta.env.VITE_APP_KEY}asset/update/${expenseId}/`;
            } else if (formData.asset_types === "expenses") {
                // You had some confusing logic; make sure it covers all cases correctly:
                if (formData.purpose_of_pay === "emi") {
                    apiUrl = `${import.meta.env.VITE_APP_KEY}expense/get/${expenseId}/`; // or the correct API for EMI update
                } else {
                    apiUrl = `${import.meta.env.VITE_APP_KEY}expense/addexpectemiupdate/${expenseId}/`;
                }
            }
            // Condition 3: asset_types === "expense" and purpose_of_pay === "emi"
            else {
                alert("Invalid asset type or purpose of pay.");
                return;
            }

            await axios.put(
                apiUrl,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            alert("Expense updated successfully!");
            navigate("/expense/list");
        } catch (error) {
            if (error.response && error.response.data) {
                alert("Failed to update expense: " + JSON.stringify(error.response.data));
            } else {
                alert("Failed to update expense.");
            }
            console.error(error);
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
                                        <Col md={4}>
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
                                        <Col md={4}>
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
                                        <Col md={6} lg={3}>
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
                                                        <Label>Item</Label>
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
                                                    id="formrow-product_type-Input"
                                                    className="form-control"
                                                    value={formData.purpose_of_payment || ""}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Choose...</option>
                                                    {purposeOfPayment
                                                        .filter((type) => type.name) // Only show items with a valid name
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