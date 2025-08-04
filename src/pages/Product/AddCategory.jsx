import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, Input, Button, Form, FormGroup, Table } from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const AddCategory = () => {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 10;
    const token = localStorage.getItem("token");

    // Fetch all categories
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}product/category/add/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            // response.data is an array, not an object with status/data
            setCategories(response.data);
        } catch (err) {
            toast.error("Error fetching categories.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, [token]);

    // Add new category
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            toast.error("Category name is required.");
            return;
        }
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_APP_KEY}product/category/add/`,
                { category_name: categoryName },   // <-- match serializer field
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data && response.data.message) {
                toast.success(response.data.message);
                setCategoryName("");
                fetchCategories();
            } else {
                toast.error("Failed to add category.");
            }
        } catch (err) {
            toast.error("Error adding category.");
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentData = categories.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Beposoft" breadcrumbItem="CATEGORY DETAILS" />
                    <Row>
                        <Col md={12}>
                            <Card>
                                <CardBody>
                                    <h4 className="mb-3">Add New Category</h4>
                                    <Form onSubmit={handleSubmit}>
                                        <FormGroup>
                                            <Label for="categoryName">Category Name</Label>
                                            <Input
                                                id="categoryName"
                                                type="text"
                                                value={categoryName}
                                                onChange={(e) => setCategoryName(e.target.value)}
                                                placeholder="Enter category name"
                                            />
                                        </FormGroup>
                                        <Button color="primary" type="submit" disabled={loading}>
                                            Add Category
                                        </Button>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>
                        <Col md={12}>
                            <Card>
                                <CardBody>
                                    <h4 className="mb-3">Category List</h4>
                                    <Table bordered>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" className="text-center">No categories found</td>
                                                </tr>
                                            ) : (
                                                currentData.map((cat, idx) => (
                                                    <tr key={cat.id}>
                                                        <td>{indexOfFirstItem + idx + 1}</td>
                                                        <td>{cat.category_name}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                    <Paginations
                                        perPageData={perPageData}
                                        data={categories}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="col-auto"
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

export default AddCategory;
