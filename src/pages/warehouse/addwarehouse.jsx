import React, { useEffect, useState } from "react";
import axios from "axios";
import { Col, Row, Label, Input, Container, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";

const AddWarehousePage = () => {
  const [warehouseData, setWarehouseData] = useState({
    name: "",
    location: "",
  });

  const [warehouseDetails, setWarehouseDetails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [modal, setModal] = useState(false); // Modal visibility state
  const [selectedWarehouse, setSelectedWarehouse] = useState(null); // Selected warehouse for editing

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWarehouseData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addWarehouse = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_KEY}warehouse/add/`,
        warehouseData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Warehouse added successfully", response);

      // Optimistically update the warehouse list in state
      setWarehouseDetails((prev) => [
        ...prev,
        {
          ...warehouseData,
          id: response.data.id, // Assuming the response contains the ID of the new warehouse
        },
      ]);

      // Clear the input fields
      setWarehouseData({ name: "", location: "" });
    } catch (error) {
      console.error("Error adding warehouse:", error);
    }
  };

  const viewWarehouse = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setWarehouseDetails(res?.data || []);
      console.log(res?.data, "warehouse response");
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    viewWarehouse();
  }, []);

  // Pagination logic
  const indexOfLastWarehouse = currentPage * itemsPerPage;
  const indexOfFirstWarehouse = indexOfLastWarehouse - itemsPerPage;

  const currentWarehouses = warehouseDetails.slice(indexOfFirstWarehouse, indexOfLastWarehouse);

  const nextPage = () => {
    if (currentPage < Math.ceil(warehouseDetails.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const editWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse); // Set selected warehouse
    setWarehouseData({ name: warehouse.name, location: warehouse.location }); // Pre-fill the form with data
    setModal(true); // Show the modal
  };

  const saveUpdatedWarehouse = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_APP_KEY}warehouse/update/${selectedWarehouse.id}/`,
        warehouseData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log('Warehouse updated successfully', response);

      setWarehouseDetails((prev) =>
        prev.map((warehouse) =>
          warehouse.id === selectedWarehouse.id ? { ...warehouse, ...warehouseData } : warehouse
        )
      );

      setModal(false);
      setSelectedWarehouse(null);
    } catch (error) {
      console.error('Error updating warehouse:', error);
    }
  };

  return (
    <>
      <React.Fragment>
        <div className="page-content">
          <Container fluid={true}>
            <Row>
              <Col lg={4}>
                <div className="mb-3">
                  <Label htmlFor="formrow-Inputpurpose_of_payment">Warehouse Name</Label>
                  <input
                    name="name"
                    id="formrow-product_type-Input"
                    className="form-control"
                    placeholder="Warehouse name"
                    onChange={handleChange}
                    value={warehouseData.name}
                  />
                </div>
              </Col>

              <Col lg={4}>
                <div className="mb-3">
                  <Label htmlFor="formrow-InputZip">Warehouse Location</Label>
                  <Input
                    type="text"
                    name="location"
                    className="form-control"
                    id="warehouse-loc"
                    placeholder="Enter warehouse location"
                    onChange={handleChange}
                    value={warehouseData.location}
                  />
                </div>
              </Col>

              <Col lg={4}>
                <div className="mb-3 mt-4">
                  <Button onClick={addWarehouse}>Add Warehouse</Button>
                </div>
              </Col>
            </Row>

            <div style={{ marginTop: "20px" }}>
              <Table className="table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Warehouse</th>
                    <th scope="col">Location</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWarehouses.length > 0 ? (
                    currentWarehouses.map((data, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td>{data.name}</td>
                        <td>{data.location}</td>
                        <td>
                          <Button onClick={() => editWarehouse(data)}>Edit</Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No warehouses available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Pagination Controls */}
              <div className="d-flex justify-content-between">
                <Button onClick={prevPage} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button
                  onClick={nextPage}
                  disabled={currentPage === Math.ceil(warehouseDetails.length / itemsPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          </Container>
        </div>
      </React.Fragment>

      {/* Modal for editing warehouse */}
      <Modal isOpen={modal} toggle={() => setModal(!modal)}>
        <ModalHeader toggle={() => setModal(!modal)}>Edit Warehouse</ModalHeader>
        <ModalBody>
          <Label for="name">Warehouse Name</Label>
          <Input
            type="text"
            name="name"
            id="name"
            value={warehouseData.name}
            onChange={handleChange}
          />
          <Label for="location" style={{ marginTop: "10px" }}>
            Warehouse Location
          </Label>
          <Input
            type="text"
            name="location"
            id="location"
            value={warehouseData.location}
            onChange={handleChange}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={saveUpdatedWarehouse}>
            Save Changes
          </Button>
          <Button color="secondary" onClick={() => setModal(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default AddWarehousePage;
