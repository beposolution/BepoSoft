import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
    Card, Col, Container, Row, CardBody, CardTitle,
    Table, Spinner
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InternalTransferList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const token = localStorage.getItem("token");

    const fetchTransferData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_APP_KEY}internal/transfers/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response?.data);
        } catch (error) {
            toast.error('Error fetching transfer data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransferData();
    }, []);

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid={true}>
                    <Breadcrumbs title="TRANSFER" breadcrumbItem="BANK TRANSFER DETAILS" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="mb-4">BANK TRANSFER DETAILS</CardTitle>
                                    {loading ? (
                                        <div className="text-center"><Spinner color="primary" /></div>
                                    ) : (
                                        <Table className="table-bordered">
                                            <thead className="thead-light">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Sender Bank</th>
                                                    <th>Receiver Bank</th>
                                                    <th>Amount</th>
                                                    <th>Description</th>
                                                    <th>Created By</th>
                                                    <th>Date</th>
                                                    <th>Transaction ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data?.length > 0 ? (
                                                    data.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{item.sender_bank_name}</td>
                                                            <td>{item.receiver_bank_name}</td>
                                                            <td>₹ {parseFloat(item.amount).toFixed(2)}</td>
                                                            <td>{item.description}</td>
                                                            <td>{item.created_by_name}</td>
                                                            <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                                            <td>{item.transactionID}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center">No transfers found</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    )}
                                    <ToastContainer />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default InternalTransferList;
