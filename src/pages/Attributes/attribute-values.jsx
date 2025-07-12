import React, { useEffect, useState } from "react";
import { Table, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Input, Label } from "reactstrap";
import { FaEdit, FaTrashAlt } from "react-icons/fa"; // Import icons for edit and delete
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const BasicTable = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newAttribute, setNewAttribute] = useState("");
    const [newAttributeValue, setNewAttributeValue] = useState("");
    const [editingAttribute, setEditingAttribute] = useState(null);
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const token = localStorage.getItem("token");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPageData] = useState(10);

    // Fetch product attributes
    const fetchAttributes = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}add/product/attribute/values/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }

            const data = await response.json();
            setAttributes(data || []);
            setLoading(false);
        } catch (err) {
            setError("Failed to fetch data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, [token]);

    // Fetch available attributes for the dropdown (if available via API)
    useEffect(() => {
        const fetchAvailableAttributes = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attributes/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch attribute options");
                }

                const data = await response.json();
                setAvailableAttributes(data || []);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch attribute options");
                setLoading(false);
            }
        };

        fetchAvailableAttributes();
    }, [token]);


    const handleAddOrUpdateAttribute = async (e) => {

        e.preventDefault();
        const apiUrl = editingAttribute
            ? `${import.meta.env.VITE_APP_KEY}product/attribute/${editingAttribute.id}/update/`
            : `${import.meta.env.VITE_APP_KEY}add/product/attribute/values/`;

        const method = editingAttribute ? "PUT" : "POST";

        try {
            const response = await fetch(apiUrl, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    value: newAttribute,
                    attribute: newAttributeValue // Add selected value for attribute
                })
            });

            if (!response.ok) {
                const errorDetails = await response.text();
                toast.error("Server responded with error:");
                throw new Error(`Failed to ${editingAttribute ? "update" : "add"} attribute`);
            }

            const updatedOrAddedAttribute = await response.json();
            if (editingAttribute) {
                setAttributes(
                    attributes.map((attr) => (attr.id === editingAttribute.id ? updatedOrAddedAttribute : attr))
                );
            } else {
                setAttributes([...attributes, updatedOrAddedAttribute]);
            }

            await fetchAttributes();

            setNewAttribute("");
            setNewAttributeValue(""); // Reset attribute value
            setShowForm(false); // Hide the form after submission
            setEditingAttribute(null); // Clear editing state
        } catch (err) {
            setError(`Failed to ${editingAttribute ? "update" : "add"} attribute`);
        }
    };


    const attributeLookup = availableAttributes.reduce((acc, attr) => {
        acc[attr.id] = attr.name;
        return acc;
    }, {});

    // Handle Delete Action
    const handleDeleteAttribute = async (attributeId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_KEY}product/attribute/delete/${attributeId}/values/`, {
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
        setEditingAttribute(attribute); // Save the full object for ID and update
        setNewAttribute(attribute.value); // The value is what you're editing (e.g., "Red", "Large")
        setNewAttributeValue(attribute.attribute); // This is the attribute ID (e.g., 1 for Color)
        setShowForm(true);
    };

    document.title = "Beposoft | Product Attribute Values";
    
    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentPageAttributes = attributes.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Tables" breadcrumbItem="Product Attribute Values" />

                    <Row>
                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    {loading ? (
                                        <p>Loading...</p>
                                    ) : error ? (
                                        <p className="text-danger">Error: {error}</p>
                                    ) : (
                                        <>
                                            <div className="mb-3">
                                                {/* Add/Update Attribute Button */}
                                                <Button color="primary" onClick={() => setShowForm(!showForm)} className="mt-4">
                                                    {showForm ? "Cancel" : editingAttribute ? "Edit Attribute" : "Add Attribute"}
                                                </Button>

                                                {/* Show Add/Update Attribute Form */}
                                                {showForm && (
                                                    <Form onSubmit={handleAddOrUpdateAttribute} className="mt-4">
                                                        <FormGroup>
                                                            <Label for="attributeValue">Attribute Name</Label>
                                                            <Input
                                                                type="select"
                                                                id="attributeValue"
                                                                value={newAttributeValue}
                                                                onChange={(e) => setNewAttributeValue(e.target.value)}
                                                                required
                                                            >
                                                                <option value="">Select an Attribute Name</option>
                                                                {availableAttributes.map((option) => (
                                                                    <option key={option.id} value={option.id}>
                                                                        {option.name}
                                                                    </option>
                                                                ))}
                                                            </Input>
                                                        </FormGroup>
                                                        <FormGroup>
                                                            <Label for="attributeName">Attribute Value</Label>
                                                            <Input
                                                                type="text"
                                                                id="attributeName"
                                                                value={newAttribute}
                                                                onChange={(e) => setNewAttribute(e.target.value)}
                                                                placeholder="Enter attribute value"
                                                                required
                                                            />
                                                        </FormGroup>
                                                        <Button type="submit" color="success">
                                                            {editingAttribute ? "Update Attribute" : "Add Attribute"}
                                                        </Button>
                                                    </Form>
                                                )}
                                            </div>
                                            <div className="table-responsive">
                                                <Table className="table mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Attribute Name</th>
                                                            <th>Attribute Value</th>
                                                            <th>Update</th>
                                                            {/* <th>Delete</th> */}

                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {attributes && attributes.length > 0 ? ( // Safe check before accessing .length
                                                            currentPageAttributes.map((attribute, index) => (
                                                                <tr key={index}>
                                                                    <td>{indexOfFirstItem + index + 1}</td>
                                                                    <td>{attributeLookup[attribute?.attribute] || ""}</td>
                                                                    <td>{attribute?.value || ""}</td>

                                                                    <td>
                                                                        <Button
                                                                            color="info"
                                                                            onClick={() => handleEditAttribute(attribute)}
                                                                            className="me-2"
                                                                        >
                                                                            <FaEdit />
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
                                        </>
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
