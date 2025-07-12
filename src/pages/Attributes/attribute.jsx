import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Input, Label } from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newAttribute, setNewAttribute] = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null);
    const token = localStorage.getItem("token");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    // Fetch product attributes
    const fetchAttributes = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attributes/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setAttributes(data);
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, [token]);


    const handleAddOrUpdateAttribute = async (e) => {
        e.preventDefault();
        const apiUrl = editingAttribute
            ? `${import.meta.env.VITE_APP_KEY}product/attribute/${editingAttribute.id}/delete/`
            : `${import.meta.env.VITE_APP_KEY}add/product/attributes/`;

        const method = editingAttribute ? "PUT" : "POST";

        try {
            const response = await fetch(apiUrl, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: newAttribute
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to ${editingAttribute ? "update" : "add"} attribute`);
            }

            await fetchAttributes();


            setNewAttribute("");
            setShowForm(false); // Hide the form after submission
            setEditingAttribute(null); // Clear editing state
        } catch (err) {
            setError(`Failed to ${editingAttribute ? "update" : "add"} attribute`);
        }
    };

    // Handle Delete Action
    const handleDeleteAttribute = async (attributeId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attribute/${attributeId}/delete/`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to delete attribute");
            }

            // Remove deleted attribute from the list
            setAttributes(attributes.filter((attr) => attr.id !== attributeId));
        } catch (err) {
            setError("Failed to delete attribute");
        }
    };

    // Handle Edit Action
    const handleEditAttribute = (attribute) => {
        setEditingAttribute(attribute); // Set the current attribute being edited
        setNewAttribute(attribute.name); // Pre-fill the input with the current name
        setShowForm(true); // Show the form to edit
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageData = attributes.slice(indexOfFirstItem, indexOfLastItem);

    document.title = "Basic Tables | Skote - Vite React Admin & Dashboard Template";

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Product Attributes" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p className="text-danger">Error: {error}</p>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table className="table mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Attribute Name</th>
                                                        <th>Update</th>
                                                        {/* <th>Delete</th> */}

                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attributes.length > 0 ? (
                                                        currentPageData.map((attribute, index) => (
                                                            <tr key={index}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>{attribute.name || ""}</td>
                                                                <td>
                                                                    <Button
                                                                        color="info"
                                                                        onClick={() => handleEditAttribute(attribute)}
                                                                        className="me-2"
                                                                    >
                                                                        <FaEdit /> {/* Edit Icon */}
                                                                    </Button>
                                                                </td>
                                                                {/* <td>
                                                                <Button
                                                                        color="danger"
                                                                        onClick={() => handleDeleteAttribute(attribute.id)}
                                                                    >
                                                                        <FaTrashAlt /> 
                                                                    </Button>
                                                                </td> */}
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="text-center">
                                                                No attributes available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                            <Paginations
                                                perPageData={perPageData}
                                                data={attributes}
                                                currentPage={currentPage}
                                                setCurrentPage={setCurrentPage}
                                                isShowingPageLength={true}
                                                paginationDiv="mt-3 d-flex justify-content-center"
                                                paginationClass="pagination pagination-rounded"
                                                indexOfFirstItem={indexOfFirstItem}
                                                indexOfLastItem={indexOfLastItem}
                                            />
                                        </div>
                                    )}

                                    {/* Add/Update Attribute Button */}
                                    <Button color="primary" onClick={() => setShowForm(!showForm)} className="mt-4">
                                        {showForm ? "Cancel" : editingAttribute ? "Edit Attribute" : "Add Attribute"}
                                    </Button>

                                    {/* Show Add/Update Attribute Form */}
                                    {showForm && (
                                        <Form onSubmit={handleAddOrUpdateAttribute} className="mt-4">
                                            <FormGroup>
                                                <Label for="attributeName">Attribute Name</Label>
                                                <Input
                                                    type="text"
                                                    id="attributeName"
                                                    value={newAttribute}
                                                    onChange={(e) => setNewAttribute(e.target.value)}
                                                    placeholder="Enter attribute name"
                                                    required
                                                />
                                            </FormGroup>
                                            <Button type="submit" color="success">
                                                {editingAttribute ? "Update Attribute" : "Add Attribute"}
                                            </Button>
                                        </Form>
                                    )}
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
