import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import { Card, CardBody, Col, Container, Row, Table } from "reactstrap";
import { isEmpty, map } from "lodash";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";
import { getInvoiceDetail as onGetInvoiceDetail } from "../../store/invoices/actions";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

const InvoiceDetail = (props) => {
    document.title = "Invoice Detail | beposoft";

    const dispatch = useDispatch();
    const { invoice } = useParams();
    const [orderItems, setOrderItems] = useState([]);
    const [order, setOrders] = useState([]);
    const [bankDetails, setBankDetails] = useState([]);
    const [shippingAddress, setShippingAddress] = useState({});
    const [billingAddress, setBillingAddress] = useState({});

    const InvoicesDetailProperties = createSelector(
        (state) => state.invoices,
        (Invoices) => ({
            invoiceDetail: Invoices.invoiceDetail,
        })
    );
    const quantityTotal = orderItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const discountTotal = orderItems.reduce((acc, item) => acc + ((item.discount || 0) * (item.quantity || 0)), 0);
    const subTotal = orderItems.reduce((acc, item) => acc + ((item.rate || 0) - (item.discount || 0)) * (item.quantity || 1), 0).toFixed(2);
    const total = (parseFloat(subTotal) + parseFloat(order.shipping_charge || 0)).toFixed(2);
    const TotalActualPrice = orderItems.reduce((acc, item) => acc + ((item.actual_price || 0) * (item.quantity || 0)), 0);



    const { invoiceDetail } = useSelector(InvoicesDetailProperties);
    const params = props.router.params;
    const Total = orderItems.reduce((acc, item) => {
        const rate = item.rate || 0;
        const discount = item.discount || 0;
        const quantity = item.quantity || 1;
        return acc + (rate - discount) * quantity;
    }, 0).toFixed(2);

    const SubTotal = orderItems.reduce((acc, item) => {
        const rate = item.rate || 0;
        const discount = item.discount || 0;
        const quantity = item.quantity || 1;
        return acc + (rate * quantity);
    }, 0).toFixed(2);

    useEffect(() => {
        if (params && params.id) {
            dispatch(onGetInvoiceDetail(params.id));
        } else {
            dispatch(onGetInvoiceDetail(1));
        }
        fetchOrderData();
    }, [params.id]);

    //Print the Invoice
    const printInvoice = () => {
        window.print();
    };

    const fetchOrderData = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APP_KEY}perfoma/${invoice}/invoice/`,
                {
                    method: 'GET',
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem('token')}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Error fetching order data");
            }

            const data = await response.json();
            console.log("Fetched data:", data);

            if (data) {
                setOrders({
                    ...data.data,
                    shipping: data.shipping_charge || 0, // add shipping field from data object
                    order_date: data.order_date || '',
                    company :data.company || '',
                });
                setOrderItems(data.perfoma_items);
                setShippingAddress(data.customer);
                setBillingAddress(data.billing_address);
                setBankDetails(data.bank);
            }
        } catch (error) {
            console.error("Error fetching order data:", error);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Breadcrumbs title="Invoices" breadcrumbItem="Invoice Detail" />
                    {!isEmpty(invoiceDetail) && (
                        <Row>
                            <Col lg={12}>
                                <Card>
                                    <CardBody>
                                        <div className="invoice-title">
                                            <h4 className="float-end font-size-16">
                                                Order # {invoice}
                                            </h4>
                                            <div className="invoice-title d-flex justify-content-between align-items-center">
                                                <h2 className="mt-4 text-center flex-grow-1">{order.company || 'Company Name Not Available'}</h2>
                                            </div>

                                        </div>
                                        <hr />
                                        <Row className="my-4">
                                            <Col sm={6}>
                                                <address className="border rounded p-3">
                                                    <h5 className="mb-3"><strong>Billed To:</strong></h5>
                                                    {billingAddress && Object.keys(billingAddress).length > 0 ? (
                                                        <React.Fragment>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-account-circle me-2"></i>
                                                                {billingAddress.name}
                                                            </p>
                                                            {billingAddress.gst ? (
                                                                <p className="mb-1">
                                                                    <i className="mdi mdi-identifier me-2"></i>
                                                                    GST Number: {billingAddress.gst}
                                                                </p>
                                                            ) : (
                                                                <p className="mb-1 text-muted">No GST Number</p>
                                                            )}
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-home-outline me-2"></i>
                                                                {billingAddress.address}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-map-marker me-2"></i>
                                                                {billingAddress.city}, {billingAddress.state} {billingAddress.zip_code}, {billingAddress.country}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-phone me-2"></i>
                                                                {billingAddress.phone}
                                                            </p>
                                                            {billingAddress.alt_phone ? (
                                                                <p className="mb-1">
                                                                    <i className="mdi mdi-phone-in-talk me-2"></i>
                                                                    Alternate Phone: {billingAddress.alt_phone}
                                                                </p>
                                                            ) : (
                                                                <p className="mb-1 text-muted">No Alternate Phone</p>
                                                            )}
                                                        </React.Fragment>
                                                    ) : (
                                                        <span>No Billing Address</span>
                                                    )}
                                                </address>
                                            </Col>

                                            <Col sm={6} className="text-sm-end">
                                                <address className="border rounded p-3">
                                                    <h5 className="mb-3"><strong>Shipped To:</strong></h5>
                                                    {shippingAddress && Object.keys(shippingAddress).length > 0 ? (
                                                        <React.Fragment>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-account-circle me-2"></i>
                                                                {shippingAddress.name}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-home-outline me-2"></i>
                                                                {shippingAddress.address}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-map-marker me-2"></i>
                                                                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}, {shippingAddress.country}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-phone me-2"></i>
                                                                {shippingAddress.phone}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-email-outline me-2"></i>
                                                                {shippingAddress.email}
                                                            </p>
                                                        </React.Fragment>
                                                    ) : (
                                                        <span>No Shipping Address</span>
                                                    )}
                                                </address>
                                            </Col>
                                        </Row>


                                        <Row className="my-4">
                                            <Col sm={6} className="mt-3">
                                                <address className="border rounded p-3">
                                                    <h5 className="mb-3"><strong>Payment Method:</strong></h5>
                                                    {bankDetails ? (
                                                        <React.Fragment>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-bank me-2"></i>
                                                                Bank: {bankDetails.name || 'N/A'}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-bank-outline me-2"></i>
                                                                Account Number: {bankDetails.account_number || 'N/A'}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-barcode me-2"></i>
                                                                IFSC Code: {bankDetails.ifsc_code || 'N/A'}
                                                            </p>
                                                            <p className="mb-1">
                                                                <i className="mdi mdi-map-marker me-2"></i>
                                                                Branch: {bankDetails.branch || 'N/A'}
                                                            </p>
                                                        </React.Fragment>
                                                    ) : (
                                                        <p className="text-muted">No Bank Details Available</p>
                                                    )}
                                                </address>
                                            </Col>

                                            <Col sm={6} className="mt-3 text-sm-end">
                                                <address className="border rounded p-3">
                                                    <h5 className="mb-3"><strong>Order Date:</strong></h5>
                                                    {order.order_date ? (
                                                        <p className="mb-1">
                                                            <i className="mdi mdi-calendar-outline me-2"></i>
                                                            {order.order_date}
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted">No Order Date Available</p>
                                                    )}
                                                </address>
                                            </Col>

                                        </Row>


                                        <div className="py-2 mt-3">
                                            <h3 className="font-size-15 fw-bold">Order summary</h3>
                                        </div>
                                        <div className="table-responsive">
                                            <Table className="table-nowrap">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "70px" }}>No.</th>
                                                        <th>Image</th>
                                                        <th>Item</th>
                                                        <th>Rate</th>
                                                        <th>Tax</th>
                                                        <th>Tax Amount</th>
                                                        <th>Price</th>
                                                        <th>Quantity</th>
                                                        <th>Discount</th>
                                                        <th className="text-end">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {orderItems.map((item, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>
                                                                <img
                                                                    src={`http://localhost:8000${item.images[0]}`}
                                                                    alt={item.name}
                                                                    style={{
                                                                        width: '50px',
                                                                        height: '50px',
                                                                        objectFit: 'cover',
                                                                        borderRadius: '5px',
                                                                    }}
                                                                />
                                                            </td>
                                                            <td>{item.name || 'Unnamed Item'}</td>
                                                            <td className="text-end">{item.exclude_price != null ? item.exclude_price.toFixed(2) : 'N/A'}</td>
                                                            <td className="text-end">{item.tax != null ? item.tax.toFixed(2) : 'N/A'}%</td>
                                                            <td className="text-end">
                                                                {item.actual_price != null && item.exclude_price != null
                                                                    ? (item.actual_price - item.exclude_price).toFixed(2)
                                                                    : 'N/A'}
                                                            </td>
                                                            <td className="text-center">{item.quantity != null ? item.quantity : 'N/A'}</td>
                                                            <td className="text-end">{item.rate != null ? item.rate.toFixed(2) : 'N/A'}</td>
                                                            <td className="text-end">{item.discount != null ? item.discount.toFixed(2) : 'N/A'}</td>
                                                            <td className="text-end">
                                                                {item.rate != null && item.discount != null && item.quantity != null
                                                                    ? ((item.rate - item.discount) * item.quantity).toFixed(2)
                                                                    : 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Totals Row */}
                                                    <tr className="table-light">
                                                        <td colSpan={6} className="text-end">
                                                            <strong>Totals</strong>
                                                        </td>
                                                        <td className="text-end">{TotalActualPrice.toFixed(2)}</td>
                                                        <td className="text-center">{quantityTotal}</td>
                                                        <td className="text-end">{discountTotal.toFixed(2)}</td>
                                                        <td className="text-end">{Total}</td>
                                                    </tr>
                                                    {/* Subtotal Row */}
                                                    <tr>
                                                        <td colSpan={9} className="text-end">
                                                            <strong>Sub Total</strong>
                                                        </td>
                                                        <td className="text-end">{subTotal}</td>
                                                    </tr>
                                                    {/* Shipping Row */}
                                                    <tr>
                                                        <td colSpan={9} className="border-0 text-end">
                                                            <strong>Shipping</strong>
                                                        </td>
                                                        <td className="border-0 text-end">{order.shipping_charge || '0'}</td>
                                                    </tr>
                                                    {/* Final Total Row */}
                                                    <tr className="table-light">
                                                        <td colSpan={9} className="border-0 text-end">
                                                            <strong>Total</strong>
                                                        </td>
                                                        <td className="border-0 text-end">
                                                            <h4 className="m-0">{total}</h4>
                                                        </td>
                                                    </tr>
                                                </tbody>

                                            </Table>
                                        </div>

                                        <div className="d-print-none">
                                            <div className="float-end">
                                                <Link
                                                    to="#"
                                                    onClick={printInvoice}
                                                    className="btn btn-success me-2"
                                                >
                                                    <i className="fa fa-print" />
                                                </Link>
                                                <Link to="#" className="btn btn-primary w-md">
                                                    Send
                                                </Link>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        </React.Fragment>
    );
};

InvoiceDetail.propTypes = {
    match: PropTypes.any,
};

export default withRouter(InvoiceDetail);
