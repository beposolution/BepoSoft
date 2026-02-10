import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import Breadcrumbs from "../../../components/Common/Breadcrumb";
import {
    Card,
    CardBody,
    Col,
    Row,
    Label,
    CardTitle,
    Form,
    Input,
    Button
} from "reactstrap";
import Select from "react-select";

const AddSeller = () => {
    document.title = "BEPOSOFT | SELLER DETAILS";

    const token = localStorage.getItem("token");
    const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);

    const [formData, setFormData] = useState({
        name: "",
        company_name: "",
        gstin: "",
        reg_no: "",
        phone: "",
        alt_phone: "",
        email: "",
        address: "",
        zipcode: "",
        country: null,
        state: null
    });


    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}country/codes/`, {
                headers: authHeaders
            })
            .then(res => setCountries(res.data.data || []))
            .catch(() => toast.error("Failed to load countries"));
    }, []);


    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_APP_KEY}states/`, {
                headers: authHeaders
            })
            .then(res => setStates(res.data.data || []))
            .catch(() => toast.error("Failed to load states"));
    }, []);


    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const postDataLog = async (sellerPayload) => {
        const payload = {
            before_data: {
                action: "CREATE_SELLER"
            },
            after_data: {
                name: sellerPayload.name,
                company_name: sellerPayload.company_name,
                gstin: sellerPayload.gstin,
                phone: sellerPayload.phone,
                email: sellerPayload.email,
                country_id: sellerPayload.country,
                state_id: sellerPayload.state
            }
        };

        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                { headers: authHeaders }
            );
        } catch (error) {
            toast.warn("Seller saved, but DataLog creation failed");
        }
    };

    // validation functions

    const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

    const isValidEmail = (email) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isValidGSTIN = (gstin) =>
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);

    const isValidZipcode = (zip) => /^[0-9]{5,6}$/.test(zip);

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error("Seller name is required");
            return false;
        }

        if (!formData.company_name.trim()) {
            toast.error("Company name is required");
            return false;
        }

        if (!formData.phone) {
            toast.error("Phone number is required");
            return false;
        }

        if (!isValidPhone(formData.phone)) {
            toast.error("Phone number must be 10 digits");
            return false;
        }

        if (formData.email && !isValidEmail(formData.email)) {
            toast.error("Invalid email address");
            return false;
        }

        if (formData.gstin && !isValidGSTIN(formData.gstin)) {
            toast.error("Invalid GSTIN format");
            return false;
        }

        if (!formData.zipcode) {
            toast.error("Zipcode is required");
            return false;
        }

        if (!isValidZipcode(formData.zipcode)) {
            toast.error("Invalid zipcode");
            return false;
        }

        if (!formData.country) {
            toast.error("Please select a country");
            return false;
        }

        if (!formData.state) {
            toast.error("Please select a state");
            return false;
        }

        return true;
    };

    // end of validation functions

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            ...formData,
            country: formData.country?.value || null,
            state: formData.state?.value || null
        };

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}product/sellers/details/add/`,
                payload,
                { headers: authHeaders }
            );

            if (response.status === 201) {
                toast.success("Seller details added successfully");

                // datalog creation
                await postDataLog(payload);

                setFormData({
                    name: "",
                    company_name: "",
                    gstin: "",
                    reg_no: "",
                    phone: "",
                    alt_phone: "",
                    email: "",
                    address: "",
                    zipcode: "",
                    country: null,
                    state: null
                });
            }
        } catch (error) {
            toast.error("Failed to add seller details");
        }
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="SELLER" breadcrumbItem="SELLER DETAILS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">
                                        PRODUCT SELLER DETAILS
                                    </CardTitle>

                                    <Form>
                                        <Row>
                                            <Col md={6}>
                                                <Label>Seller Name</Label>
                                                <Input name="name" value={formData.name} onChange={handleChange} />
                                            </Col>
                                            <Col md={6}>
                                                <Label>Company Name</Label>
                                                <Input name="company_name" value={formData.company_name} onChange={handleChange} />
                                            </Col>
                                        </Row>

                                        <Row className="mt-3">
                                            <Col md={6}>
                                                <Label>GSTIN</Label>
                                                <Input name="gstin" value={formData.gstin} onChange={handleChange} />
                                            </Col>
                                            <Col md={6}>
                                                <Label>Reg No</Label>
                                                <Input name="reg_no" value={formData.reg_no} onChange={handleChange} />
                                            </Col>
                                        </Row>

                                        <Row className="mt-3">
                                            <Col md={6}>
                                                <Label>Phone</Label>
                                                <Input
                                                    name="phone"
                                                    maxLength={10}
                                                    onChange={e =>
                                                        handleChange({
                                                            target: {
                                                                name: "phone",
                                                                value: e.target.value.replace(/\D/g, "")
                                                            }
                                                        })
                                                    }
                                                    value={formData.phone}
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <Label>Alternate Phone</Label>
                                                <Input name="alt_phone" value={formData.alt_phone} onChange={handleChange} />
                                            </Col>
                                        </Row>

                                        <Row className="mt-3">
                                            <Col md={6}>
                                                <Label>Email</Label>
                                                <Input name="email" value={formData.email} onChange={handleChange} />
                                            </Col>
                                            <Col md={6}>
                                                <Label>Address</Label>
                                                <Input name="address" value={formData.address} onChange={handleChange} />
                                            </Col>
                                        </Row>

                                        <Row className="mt-3">
                                            <Col md={4}>
                                                <Label>Zipcode</Label>
                                                <Input
                                                    name="zipcode"
                                                    maxLength={6}
                                                    onChange={e =>
                                                        handleChange({
                                                            target: {
                                                                name: "zipcode",
                                                                value: e.target.value.replace(/\D/g, "")
                                                            }
                                                        })
                                                    }
                                                    value={formData.zipcode}
                                                />
                                            </Col>
                                            <Col md={4}>
                                                <Label>Country</Label>
                                                <Select
                                                    value={formData.country}
                                                    onChange={country => setFormData(p => ({ ...p, country }))}
                                                    options={countries.map(c => ({
                                                        label: c.country_code,
                                                        value: c.id
                                                    }))}
                                                    isClearable
                                                />
                                            </Col>
                                            <Col md={4}>
                                                <Label>State</Label>
                                                <Select
                                                    value={formData.state}
                                                    onChange={state => setFormData(p => ({ ...p, state }))}
                                                    options={states.map(s => ({
                                                        label: s.name,
                                                        value: s.id
                                                    }))}
                                                    isClearable
                                                />
                                            </Col>
                                        </Row>

                                        <Button
                                            className="mt-4"
                                            color="primary"
                                            onClick={handleSubmit}
                                            disabled={
                                                !formData.name ||
                                                !formData.phone ||
                                                !formData.company_name ||
                                                !formData.country ||
                                                !formData.state ||
                                                !formData.zipcode
                                            }
                                        >
                                            Add Seller Details
                                        </Button>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
                <ToastContainer />
            </div>
        </React.Fragment>
    );
};

export default AddSeller;
