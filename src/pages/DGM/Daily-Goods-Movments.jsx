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
    const [perPageData] = useState(50);
    const [totalAmountSum, setTotalAmountSum] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    const navigate = useNavigate();

    const fetchDailyGoodsMovement = async (page = 1) => {
        try {
            const params = {
                page: page,
                page_size: perPageData
            };

            if (startDate) {
                params.from_date = startDate;
            }

            if (endDate) {
                params.to_date = endDate;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}pagenated/warehouse/box/detail/`,
                {
                    params: params,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const responseData = response.data;

            setTotalCount(responseData.count || 0);

            const resultData = responseData.results || {};
            const summaryData = resultData.summary || {};
            const dailyGoodsData = resultData.data || [];

            setTopProducts(summaryData.top_5_products || []);

            const cleanedData = dailyGoodsData.filter(
                item => item.shipped_date
            );

            setData(cleanedData);
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

    useEffect(() => {
        fetchDailyGoodsMovement(currentPage);
    }, [currentPage]);

    const handleFilter = async () => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchDailyGoodsMovement(1);
        }
    };

    const handleClick = (date) => {
        navigate(`/Movement/${date}`);
    }

    const handleOpenModal = (products) => {
        setSelectedProducts(products || []);
        setModalOpen(true);
    };

    const indexOfFirstItem = (currentPage - 1) * perPageData;
    const indexOfLastItem = indexOfFirstItem + filteredData.length;

    const paginationData = Array.from({ length: totalCount });

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

                                                    <Row className="g-3">
                                                        {topProducts.slice(0, 10).map((product, index) => (
                                                            <Col
                                                                key={index}
                                                                xs={12}   // 1 card in mobile
                                                                sm={6}    // 2 cards in small devices
                                                                md={4}    // 3 cards in tablets
                                                                lg={3}    // 4 cards in laptops
                                                                xl={true} // auto equal width in large screens
                                                                className="d-flex"
                                                                style={{
                                                                    flex: window.innerWidth >= 1200 ? "0 0 20%" : "",
                                                                    maxWidth: window.innerWidth >= 1200 ? "20%" : ""
                                                                }}
                                                            >
                                                                <Card
                                                                    style={{
                                                                        width: "100%",
                                                                        borderRadius: "10px",
                                                                        border: "1px solid #e5e7eb",
                                                                        minHeight: "90px",
                                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                                                                    }}
                                                                >
                                                                    <CardBody className="p-2 d-flex flex-column justify-content-between">

                                                                        <div
                                                                            style={{
                                                                                fontSize: "13px",
                                                                                fontWeight: "600",
                                                                                color: "#1e293b",
                                                                                wordBreak: "break-word",
                                                                                lineHeight: "18px"
                                                                            }}
                                                                        >
                                                                            {product.product_name}
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "center",
                                                                                marginTop: "10px",
                                                                                flexWrap: "wrap",
                                                                                gap: "5px"
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontWeight: "500",
                                                                                    color: "#0d6efd",
                                                                                    fontSize: "13px"
                                                                                }}
                                                                            >
                                                                                Qty : {product.total_quantity}
                                                                            </span>

                                                                            <span
                                                                                style={{
                                                                                    color: "#0d6efd",
                                                                                    fontWeight: "700",
                                                                                    fontSize: "13px"
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
                                                        <th scope="row">{indexOfFirstItem + index + 1}</th>
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
                                            Top 10 Products
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
                                        data={paginationData}
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