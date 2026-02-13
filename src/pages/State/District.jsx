import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Label,
  Form,
} from "reactstrap";
import { FaEdit, FaTrash } from "react-icons/fa";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const District = () => {
  const [data, setData] = useState([]);
  const [stat, setStat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [modal, setModal] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    state: "",
  });

  const token = localStorage.getItem("token");
  const toggleModal = () => setModal(!modal);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}districts/add/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setData(response.data.data);
      } else {
        throw new Error("Failed to fetch districts");
      }
    } catch (error) {
      setError(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };


  const getStates = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}states/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setStat(response.data.data);
      }
    } catch (error) {
      console.log("State fetch error", error);
    }
  };

  useEffect(() => {
    fetchData();
    getStates();
  }, [token]);

  
  const columns = useMemo(
    () => [
      {
        header: () => <div style={{ textAlign: "center" }}>ID</div>,
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div style={{ textAlign: "center" }}>{row.index + 1}</div>
        ),
      },
      {
        header: () => <div style={{ textAlign: "center" }}>DISTRICT</div>,
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div style={{ textAlign: "center" }}>{row.original.name}</div>
        ),
      },
      {
        header: () => <div style={{ textAlign: "center" }}>STATE</div>,
        accessorKey: "state_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: ({ row }) => (
          <div style={{ textAlign: "center" }}>
            {row.original.state_name || "-"}
          </div>
        ),
      },
      {
        header: () => <div style={{ textAlign: "center" }}>EDIT</div>,
        accessorKey: "editActions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ row }) => (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button
              className="btn btn-primary d-flex align-items-center"
              style={{ height: "30px", padding: "0 10px" }}
              onClick={() => handleEdit(row.original)}
            >
              <FaEdit style={{ marginRight: "5px" }} />
              Edit
            </button>

            {/* <button
              className="btn btn-danger d-flex align-items-center"
              style={{ height: "30px", padding: "0 10px" }}
              onClick={() => handleDelete(row.original.id)}
            >
              <FaTrash style={{ marginRight: "5px" }} />
              Delete
            </button> */}
          </div>
        ),
      },
    ],
    [data]
  );


  const handleEdit = (district) => {
    setSelectedDistrict(district);
    setIsAddMode(false);

    setFormData({
      name: district.name || "",
      state: district.state || "",
    });

    toggleModal();
  };


  const handleAddDistrict = () => {
    setIsAddMode(true);
    setSelectedDistrict(null);

    setFormData({
      name: "",
      state: "",
    });

    toggleModal();
  };


  //   const handleDelete = async (id) => {
  //     const originalData = [...data];
  //     setData(data.filter((item) => item.id !== id));

  //     try {
  //       await axios.delete(
  //         `${import.meta.env.VITE_APP_KEY}districts/update/${id}/`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );

  //       toast.success("District Deleted Successfully");
  //     } catch (error) {
  //       toast.error("Delete failed");
  //       setData(originalData);
  //     }
  //   };


  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    // Prevent double click
    if (isSubmitting) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error("District name required");
      return;
    }

    if (!formData.state) {
      toast.error("State is required");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isAddMode) {
        // ADD DISTRICT
        const response = await axios.post(
          `${import.meta.env.VITE_APP_KEY}districts/add/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 201 || response.status === 200) {
          toast.success("District Added Successfully");

          await fetchData();

          // Clear form fields
          setFormData({
            name: "",
            state: "",
          });

          toggleModal();
        }
      } else {
        // UPDATE DISTRICT
        const response = await axios.put(
          `${import.meta.env.VITE_APP_KEY}districts/update/${selectedDistrict.id}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          toast.success("District Updated Successfully");

          await fetchData();
          toggleModal();
        }
      }
    } catch (error) {
      toast.error("Save failed");
      setError(error.message || "Failed to save district");
    } finally {
      setIsSubmitting(false);
    }
  };

  document.title = "Districts | Beposoft";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Breadcrumbs title="Tables" breadcrumbItem="DISTRICTS INFORMATION" />

        <Button color="success" onClick={handleAddDistrict} className="mb-4">
          Add District
        </Button>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-danger">Error: {error}</p>
        ) : (
          <TableContainer
            columns={columns}
            data={data || []}
            isGlobalFilter={true}
            isPagination={true}
            SearchPlaceholder="Search by District..."
            pagination="pagination"
            paginationWrapper="dataTables_paginate paging_simple_numbers"
            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
          />
        )}

        <Modal isOpen={modal} toggle={toggleModal}>
          <ModalHeader toggle={toggleModal}>
            {isAddMode ? "Add New District" : "Edit District"}
          </ModalHeader>

          <ModalBody>
            <Form>
              <Label for="name">District Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />

              <Label for="state" className="mt-3">
                Select State
              </Label>
              <Input
                type="select"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              >
                <option value="">Select State</option>
                {stat.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Input>
            </Form>
          </ModalBody>

          <ModalFooter>
            <Button color="secondary" onClick={toggleModal}>
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Please wait..." : isAddMode ? "Add" : "Save"}
            </Button>

          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
};

export default District;
