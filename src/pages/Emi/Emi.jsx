import React, { useState, useEffect } from "react";
import { Card, Col, Container, Row, CardBody, CardTitle, Label, Form, Input, Table } from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";

const Emi = () => {
    document.title = "EMI Calculator";

    const [emiSchedule, setEmiSchedule] = useState([]);
    const token = localStorage.getItem("token");

    const formik = useFormik({
        initialValues: {
            emi_name: "",
            annual_interest_rate: "",
            tenure_months: "",
            down_payment: "",
            principal: "",
            startdate:"",
            enddate:"",
        },
        validationSchema: Yup.object({
            annual_interest_rate: Yup.number().required("Required"),
            tenure_months: Yup.number().required("Required"),
            down_payment: Yup.number().required("Required"),
            principal: Yup.number().required("Required"),
            startdate:Yup.string().required("start date is required"),
            enddate:Yup.string().required("end date is required"),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const response = await axios.post(`${import.meta.env.VITE_APP_IMAGE}/apis/emi/`, {
                    ...values,
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                toast.success("EMI details submitted successfully");

                resetForm();
                setEmiSchedule([]); // Clear the EMI schedule after submission
            } catch (error) {
                toast.error("Error submitting form:");
            }
        },
    });


    const getMonthName = (index) => {
        const currentDate = new Date(); // Get today's date
        currentDate.setMonth(currentDate.getMonth() + index); // Move forward by 'index' months
        return currentDate.toLocaleString("default", { month: "long", year: "numeric" }); // "March 2025"
    };

    // Function to calculate EMI and generate schedule
    const calculateEMI = () => {
        const { principal, down_payment, annual_interest_rate, tenure_months } = formik.values;
        const P = parseFloat(principal) - parseFloat(down_payment);
        const r = parseFloat(annual_interest_rate) / 12 / 100; // Monthly Interest Rate
        const n = parseInt(tenure_months);

        if (P > 0 && r > 0 && n > 0) {
            const EMI = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            let schedule = [];

            for (let i = 0; i < n; i++) {
                schedule.push({ month: getMonthName(i), emi: EMI.toFixed(2) });
            }

            setEmiSchedule(schedule);
        } else {
            setEmiSchedule([]);
        }
    };

    // Recalculate EMI whenever user inputs change
    useEffect(() => {
        calculateEMI();
    }, [formik.values.principal, formik.values.down_payment, formik.values.annual_interest_rate, formik.values.tenure_months]);

    return (
        <Container fluid={true}>
            <Row>
                <Col xl={12}>
                    <Card className="mt-4">
                        <CardBody className="mt-5">
                            <CardTitle>ADD EMI</CardTitle>
                            <Form onSubmit={formik.handleSubmit}>
                                <Row>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>EMI Name</Label>
                                            <Input
                                                type="text"
                                                name="emi_name"
                                                placeholder="EMI Name"
                                                value={formik.values.emi_name}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>Principal Amount</Label>
                                            <Input
                                                type="number"
                                                name="principal"
                                                placeholder="Enter Principal Amount"
                                                value={formik.values.principal}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>Down Payment</Label>
                                            <Input
                                                type="number"
                                                name="down_payment"
                                                placeholder="Enter Down Payment"
                                                value={formik.values.down_payment}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>Annual Interest Rate (%)</Label>
                                            <Input
                                                type="number"
                                                name="annual_interest_rate"
                                                placeholder="Enter Interest Rate"
                                                value={formik.values.annual_interest_rate}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>Tenure (Months)</Label>
                                            <Input
                                                type="number"
                                                name="tenure_months"
                                                placeholder="Enter Tenure in Months"
                                                value={formik.values.tenure_months}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="mb-3">
                                            <Label>startDate</Label>
                                            <Input
                                                type="Date"
                                                name="startdate"
                                                value={formik.values.startdate}
                                                onChange={formik.handleChange}
                                            />
                                        </div>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={4}>

                                    <div className="mb-3">
                                            <Label>end Date</Label>
                                            <Input
                                                type="Date"
                                                name="enddate"
                                                value={formik.values.enddate}
                                                onChange={formik.handleChange}
                                            />
                                            </div>

                                    </Col>
                                </Row>
                                <Row>
                                    <Col lg={4}>
                                        <button
                                            style={{ margin: "25px 0px", padding: "10px 20px" }}
                                            type="submit"
                                            className="btn btn-primary w-md"
                                        >
                                            Submit
                                        </button>
                                    </Col>
                                </Row>
                            </Form>

                            {/* Show EMI Breakdown Table */}
                            {emiSchedule.length > 0 && (
                                <Row>
                                    <Col xl={12}>
                                        <Card>
                                            <CardBody>
                                                <CardTitle className="mb-4">EMI Schedule</CardTitle>
                                                <Table bordered>
                                                    <thead>
                                                        <tr>
                                                            <th>Month</th>
                                                            <th>EMI Amount (₹)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {emiSchedule.map((item, index) => (
                                                            <tr key={index}>
                                                                <td>{item.month}</td>
                                                                <td>{item.emi}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
            <ToastContainer />
        </Container>
    );
};

export default Emi;
