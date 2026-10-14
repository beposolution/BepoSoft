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
import { createAuditLog } from "../../services/auditService";

const District = () => {
  const [data, setData] = useState([]);
  const [stat, setStat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [modal, setModal] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalAuditData, setOriginalAuditData] = useState(null);

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
        setError(null);
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

  const getStateNameById = (stateId) => {
    if (!stateId) return "";

    const selectedState = stat.find(
      (item) => String(item.id) === String(stateId)
    );

    return selectedState?.name || "";
  };


  const handleEdit = (district) => {
    setSelectedDistrict(district);
    setIsAddMode(false);

    const stateId =
      district.state?.id ??
      district.state ??
      "";

    const stateName =
      district.state_name ||
      getStateNameById(stateId);

    // Save ORIGINAL values for audit log
    setOriginalAuditData({
      name: district.name || "",
      state: stateName || "",
    });

    setFormData({
      name: district.name || "",
      state: stateId,
    });

    setModal(true);
  };


  const handleAddDistrict = () => {
    setIsAddMode(true);
    setSelectedDistrict(null);
    setOriginalAuditData(null);

    setFormData({
      name: "",
      state: "",
    });

    setModal(true);
  };

  const clearForm = () => {
    setFormData({
      name: "",
      state: "",
    });

    setSelectedDistrict(null);
    setOriginalAuditData(null);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;

    clearForm();
    setIsAddMode(false);
    setModal(false);
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
    // Prevent duplicate submission
    if (isSubmitting) return;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!formData.name.trim()) {
      toast.error("District name required");
      return;
    }

    if (!formData.state) {
      toast.error("State is required");
      return;
    }

    try {
      // -----------------------------
      // START LOADING
      // -----------------------------

      setIsSubmitting(true);

      const stateName = getStateNameById(formData.state);

      // ==========================================================
      // ADD DISTRICT
      // ==========================================================

      if (isAddMode) {
        const response = await axios.post(
          `${import.meta.env.VITE_APP_KEY}districts/add/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 201 ||
          response.status === 200
        ) {
          // -----------------------------
          // CREATE AUDIT LOG
          // -----------------------------

          try {
            const createdDistrict =
              response?.data?.data || null;

            await createAuditLog({
              action: "district_created_website",

              beforeData: {},

              afterData: {
                name:
                  createdDistrict?.name ||
                  formData.name,

                state:
                  createdDistrict?.state_name ||
                  stateName,
              },
            });
          } catch (auditError) {
            console.error(
              "District created but audit log failed:",
              auditError
            );
          }

          toast.success(
            "District Added Successfully"
          );

          // Refresh table
          await fetchData();

          // -----------------------------
          // CLEAR ALL FIELDS
          // -----------------------------

          clearForm();

          setIsAddMode(false);

          // Close modal
          setModal(false);
        }
      }

      // ==========================================================
      // UPDATE DISTRICT
      // ==========================================================

      else {
        if (!selectedDistrict?.id) {
          toast.error(
            "Invalid district selected"
          );
          return;
        }

        const afterData = {
          name: formData.name,
          state: stateName,
        };

        const response = await axios.put(
          `${import.meta.env.VITE_APP_KEY}districts/update/${selectedDistrict.id}/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 200 ||
          response.status === 201
        ) {
          // -----------------------------
          // CREATE AUDIT LOG
          // -----------------------------

          try {
            await createAuditLog({
              action: "district_updated_website",

              beforeData:
                originalAuditData || {},

              afterData: afterData,
            });
          } catch (auditError) {
            console.error(
              "District updated but audit log failed:",
              auditError
            );
          }

          toast.success(
            "District Updated Successfully"
          );

          // Refresh table
          await fetchData();

          // -----------------------------
          // CLEAR ALL FIELDS
          // -----------------------------

          clearForm();

          setIsAddMode(false);

          // Close modal
          setModal(false);
        }
      }
    } catch (error) {
      console.error(
        "District save error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Save failed"
      );
    } finally {
      // -----------------------------
      // STOP LOADING
      // -----------------------------

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

        <Modal
          isOpen={modal}
          toggle={handleCloseModal}
          backdrop={isSubmitting ? "static" : true}
          keyboard={!isSubmitting}
        >
          <ModalHeader
            toggle={
              isSubmitting
                ? undefined
                : handleCloseModal
            }
          >
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
            <Button
              color="secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  {isAddMode
                    ? "Adding..."
                    : "Saving..."}
                </>
              ) : isAddMode ? (
                "Add"
              ) : (
                "Save"
              )}
            </Button>

          </ModalFooter>
        </Modal>
      </div>
    </div>
  );
};

export default District;
