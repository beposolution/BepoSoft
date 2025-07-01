import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const BasicTable = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const [ role, setRole ] = useState(null);
    const navigate = useNavigate();

    document.title = "Orders | Beposoft";

    useEffect(() =>{
        const role = localStorage.getItem("active");
        setRole(role);
    },[]);

    useEffect(() => {
       if(token && role) fetchOrders(`${import.meta.env.VITE_APP_KEY}orders/`);
    }, [token,role]);


    const fetchOrders = async (url) => {
        if (!url) return;
        try {
            setLoading(true);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if(role === "Warehouse Admin"){
              const filterOrders = response.data.results.filter(order => order.status === "To Print")
                setOrders(filterOrders);
            }else {
            setOrders(response.data.results);
            }
        } catch (error) {
            setError("Error fetching orders data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const viewDeliveryNote = (invoiceId) => {
        navigate(`/order/packing/${invoiceId}/progress/`);     
    }


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Delivery note list" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <CardTitle className="h4"></CardTitle>
                                    <div className="table-responsive">
                                        {loading ? <div>Loading...</div> : error ? <div className="text-danger">{error}</div> : (
                                            <Table className="table mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>INVOICE NO</th>
                                                        <th>CUSTOMER</th>
                                                        <th>STATUS</th>
                                                        <th>BILL AMOUNT</th>
                                                        <th>CREATED AT</th>
                                                        <th>view</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orders.map((order, index) => (
                                                        <tr key={order.id}>
                                                            <th scope="row">{index + 1}</th>
                                                            <td>{order.invoice}</td>
                                                            <td>{order.customer.name}</td>
                                                            <td>{order.status}</td>
                                                            <td>{order.total_amount}</td>
                                                            <td>{order.order_date}</td>
                                                            <td><button onClick={() => viewDeliveryNote(order.id)} style={{padding:"10px 20px", border:"none", background:"#3258a8", color:"white"}}>View</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
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
