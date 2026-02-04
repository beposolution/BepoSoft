import React, { useEffect, useState } from "react";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import {
  Card,
  CardBody,
  CardTitle,
  Col,
  Container,
  Row,
  Table,
  Spinner,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Label,
} from "reactstrap";
import { ToastContainer, toast } from "react-toastify";
import Paginations from "../../components/Common/Pagination";

const BankAccountTypePage = () => {
  const token = localStorage.getItem("token");

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    account_type: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const perPageData = 10;

  /* ---------------- FETCH LIST ---------------- */
  const fetchBankAccountTypes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_KEY}add/bank/account/type/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch bank account types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccountTypes();
  }, []);

  /* ---------------- VIEW / EDIT ---------------- */
  const handleView = async (id) => {
    setModalOpen(true);
    setModalLoading(true);
    setEditingId(id);

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_APP_KEY}edit/bank/account/type/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormData({
        account_type: res.data.data.account_type || "",
      });
    } catch (err) {
      toast.error("Failed to fetch details");
    } finally {
      setModalLoading(false);
    }
  };

  /* ---------------- CREATE / UPDATE ---------------- */
  const handleSubmit = async () => {
    if (!formData.account_type.trim()) {
      toast.warning("Account Type is required");
      return;
    }

    try {
      if (editingId) {
        // UPDATE
        await axios.put(
          `${import.meta.env.VITE_APP_KEY}edit/bank/account/type/${editingId}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Bank Account Type updated successfully");
      } else {
        // CREATE
        await axios.post(
          `${import.meta.env.VITE_APP_KEY}add/bank/account/type/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Bank Account Type added successfully");
      }

      fetchBankAccountTypes();
      handleCloseModal();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  /* ---------------- DELETE ---------------- */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this record?")) return;

//     try {
//       await axios.delete(
//         `${import.meta.env.VITE_APP_KEY}edit/bank/account/type/${id}/`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       toast.success("Deleted successfully");
//       fetchBankAccountTypes();
//     } catch (err) {
//       toast.error("Delete failed");
//     }
//   };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ account_type: ""});
  };

  /* ---------------- PAGINATION ---------------- */
  const indexOfLastItem = currentPage * perPageData;
  const indexOfFirstItem = indexOfLastItem - perPageData;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="SETTINGS" breadcrumbItem="BANK ACCOUNT TYPES" />

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
                    <Col>
                      <CardTitle className="mb-0">
                        BANK ACCOUNT TYPES
                      </CardTitle>
                    </Col>
                    <Col className="text-end">
                      <Button color="primary" onClick={() => setModalOpen(true)}>
                        + Add Account Type
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <Spinner color="primary" />
                  ) : (
                    <>
                      <Table bordered striped responsive hover>
                        <thead className="thead-dark">
                          <tr>
                            <th>#</th>
                            <th>Account Type</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center">
                                No records found
                              </td>
                            </tr>
                          ) : (
                            currentData.map((item, index) => (
                              <tr key={item.id}>
                                <td>{indexOfFirstItem + index + 1}</td>
                                <td>{item.account_type}</td>
                                <td>
                                  <Button
                                    size="sm"
                                    color="info"
                                    className="me-2"
                                    onClick={() => handleView(item.id)}
                                  >
                                    Edit
                                  </Button>
                                  {/* <Button
                                    size="sm"
                                    color="danger"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    Delete
                                  </Button> */}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>

                      <Paginations
                        perPageData={perPageData}
                        data={data}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        paginationClass="pagination-rounded"
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                      />
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* -------- MODAL -------- */}
        <Modal isOpen={modalOpen} toggle={handleCloseModal}>
          <ModalHeader toggle={handleCloseModal}>
            {editingId ? "Edit Bank Account Type" : "Add Bank Account Type"}
          </ModalHeader>

          <ModalBody>
            {modalLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="mb-3">
                  <Label>Account Type</Label>
                  <Input
                    type="text"
                    value={formData.account_type}
                    onChange={(e) =>
                      setFormData({ ...formData, account_type: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button color="primary" onClick={handleSubmit}>
              {editingId ? "Update" : "Create"}
            </Button>
            <Button color="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default BankAccountTypePage;
