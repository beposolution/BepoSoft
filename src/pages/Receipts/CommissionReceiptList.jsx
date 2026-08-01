import React, { useEffect, useState } from "react";
import axios from "axios";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import {
  Card,
  Col,
  Container,
  Row,
  CardBody,
  CardTitle,
  Table,
  Spinner,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  ModalFooter,
  Button,
} from "reactstrap";
import Paginations from "../../components/Common/Pagination";
import AsyncSelect from "react-select/async";

const CommissionReceiptList = () => {
  const token = localStorage.getItem("token");
  const [role, setRole] = useState(null);

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [banks, setBanks] = useState([]);

  const [formData, setFormData] = useState({
    order: "",
    bank: "",
    amount: "",
    transactionID: "",
    received_at: "",
    remark: "",
    payment_receipt: "",
    created_by_name: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [filterOrder, setFilterOrder] = useState(null);
  const [filterCustomer, setFilterCustomer] = useState(null);
  const [filterBank, setFilterBank] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState(null);

  const perPageData = 50;

  useEffect(() => {
    const role = localStorage.getItem("active");
    setRole(role);
  }, []);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const rsStyles = {
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: "#fff",
      border: "1px solid #e9ecef",
      boxShadow: "0 6px 20px rgba(0,0,0,.15)",
    }),
    menuList: (base) => ({
      ...base,
      backgroundColor: "#fff",
    }),
    option: (base, state) => ({
      ...base,
      cursor: "pointer",
      backgroundColor: state.isFocused ? "#eef5ff" : "#fff",
      color: "#212529",
    }),
    control: (base) => ({
      ...base,
      minHeight: 38,
      borderColor: "#ced4da",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#212529",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#6c757d",
    }),
  };

  const getErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.errors) {
      if (typeof responseData.errors === "string") {
        return responseData.errors;
      }

      const firstError = Object.values(responseData.errors)?.[0];

      if (Array.isArray(firstError)) {
        return firstError[0];
      }

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    return fallbackMessage;
  };

  const loadCustomers = async (inputValue) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}customers/`,
        {
          params: inputValue ? { search: inputValue } : {},
          headers: authHeaders,
        }
      );

      const customers =
        response?.data?.results ||
        response?.data?.data ||
        [];

      return customers.map((customer) => ({
        value: String(customer.id),
        label: `${customer.name} - ${customer.phone ?? ""}`,
      }));
    } catch (error) {
      console.error("Customer search error:", error);
      return [];
    }
  };

  const loadOrders = async (inputValue) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}orders/`,
        {
          params: inputValue ? { search: inputValue } : {},
          headers: authHeaders,
        }
      );

      const orders =
        response?.data?.results?.results ||
        response?.data?.results ||
        response?.data?.data ||
        [];

      return orders.map((order) => ({
        value: String(order.id),
        label: `${order.invoice || "No Invoice"} - ${order.customer?.name ||
          order.customer_name ||
          "No Customer"
          } - ₹${order.total_amount ?? 0}`,
      }));
    } catch (error) {
      console.error("Order search error:", error);
      return [];
    }
  };

  const loadStaffs = async (inputValue) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}get/staffs/`,
        {
          params: inputValue ? { search: inputValue } : {},
          headers: authHeaders,
        }
      );

      const staffs =
        response?.data?.results?.data ||
        response?.data?.data ||
        [];

      return staffs.map((staff) => ({
        value: String(staff.id),
        label: `${staff.name}${staff.department_name ? ` - ${staff.department_name}` : ""
          }${staff.phone ? ` - ${staff.phone}` : ""}`,
      }));
    } catch (error) {
      console.error("Staff search error:", error);
      return [];
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}banks/`,
        {
          headers: authHeaders,
        }
      );

      if (response?.status === 200) {
        setBanks(response?.data?.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Error fetching banks"));
    }
  };

  useEffect(() => {
    fetchBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReceiptData = async (
    page = currentPage,
    customFilters = null
  ) => {
    try {
      setLoading(true);

      const activeSearch =
        customFilters?.searchTerm ?? searchTerm;

      const activeOrder =
        customFilters?.filterOrder ?? filterOrder;

      const activeCustomer =
        customFilters?.filterCustomer ?? filterCustomer;

      const activeBank =
        customFilters?.filterBank ?? filterBank;

      const activeCreatedBy =
        customFilters?.filterCreatedBy ?? filterCreatedBy;

      const params = {
        page,
      };

      if (activeSearch.trim()) {
        params.search = activeSearch.trim();
      }

      if (activeOrder?.value) {
        params.order_id = activeOrder.value;
      }

      if (activeCustomer?.value) {
        params.customer_id = activeCustomer.value;
      }

      if (activeBank) {
        params.bank_id = activeBank;
      }

      if (activeCreatedBy?.value) {
        params.created_by = activeCreatedBy.value;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}commission/receipts/add/`,
        {
          params,
          headers: authHeaders,
        }
      );

      setReceipts(response?.data?.results?.data || []);
      setTotalCount(response?.data?.count || 0);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Error fetching commission receipt data"
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleApplyFilter = () => {
    if (currentPage === 1) {
      fetchReceiptData(1);
    } else {
      setCurrentPage(1);
    }
  };

  const handleClearFilter = () => {
    const emptyFilters = {
      searchTerm: "",
      filterOrder: null,
      filterCustomer: null,
      filterBank: "",
      filterCreatedBy: null,
    };

    setSearchTerm("");
    setFilterOrder(null);
    setFilterCustomer(null);
    setFilterBank("");
    setFilterCreatedBy(null);

    if (currentPage === 1) {
      fetchReceiptData(1, emptyFilters);
    } else {
      setCurrentPage(1);
      fetchReceiptData(1, emptyFilters);
    }
  };

  const resetModalData = () => {
    setSelectedReceipt(null);
    setSelectedOrder(null);

    setFormData({
      order: "",
      bank: "",
      amount: "",
      transactionID: "",
      received_at: "",
      remark: "",
      payment_receipt: "",
      created_by_name: "",
    });
  };

  const closeModal = () => {
    setModalOpen(false);
    resetModalData();
  };

  const handleView = async (receiptId) => {
    setModalLoading(true);
    setModalOpen(true);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_KEY}commission/receipts/edit/${receiptId}/`,
        {
          headers: authHeaders,
        }
      );

      const receipt = response?.data?.data || response?.data;

      setSelectedReceipt(receipt);

      setSelectedOrder({
        value: String(receipt.order),
        label: receipt.order_name || `Order #${receipt.order}`,
      });

      setFormData({
        order: receipt.order || "",
        bank: receipt.bank || "",
        amount: receipt.amount || "",
        transactionID: receipt.transactionID || "",
        received_at: receipt.received_at
          ? receipt.received_at.split("T")[0]
          : "",
        remark: receipt.remark || "",
        payment_receipt: receipt.payment_receipt || "",
        created_by_name: receipt.created_by_name || "",
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Error fetching receipt details")
      );
      closeModal();
    } finally {
      setModalLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleOrderChange = (selectedOption) => {
    setSelectedOrder(selectedOption);

    setFormData((previousData) => ({
      ...previousData,
      order: selectedOption?.value || "",
    }));
  };

  const validateUpdate = () => {
    if (!formData.order) {
      toast.error("Please select an order.");
      return false;
    }

    if (!formData.bank) {
      toast.error("Please select a bank.");
      return false;
    }

    if (!formData.amount) {
      toast.error("Please enter the amount.");
      return false;
    }

    if (Number(formData.amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return false;
    }

    if (!formData.transactionID.trim()) {
      toast.error("Please enter the transaction ID.");
      return false;
    }

    if (!formData.received_at) {
      toast.error("Please select the received date.");
      return false;
    }

    if (!formData.remark.trim()) {
      toast.error("Please enter the remark.");
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!selectedReceipt?.id || !validateUpdate()) {
      return;
    }

    setUpdateLoading(true);

    try {
      const beforeData = {
        message: "Commission Receipt Updated",
        ...selectedReceipt,
      };

      const payload = {
        order: Number(formData.order),
        bank: Number(formData.bank),
        amount: formData.amount,
        transactionID: formData.transactionID.trim(),
        received_at: formData.received_at,
        remark: formData.remark.trim(),
      };

      const response = await axios.put(
        `${import.meta.env.VITE_APP_KEY}commission/receipts/edit/${selectedReceipt.id}/`,
        payload,
        {
          headers: authHeaders,
        }
      );

      if (response.status === 200 || response.status === 204) {
        const updatedReceipt =
          response?.data?.data ||
          response?.data ||
          payload;

        toast.success(
          response?.data?.message ||
          "Commission receipt updated successfully!"
        );

        closeModal();
        fetchReceiptData(currentPage);

        try {
          await axios.post(
            `${import.meta.env.VITE_APP_KEY}datalog/create/`,
            {
              order: Number(formData.order),
              before_data: beforeData,
              after_data: updatedReceipt,
            },
            {
              headers: authHeaders,
            }
          );
        } catch (logError) {
          toast.warn(
            "Commission receipt updated, but DataLog creation failed."
          );
        }
      }
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to update commission receipt")
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const indexOfFirstItem = (currentPage - 1) * perPageData;
  const indexOfLastItem = Math.min(
    currentPage * perPageData,
    totalCount
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs
            title="PAYMENTS"
            breadcrumbItem="COMMISSION RECEIPTS"
          />

          <Row>
            <Col xl={12}>
              <Card>
                <CardBody>
                  <CardTitle className="mb-4">
                    COMMISSION RECEIPTS
                  </CardTitle>

                  <Row className="mb-3">
                    <Col md={4}>
                      <Label>Search</Label>

                      <Input
                        type="text"
                        placeholder="Search receipt, invoice, remark, amount or transaction ID"
                        value={searchTerm}
                        onChange={(event) =>
                          setSearchTerm(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleApplyFilter();
                          }
                        }}
                      />
                    </Col>

                    <Col md={4}>
                      <Label>Order</Label>

                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadOrders}
                        value={filterOrder}
                        onChange={setFilterOrder}
                        placeholder="Search order"
                        isClearable
                        menuPortalTarget={document.body}
                        styles={rsStyles}
                      />
                    </Col>

                    <Col md={4}>
                      <Label>Customer</Label>

                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadCustomers}
                        value={filterCustomer}
                        onChange={setFilterCustomer}
                        placeholder="Search customer"
                        isClearable
                        menuPortalTarget={document.body}
                        styles={rsStyles}
                      />
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={4}>
                      <Label>Bank</Label>

                      <Input
                        type="select"
                        value={filterBank}
                        onChange={(event) =>
                          setFilterBank(event.target.value)
                        }
                      >
                        <option value="">All Banks</option>

                        {banks.map((bank) => (
                          <option
                            key={bank.id}
                            value={bank.id}
                          >
                            {bank.name}
                          </option>
                        ))}
                      </Input>
                    </Col>

                    <Col md={4}>
                      <Label>Created Staff</Label>

                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        loadOptions={loadStaffs}
                        value={filterCreatedBy}
                        onChange={setFilterCreatedBy}
                        placeholder="Search staff"
                        isClearable
                        menuPortalTarget={document.body}
                        styles={rsStyles}
                      />
                    </Col>

                    <Col
                      md={4}
                      className="d-flex align-items-end gap-2"
                    >
                      <Button
                        color="primary"
                        onClick={handleApplyFilter}
                      >
                        Filter
                      </Button>

                      <Button
                        color="warning"
                        onClick={handleClearFilter}
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>

                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                    </div>
                  ) : (
                    <>
                      <Table bordered responsive striped hover>
                        <thead className="thead-dark">
                          <tr>
                            <th>#</th>
                            <th>Receipt</th>
                            <th>Order</th>
                            <th>Amount</th>
                            <th>Transaction ID</th>
                            <th>Received At</th>
                            <th>Remark</th>
                            <th>Bank</th>
                            <th>Created By</th>
                            <th>Created At</th>
                            {["ADMIN", "CEO", "COO"].includes(role) && (
                              <th>Actions</th>
                            )}
                          </tr>
                        </thead>

                        <tbody>
                          {receipts.length > 0 ? (
                            receipts.map((item, index) => (
                              <tr key={item.id}>
                                <td>
                                  {indexOfFirstItem + index + 1}
                                </td>

                                <td>{item.payment_receipt}</td>
                                <td>{item.order_name}</td>
                                <td>{item.amount}</td>
                                <td>{item.transactionID}</td>
                                <td>{item.received_at}</td>
                                <td>{item.remark}</td>
                                <td>{item.bank_name}</td>
                                <td>{item.created_by_name}</td>
                                <td>
                                  {item.created_at
                                    ? new Date(
                                      item.created_at
                                    ).toLocaleString("en-IN")
                                    : "-"}
                                </td>

                                {["ADMIN", "CEO", "COO"].includes(role) && (
                                  <td>
                                    <Button
                                      color="primary"
                                      size="sm"
                                      onClick={() =>
                                        handleView(item.id)
                                      }
                                    >
                                      View
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="11"
                                className="text-center"
                              >
                                No commission receipts found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>

                      <Paginations
                        perPageData={perPageData}
                        data={{ length: totalCount }}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        isShowingPageLength
                        paginationDiv="col-auto"
                        paginationClass="pagination-rounded"
                        indexOfFirstItem={indexOfFirstItem}
                        indexOfLastItem={indexOfLastItem}
                      />
                    </>
                  )}

                  <Modal
                    isOpen={modalOpen}
                    toggle={closeModal}
                    size="lg"
                  >
                    <ModalHeader toggle={closeModal}>
                      Commission Receipt Details
                    </ModalHeader>

                    <ModalBody>
                      {modalLoading ? (
                        <div className="text-center py-5">
                          <Spinner color="primary" />
                        </div>
                      ) : (
                        <>
                          <Row>
                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Receipt</Label>

                                <Input
                                  type="text"
                                  value={
                                    formData.payment_receipt || ""
                                  }
                                  disabled
                                />
                              </div>
                            </Col>

                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Order</Label>

                                <AsyncSelect
                                  cacheOptions
                                  defaultOptions
                                  loadOptions={loadOrders}
                                  value={selectedOrder}
                                  onChange={handleOrderChange}
                                  placeholder="Search order"
                                  isClearable
                                  menuPortalTarget={document.body}
                                  styles={rsStyles}
                                />
                              </div>
                            </Col>

                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Bank</Label>

                                <Input
                                  type="select"
                                  name="bank"
                                  value={formData.bank || ""}
                                  onChange={handleChange}
                                >
                                  <option value="">
                                    Select Bank
                                  </option>

                                  {banks.map((bank) => (
                                    <option
                                      key={bank.id}
                                      value={bank.id}
                                    >
                                      {bank.name}
                                    </option>
                                  ))}
                                </Input>
                              </div>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Amount</Label>

                                <Input
                                  type="number"
                                  name="amount"
                                  value={formData.amount || ""}
                                  onChange={handleChange}
                                  min="0.01"
                                  step="0.01"
                                />
                              </div>
                            </Col>

                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Transaction ID</Label>

                                <Input
                                  type="text"
                                  name="transactionID"
                                  value={
                                    formData.transactionID || ""
                                  }
                                  onChange={handleChange}
                                  maxLength={50}
                                />
                              </div>
                            </Col>

                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Received At</Label>

                                <Input
                                  type="date"
                                  name="received_at"
                                  value={
                                    formData.received_at || ""
                                  }
                                  onChange={handleChange}
                                />
                              </div>
                            </Col>
                          </Row>

                          <Row>
                            <Col md={8}>
                              <div className="mb-3">
                                <Label>Remark</Label>

                                <Input
                                  type="textarea"
                                  name="remark"
                                  value={formData.remark || ""}
                                  onChange={handleChange}
                                  rows={3}
                                />
                              </div>
                            </Col>

                            <Col md={4}>
                              <div className="mb-3">
                                <Label>Created By</Label>

                                <Input
                                  type="text"
                                  value={
                                    formData.created_by_name || ""
                                  }
                                  disabled
                                />
                              </div>
                            </Col>
                          </Row>
                        </>
                      )}
                    </ModalBody>

                    <ModalFooter>
                      <Button
                        color="primary"
                        onClick={handleUpdate}
                        disabled={
                          modalLoading || updateLoading
                        }
                      >
                        {updateLoading
                          ? "Updating..."
                          : "Update Receipt"}
                      </Button>

                      <Button
                        color="secondary"
                        onClick={closeModal}
                        disabled={updateLoading}
                      >
                        Cancel
                      </Button>
                    </ModalFooter>
                  </Modal>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>

        <ToastContainer />
      </div>
    </React.Fragment>
  );
};

export default CommissionReceiptList;
