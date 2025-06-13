import React, { useState, useEffect } from "react";
import {
    Table,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
    Button,
} from "reactstrap";
import * as XLSX from "xlsx"; // Import xlsx library

// Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";

const BasicTable = () => {
    document.title = "Filtered Tables | Skote - Vite React Admin & Dashboard Template";

    // State to store table data, filtered data, search query, and loading state
    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    // Fetch data using fetch
    const fetchData = async () => {
        try {
            const url = `${import.meta.env.VITE_APP_KEY}product/stock/report/`;
            console.log("Fetching data from:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();

            // Check if the expected data structure exists
            if (data && data.data) {
                setTableData(data.data);
                setFilteredData(data.data); // Initialize filtered data
            } else {
                console.error("Unexpected response structure:", data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false); // Ensure loading state is updated
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle search input change
    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter data based on the search query
        const filtered = tableData.filter((item) =>
            item.name.toLowerCase().includes(query)
        );
        setFilteredData(filtered);
    };

    const exportToExcel = () => {
        const dataToExport = filteredData.map((item, index) => ({
            "#": index + 1,
            "Name": item.name,
            "Stock": item.stock,
            "Selling Price": item.selling_price,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Product Stock Report");

        XLSX.writeFile(workbook, "Product_Stock_Report.xlsx");
    };


    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="PRODUCT STOCK REPORT" />
                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <div className="d-flex mb-3">
                                        <Input
                                            type="text"
                                            placeholder="Search by product name"
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            className="me-3"
                                        />
                                        <Button color="success" onClick={exportToExcel}>
                                            Export to Excel
                                        </Button>
                                    </div>
                                    <div className="table-responsive">
                                        {loading ? (
                                            <p>Loading...</p>
                                        ) : (
                                            <Table className="table table-bordered mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Image</th>
                                                        <th>Stock</th>
                                                        <th>Selling Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredData.length > 0 ? (
                                                        filteredData.map((item, index) => (
                                                            <tr key={item.id}>
                                                                <th scope="row">{index + 1}</th>
                                                                <td>{item.name}</td>
                                                                <td>
                                                                    <img
                                                                        src={`${import.meta.env.VITE_APP_IMAGE}${item.image}`}
                                                                        alt={item.name}
                                                                        style={{ width: "50px", height: "50px" }}
                                                                    />
                                                                </td>
                                                                <td>{item.stock}</td>
                                                                <td>{item.selling_price}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">
                                                                No results found.
                                                            </td>
                                                        </tr>
                                                    )}
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
