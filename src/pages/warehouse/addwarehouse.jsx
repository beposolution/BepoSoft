import React, { useEffect, useState } from "react";
import axios from "axios";
import { Col, Row, Label, Input, Container, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const AddWarehousePage = () => {
  const [warehouseData, setWarehouseData] = useState({
    name: "",
    address: "",
    location: "",
    country_code: "",
  });

  const [warehouseDetails, setWarehouseDetails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [modal, setModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [countryCodes, setCountryCodes] = useState([]);
  const token = localStorage.getItem("token");

  const fetchCountryCodes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_KEY}country/codes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.status === 'success') {
        setCountryCodes(response.data.data);
      } else {
        toast.error("Failed to fetch country codes.");
      }
    } catch (error) {
      toast.error("Error fetching country codes.");
    }
  };

  useEffect(() => {
    fetchCountryCodes();
  }, [token]);

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

      // Optimistically update the warehouse list in state
      setWarehouseDetails((prev) => [
        ...prev,
        {
          ...warehouseData,
          id: response.data.id,
        },
      ]);

      // Clear the input fields
      setWarehouseData({ name: "", address: "", location: "", country_code: "" });
    } catch (error) {
      toast.error("Error adding warehouse");
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
    } catch (error) {
      toast.error(error);
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
    setSelectedWarehouse(warehouse);
    setWarehouseData({
      name: warehouse.name,
      address: warehouse.address,
      location: warehouse.location,
      country_code: warehouse.country_code,
    });
    setModal(true);
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

      setWarehouseDetails((prev) =>
        prev.map((warehouse) =>
          warehouse.id === selectedWarehouse.id ? { ...warehouse, ...warehouseData } : warehouse
        )
      );

      setModal(false);
      setSelectedWarehouse(null);
    } catch (error) {
      error.error('Error updating warehouse');
    }
  };

  return (
    <>
      <React.Fragment>
        <div className="page-content">
          <Container fluid={true}>
            <Row>
              <Col lg={2}>
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

              <Col lg={2}>
                <div className="mb-3">
                  <Label htmlFor="formrow-InputZip">Warehouse Address</Label>
                  <Input
                    type="text"
                    name="address"
                    className="form-control"
                    id="warehouse-address"
                    placeholder="Enter warehouse address"
                    onChange={handleChange}
                    value={warehouseData.address}
                  />
                </div>
              </Col>

              <Col lg={2}>
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

              <Col lg={2}>
                <div className="mb-3">
                  <Label htmlFor="formrow-InputZip">Country</Label>
                  <Select
                    name="country_code"
                    options={countryCodes.map((country) => ({
                      value: country.id, // Use id, not country_code string
                      label: country.country_code,
                    }))}
                    value={
                      countryCodes
                        .map((country) => ({
                          value: country.id,
                          label: country.country_code,
                        }))
                        .find((option) => option.value === warehouseData.country_code) || null
                    }
                    onChange={(selected) =>
                      setWarehouseData((prev) => ({
                        ...prev,
                        country_code: selected ? selected.value : "",
                      }))
                    }
                    isClearable
                    placeholder="Select Country"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        backgroundColor: "#fff",
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: "#fff",
                        zIndex: 9999,
                      }),
                    }}
                  />
                </div>
              </Col>

              <Col lg={3}>
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
                    <th scope="col">Address</th>
                    <th scope="col">Location</th>
                    <th scope="col">Country</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWarehouses.length > 0 ? (
                    currentWarehouses.map((data, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td>{data.name}</td>
                        <td>{data.address}</td>
                        <td>{data.location}</td>
                        <td>{data.country}</td>
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
          <ToastContainer />
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
          <Label for="address" style={{ marginTop: "10px" }}>Warehouse Address</Label>
          <Input
            type="text"
            name="address"
            id="address"
            value={warehouseData.address}
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
          <Label for="country_code" style={{ marginTop: "10px" }}>
            Country
          </Label>
          <Select
            name="country_code"
            options={countryCodes.map((country) => ({
              value: country.id,
              label: country.country_code,
            }))}
            value={
              countryCodes
                .map((country) => ({
                  value: country.id,
                  label: country.country_code,
                }))
                .find((option) => option.value === warehouseData.country_code) || null
            }
            onChange={(selected) =>
              setWarehouseData((prev) => ({
                ...prev,
                country_code: selected ? selected.value : "",
              }))
            }
            isClearable
            placeholder="Select Country"
            styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: "#fff",
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: "#fff",
                zIndex: 9999,
              }),
            }}
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
