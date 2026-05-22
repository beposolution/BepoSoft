import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Button,
    Modal,
    ModalHeader,
    ModalBody
} from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination"

const BasicTable = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const token = localStorage.getItem('token');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(15);
    const [totalAmountSum, setTotalAmountSum] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [topProducts, setTopProducts] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/box/detail/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => {

                setTopProducts(response.data[0]?.top_5_products || []);
                const cleanedData = response.data.filter(
                    item => item.shipped_date
                );

                setData(cleanedData);
                setFilteredData(cleanedData);

                const total = cleanedData.reduce(
                    (sum, item) => sum + (item.total_order_amount || 0),
                    0
                );

                setTotalAmountSum(total);

            });
    }, []);

    const handleFilter = async () => {
        try {

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}warehouse/box/detail/`,
                {
                    params: {
                        from_date: startDate,
                        to_date: endDate
                    },
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setTopProducts(response.data[0]?.top_5_products || []);

            const cleanedData = response.data.filter(
                item => item.shipped_date
            );

            setFilteredData(cleanedData);

            const total = cleanedData.reduce(
                (sum, item) => sum + (item.total_order_amount || 0),
                0
            );

            setTotalAmountSum(total);

        } catch (error) {
            console.log(error);
        }
    };

    const handleClick = (date) => {
        navigate(`/Movement/${date}`);
    }

    const handleOpenModal = (products) => {
        setSelectedProducts(products);
        setModalOpen(true);
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="DAILY GOODS MOVEMENT" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>

                                    {/* Date Filter Section */}
                                    <Row className="mb-3 align-items-center">
                                        <Col sm={3}>
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                placeholder="Start Date"
                                            />
                                        </Col>

                                        <Col sm={3}>
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                placeholder="End Date"
                                            />
                                        </Col>

                                        <Col sm={2}>
                                            <Button color="primary" onClick={handleFilter}>
                                                Apply Filters
                                            </Button>
                                        </Col>

                                        {/* <Col sm={2}>
                                            <div
                                                style={{
                                                    background: "#1d4ed8",
                                                    color: "white",
                                                    padding: "8px 12px",
                                                    borderRadius: "8px",
                                                    fontWeight: "bold",
                                                    textAlign: "center",
                                                    fontSize: "13px"
                                                }}
                                            >
                                                Total Amount : ₹ {totalAmountSum.toFixed(2)}
                                            </div>
                                        </Col> */}

                                    </Row>

                                    <Row className="mb-4">
                                        <Col xl={12}>
                                            <Card
                                                style={{
                                                    borderRadius: "10px",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                                                }}
                                            >
                                                <CardBody>

                                                    <h5
                                                        style={{
                                                            fontWeight: "600",
                                                            marginBottom: "15px",
                                                            color: "#1e293b"
                                                        }}
                                                    >
                                                        Top 5 Products
                                                    </h5>

                                                    <Row className="g-2 flex-nowrap">
                                                        {topProducts.map((product, index) => (
                                                            <Col
                                                                className="d-flex"
                                                                key={index}
                                                                style={{
                                                                    flex: "0 0 20%",
                                                                    maxWidth: "20%"
                                                                }}
                                                            >
                                                                <Card
                                                                    style={{
                                                                        minHeight: "70px",
                                                                        borderRadius: "10px",
                                                                        border: "1px solid #e5e7eb",
                                                                        marginBottom: "12px",
                                                                        width: "100%"
                                                                    }}
                                                                >
                                                                    <CardBody className="p-2">

                                                                        <div
                                                                            style={{
                                                                                marginTop: "4px",
                                                                                fontSize: "13px",
                                                                                fontWeight: "600",
                                                                                color: "#1e293b",
                                                                                lineHeight: "15px"
                                                                            }}
                                                                        >
                                                                            {product.product_name}
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                                marginTop: "6px",
                                                                                fontSize: "13px"
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontWeight: "500",
                                                                                    color: "#0d6efd"
                                                                                }}
                                                                            >
                                                                                Qty : {product.total_quantity}
                                                                            </span>

                                                                            <span
                                                                                style={{
                                                                                    color: "#0d6efd",
                                                                                    fontWeight: "700"
                                                                                }}
                                                                            >
                                                                                ₹ {product.total_amount}
                                                                            </span>
                                                                        </div>

                                                                    </CardBody>
                                                                </Card>
                                                            </Col>
                                                        ))}
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>

                                    {/* Table Section */}
                                    <div className="table-responsive">
                                        <Table className="table table-bordered table-sm m-0 text-center">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Date</th>
                                                    <th>Total Boxes Delivered</th>
                                                    <th>Total Volume Wt. (In Kg.)</th>
                                                    <th>Total Actual Wt. (In Kg.)</th>
                                                    <th>Total Delivery Charge</th>
                                                    <th>Total Amount</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((item, index) => (
                                                    <tr key={index}>
                                                        <th scope="row">{index + 1}</th>
                                                        <td>{item.shipped_date}</td>
                                                        <td>{item.total_boxes}</td>
                                                        <td>{item.total_volume_weight}</td>
                                                        <td>
                                                            {item.total_weight
                                                                ? (item.total_weight / 1000).toFixed(2)
                                                                : "-"}
                                                        </td>
                                                        <td>{item.total_shipping_charge}</td>
                                                        <td>
                                                            <span
                                                                onClick={() => handleOpenModal(item.top_5_products)}
                                                                style={{
                                                                    color: "#0d6efd",
                                                                    cursor: "pointer",
                                                                    fontWeight: "bold"
                                                                }}
                                                            >
                                                                ₹ {item.total_order_amount}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button onClick={() => handleClick(item.shipped_date)} style={{ border: "none", background: "blue", color: "white" }}>View</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
                                        <ModalHeader toggle={() => setModalOpen(false)}>
                                            Top 5 Products
                                        </ModalHeader>

                                        <ModalBody>
                                            <Table bordered>
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Product Name</th>
                                                        <th>Total Quantity</th>
                                                        <th>Total Amount</th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {selectedProducts.map((product, index) => (
                                                        <tr key={index}>
                                                            <td>{index + 1}</td>
                                                            <td>{product.product_name}</td>
                                                            <td>{product.total_quantity}</td>
                                                            <td>₹ {product.total_amount}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </ModalBody>
                                    </Modal>

                                    <Paginations
                                        perPageData={perPageData}
                                        data={filteredData}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="mt-3 d-flex justify-content-center"
                                        paginationClass="pagination pagination-rounded"
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                    />
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
