import React, { useState, useEffect } from "react";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { Card, CardBody, Col, Row, Label, Input, Button, Form, FormGroup, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Paginations from "../../components/Common/Pagination";

const AddRack = () => {
    const [warehouseDetails, setWarehouseDetails] = useState([]);
    const [rackList, setRackList] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [rackName, setRackName] = useState("");
    const [numberOfColumns, setNumberOfColumns] = useState("");
    const token = localStorage.getItem("token");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRack, setEditingRack] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const perPageData = 5;

    const viewWarehouse = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWarehouseDetails(res?.data || []);
        } catch (error) {
            toast.error("Failed to load warehouses.");
        }
    };

    const viewRacks = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_KEY}rack/add/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRackList(res?.data || []);
        } catch (error) {
            toast.error("Failed to load rack data.");
        }
    };

    const postDataLog = async (payload) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_APP_KEY}datalog/create/`,
                payload,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
        } catch (err) {
            // don't block UX on log failure
            console.warn("DataLog create failed:", err?.response?.data || err?.message);
            toast.warn("Rack created, but logging failed.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedWarehouse || !rackName || !numberOfColumns) {
            toast.error("All fields are required");
            return;
        }

        try {
            const payload = {
                warehouse: Number(selectedWarehouse),
                rack_name: rackName.trim(),
                number_of_columns: Number(numberOfColumns),
            };

            const createRes = await axios.post(
                `${import.meta.env.VITE_APP_KEY}rack/add/`,
                payload,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );

            const created = createRes?.data;

            const ORDER_ID_FOR_LOG = null;

            const afterSnapshot = {
                id: created?.id,
                warehouse: created?.warehouse ?? payload.warehouse,
                warehouse_name: created?.warehouse_name,
                rack_name: created?.rack_name ?? payload.rack_name,
                number_of_columns: created?.number_of_columns ?? payload.number_of_columns,
                column_names: created?.column_names ?? [],
            };

            const datalogPayload = {
                ...(ORDER_ID_FOR_LOG ? { order: ORDER_ID_FOR_LOG } : {}),
                before_data: { Action: "New rack Adding" },
                after_data: { Data: afterSnapshot },
            };
            postDataLog(datalogPayload);

            toast.success("Rack added successfully");
            setRackName("");
            setNumberOfColumns("");
            setSelectedWarehouse("");
            viewRacks();
        } catch (error) {
            const msg =
                error?.response?.data?.detail ||
                error?.response?.data?.error ||
                error?.message ||
                "Failed to add rack";
            console.error("Rack create failed:", error?.response || error);
            toast.error(msg);
        }
    };
    useEffect(() => {
        viewWarehouse();
        viewRacks();
    }, []);

    const openModal = async (id) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_APP_KEY}rack/add/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEditingRack(res.data);
            setIsModalOpen(true);
        } catch (error) {
            toast.error("Failed to fetch rack details");
        }
    };

    const handleEditChange = (field, value) => {
        setEditingRack((prev) => ({ ...prev, [field]: value }));
    };

    const handleUpdate = async () => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_APP_KEY}rack/add/${editingRack.id}/`,
                {
                    number_of_columns: editingRack.number_of_columns,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success("Rack updated");
            setIsModalOpen(false);
            viewRacks(); // refresh list
        } catch (error) {
            toast.error(
                error?.response?.data?.error || "Update failed"
            );
        }
    };

    const indexOfLastItem = currentPage * perPageData;
    const indexOfFirstItem = indexOfLastItem - perPageData;
    const currentRackList = rackList.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <React.Fragment>
            <ToastContainer />
            <div className="page-content">
                <div className="container-fluid">
                    <Breadcrumbs title="Beposoft" breadcrumbItem="RACK DETAILS" />
                    <Row>
                        <Col>
                            <Card>
                                <CardBody>
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col xl={3}>
                                                <Label for="warehouse">Select Warehouse</Label>
                                                <Input
                                                    type="select"
                                                    id="warehouse"
                                                    value={selectedWarehouse}
                                                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                                                >
                                                    <option value="">Select Warehouse</option>
                                                    {warehouseDetails.map((w) => (
                                                        <option key={w.id} value={w.id}>
                                                            {w.name} ({w.unique_id})
                                                        </option>
                                                    ))}
                                                </Input>
                                            </Col>

                                            <Col xl={3}>
                                                <Label>Rack Name</Label>
                                                <Input
                                                    type="text"
                                                    value={rackName}
                                                    onChange={(e) => setRackName(e.target.value)}
                                                    placeholder="e.g. A"
                                                />
                                            </Col >

                                            <Col xl={3}>
                                                <Label>Number of Columns</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={numberOfColumns}
                                                    onChange={(e) => setNumberOfColumns(e.target.value)}
                                                    placeholder="e.g. 6"
                                                />
                                            </Col>
                                            <Col xl={3}>
                                                <Button color="primary mt-4" type="submit">Add Rack</Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </CardBody>
                            </Card>
                        </Col>

                        <Col xl={12}>
                            <Card>
                                <CardBody>
                                    <h5 className="mb-3">Rack List</h5>
                                    <Table responsive bordered>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Warehouse</th>
                                                <th>Rack Name</th>
                                                <th>No. of Columns</th>
                                                <th>Column Names</th>
                                                <th>View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentRackList.length > 0 ? (
                                                currentRackList.map((rack, index) => (
                                                    <tr key={rack.id}>
                                                        <td>{indexOfFirstItem + index + 1}</td>
                                                        <td>{rack.warehouse_name || "N/A"}</td>
                                                        <td>{rack.rack_name}</td>
                                                        <td>{rack.number_of_columns}</td>
                                                        <td>{rack.column_names?.join(", ")}</td>
                                                        <td>
                                                            <Button size="sm" color="info" onClick={() => openModal(rack.id)}>
                                                                View
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No rack data found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Paginations
                                        perPageData={perPageData}
                                        data={rackList}
                                        currentPage={currentPage}
                                        setCurrentPage={setCurrentPage}
                                        isShowingPageLength={true}
                                        paginationDiv="d-flex justify-content-end"
                                        paginationClass=""
                                        indexOfFirstItem={indexOfFirstItem}
                                        indexOfLastItem={indexOfLastItem}
                                    />
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
            <Modal isOpen={isModalOpen} toggle={() => setIsModalOpen(false)}>
                <ModalHeader toggle={() => setIsModalOpen(false)}>View/Edit Rack</ModalHeader>
                <ModalBody>
                    {editingRack && (
                        <>
                            <FormGroup>
                                <Label>Warehouse</Label>
                                <Input type="text" value={editingRack.warehouse_name} readOnly />
                            </FormGroup>
                            <FormGroup>
                                <Label>Rack Name</Label>
                                <Input type="text" value={editingRack.rack_name} readOnly />
                            </FormGroup>
                            <FormGroup>
                                <Label>Number of Columns</Label>
                                <Input
                                    type="number"
                                    min={editingRack?.number_of_columns}
                                    value={editingRack.number_of_columns}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value, 10);
                                        if (value >= editingRack.column_names.length) {
                                            handleEditChange("number_of_columns", value);
                                        } else {
                                            toast.warn("You cannot reduce the column count");
                                        }
                                    }}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Column Names</Label>
                                <Input
                                    type="textarea"
                                    value={editingRack.column_names?.join(", ")}
                                    readOnly
                                />
                            </FormGroup>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={handleUpdate}>
                        Update
                    </Button>
                    <Button color="secondary" onClick={() => setIsModalOpen(false)}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </React.Fragment>
    );
};

export default AddRack;
