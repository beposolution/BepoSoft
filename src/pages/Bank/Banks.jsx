import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import navigation hook
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
} from "reactstrap";

const BasicTable = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const navigate = useNavigate(); // Initialize navigate hook

    // Document title
    document.title = "beposoft | bank details";

    useEffect(() => {
        const token = localStorage.getItem("token"); // Retrieve token from storage
        axios
            .get(`${import.meta.env.VITE_APP_KEY}banks/`, {
                headers: {
                    Authorization: `Bearer ${token}`, // Include token in headers
                },
            })
            .then((response) => {
                setAccounts(response.data.data);
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
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid d-flex justify-content-center">
                    <Row className="w-100">
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4 text-center font-weight-bold text-decoration-underline">
                                        COMPANY ACCOUNTS DETAILS
                                    </CardTitle>
                                    <div className="table-responsive">
                                        <Table className="table table-hover mb-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Name</th>
                                                    <th>A/C NO</th>
                                                    <th>IFSC CODE</th>
                                                    <th>BRANCH</th>
                                                    <th>OPENING BALANCE</th>
                                                    <th>Created User</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map((account, index) => (
                                                    <tr key={account.id}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{account.name}</td>
                                                        <td style={{ color: 'blue' }}>{account.account_number}</td>
                                                        <td>{account.ifsc_code}</td>
                                                        <td>{account.branch}</td>
                                                        <td>{account.open_balance}</td>
                                                        <td>{account.created_user}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BasicTable;
