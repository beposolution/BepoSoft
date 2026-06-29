import React, { useState, useEffect } from "react";
import { Input, Table, Container, Row, Col, Label, Form, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BankModule = () => {
    const [banklist, setBankList] = useState([]);
    const [bankmodule, setBankModule] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    // console.log("baaank: ", bankmodule)


    // const [startDate, endDate] = dateRange;
    const currentDate = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const token = localStorage.getItem("token"); // Retrieve token from storage
        axios
            .get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include token in headers
                },
            })
            .then((response) => {
                setBankList(response.data.data);
                setLoading(false);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    // Clear token and redirect to login
                    localStorage.removeItem("token");
                    alert("Your session has expired. Please log in again.");
                    navigate("/login");
                } else {
                    setError(err);
                    setLoading(false);
                }
            });
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        axios
            .get(`${import.meta.env.VITE_APP_KEY}finance-report/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
                const fullBankData = response?.data?.bank_data;
                setBankModule(fullBankData);
                setLoading(false);

                const today = new Date();
                setStartDate(today);
                setEndDate(today);
                applyFilters(fullBankData, today, today);
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("token");
                    alert("Your session has expired. Please log in again.");
                    navigate("/login");
                } else {
                    setError(err);
                    setLoading(false);
                }
            });
    }, []);


    const calculateCredit = (payments, dateFilter) => {
        if (!payments || payments.length === 0) return 0;

        return payments.reduce((total, payment) => {
            const paymentDate = new Date(payment.received_at).toISOString().split('T')[0];
            const { start, end, date, before } = dateFilter;

            const isInRange = start && end && paymentDate >= start && paymentDate <= end;
            const isExact = date && paymentDate === date;
            const isBefore = before && paymentDate < before;

            if (isInRange || isExact || isBefore) {
                return total + parseFloat(payment.amount);
            }
            return total;
        }, 0);
    };

    const calculateDebit = (banks, dateFilter) => {
        if (!banks || banks.length === 0) return 0;

        return banks.reduce((total, bank) => {
            const expenseDate = new Date(bank.expense_date).toISOString().split('T')[0];
            const { start, end, date, before } = dateFilter;

            const isInRange = start && end && expenseDate >= start && expenseDate <= end;
            const isExact = date && expenseDate === date;
            const isBefore = before && expenseDate < before;

            if (isInRange || isExact || isBefore) {
                return total + parseFloat(bank.amount);
            }
            return total;
        }, 0);
    };

    const calculateClosingBalance = (openBalance, credit, debit) => {
        return parseFloat(openBalance) + credit - debit;
    };

    const applyFilters = (
        rawData = bankmodule,
        start = startDate,
        end = endDate
    ) => {
        const formatDate = (d) => new Date(d).toISOString().split("T")[0];

        const selectedStart = start ? formatDate(start) : null;
        const selectedEnd = end ? formatDate(end) : null;

        if (!selectedStart || !selectedEnd) {
            alert("Please select both start date and end date");
            return;
        }

        const dateFilter = {
            start: selectedStart,
            end: selectedEnd,
        };

        const filtered = rawData.map((customer) => {
            const priorCredit = calculateCredit(customer.payments, {
                before: selectedStart,
            });

            const priorDebit = calculateDebit(customer.banks, {
                before: selectedStart,
            });

            const openingBalance =
                parseFloat(customer.open_balance || 0) + priorCredit - priorDebit;

            const credit = calculateCredit(customer.payments, dateFilter);
            const debit = calculateDebit(customer.banks, dateFilter);

            const closingBalance = openingBalance + credit - debit;

            return {
                ...customer,
                open_balance: openingBalance,
                credit,
                debit,
                closingBalance,
            };
        });

        setBankList(filtered);
    };

    const exportToExcel = () => {
        const exportData = banklist.map((customer, index) => ({
            "#": index + 1,
            Name: customer?.name,
            "Opening Balance (₹)": customer?.open_balance,
            "Credit (₹)": customer?.credit,
            "Debit (₹)": customer?.debit,
            "Closing Balance (₹)": customer?.closingBalance,
        }));

        // Add totals as last row
        exportData.push({
            "#": "",
            Name: "Total",
            "Opening Balance (₹)": total.open_balance,
            "Credit (₹)": total.credit,
            "Debit (₹)": total.debit,
            "Closing Balance (₹)": total.closingBalance,
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Finance Report");

        XLSX.writeFile(workbook, "Finance_Report.xlsx");
    };

    const total = banklist.reduce(
        (acc, customer) => {
            acc.open_balance += parseFloat(customer.open_balance || 0);
            acc.credit += parseFloat(customer.credit || 0);
            acc.debit += parseFloat(customer.debit || 0);
            acc.closingBalance += parseFloat(customer.closingBalance || 0);
            return acc;
        },
        { open_balance: 0, credit: 0, debit: 0, closingBalance: 0 }
    );

    return (
        <React.Fragment>
            <div className="page-content mb-3">
                <Breadcrumbs title="Tables" breadcrumbItem="FINANCE REPORT" />
                <Container fluid={true}>
                    <Form>
                        <Row>
                            <Col md={4}>
                                <div className="mb-3">
                                    <Label>Start Date:</Label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={(date) => setStartDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control"
                                    />
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="mb-3">
                                    <Label>End Date:</Label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={(date) => setEndDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                        className="form-control"
                                    />
                                </div>
                            </Col>

                            <Col md={4}>
                                <div className="mb-3">
                                    <Button
                                        type="button"
                                        className="btn btn-primary mt-4"
                                        onClick={() => applyFilters(bankmodule, startDate, endDate)}
                                    >
                                        Apply Filters
                                    </Button>
                                </div>

                                <Button color="success" onClick={exportToExcel}>
                                    Export to Excel
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Container>
            </div>

            <div>
                <Table bordered striped hover className="mb-3">
                    <caption>List of Bank Information</caption>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>OPB</th>
                            <th>Credit</th>
                            <th>Debit</th>
                            <th>CLB</th>
                        </tr>
                    </thead>
                    <tbody>
                        {banklist.map((customer, index) => (
                            <tr key={customer?.id}>
                                <th scope="row">{index + 1}</th>
                                <td>{customer?.name}</td>
                                <td>
                                    {isNaN(customer?.open_balance) || customer?.open_balance == null
                                        ? "-"
                                        : (customer?.open_balance < 0 ? "- " : "") +
                                        Math.abs(customer?.open_balance).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 2,
                                        })}
                                </td>
                                <td>
                                    {isNaN(customer?.credit) || customer?.credit == null
                                        ? "-"
                                        : (customer?.credit < 0 ? "- " : "") +
                                        Math.abs(customer?.credit).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 2,
                                        })}
                                </td>
                                <td>
                                    {isNaN(customer?.debit) || customer?.debit == null
                                        ? "-"
                                        : (customer?.debit < 0 ? "- " : "") +
                                        Math.abs(customer?.debit).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 2,
                                        })}
                                </td>

                                {/* Closing Balance */}
                                <td>
                                    {isNaN(customer?.closingBalance) || customer?.closingBalance == null
                                        ? "-"
                                        : (customer?.closingBalance < 0 ? "- " : "") +
                                        Math.abs(customer?.closingBalance).toLocaleString("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                            minimumFractionDigits: 2,
                                        })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colSpan="2">Total</th>
                            <th>
                                {total.open_balance.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    minimumFractionDigits: 2,
                                })}
                            </th>
                            <th style={{ color: "green" }}>
                                {total.credit.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    minimumFractionDigits: 2,
                                })}
                            </th>
                            <th style={{ color: "red" }}>
                                {total.debit.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    minimumFractionDigits: 2,
                                })}
                            </th>
                            <th style={{ color: "blue" }}>
                                {total.closingBalance.toLocaleString("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    minimumFractionDigits: 2,
                                })}
                            </th>
                        </tr>
                    </tfoot>
                </Table>
            </div>

        </React.Fragment>
    );
};

export default BankModule;
