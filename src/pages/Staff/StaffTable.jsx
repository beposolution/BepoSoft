import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Select from "react-select";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import TableContainer from "../../components/Common/TableContainer";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DatatableTables = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState(null);
    const [previousPage, setPreviousPage] = useState(null);

    const [supervisors, setSupervisors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [families, setFamilies] = useState([]);
    const [countryCodes, setCountryCodes] = useState([]);

    const [filters, setFilters] = useState({
        supervisor_id: "",
        department_id: "",
        warehouse_id: "",
        family: "",
        country_code: "",
        blood_group: "",
        approval_status: "",
    });

    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const bloodGroups = [
        { value: "A+", label: "A+" },
        { value: "A-", label: "A-" },
        { value: "B+", label: "B+" },
        { value: "B-", label: "B-" },
        { value: "AB+", label: "AB+" },
        { value: "AB-", label: "AB-" },
        { value: "O+", label: "O+" },
        { value: "O-", label: "O-" },
    ];

    const approvalStatuses = [
        { value: "approved", label: "Approved" },
        { value: "disapproved", label: "Disapproved" },
    ];

    const columns = useMemo(
        () => [
            {
                header: "EID",
                accessorKey: "staff_id",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Name",
                accessorKey: "name",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Position",
                accessorKey: "designation",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Phone",
                accessorKey: "phone",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Email",
                accessorKey: "email",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Start date",
                accessorKey: "join_date",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Department",
                accessorKey: "department_name",
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: "Image",
                accessorKey: "image",
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) =>
                    row.original.image ? (
                        <img
                            src={`${import.meta.env.VITE_APP_IMAGE}${row.original.image}`}
                            alt="Staff"
                            style={{
                                width: "70px",
                                height: "70px",
                                objectFit: "cover",
                                borderRadius: "6px",
                            }}
                        />
                    ) : (
                        <span>No Image</span>
                    ),
            },
            {
                header: "Actions",
                accessorKey: "actions",
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <button
                        className="btn btn-primary"
                        style={{ height: "30px" }}
                        onClick={() => handleViewClick(row.original)}
                    >
                        Edit
                    </button>
                ),
            },
        ],
        []
    );

    const handleViewClick = (staff) => {
        if (staff && staff.id) {
            navigate(`/edit/staffs/${staff.id}/`);
        } else {
            toast.error("Staff ID is undefined");
        }
    };

    const fetchFilterData = async () => {
        try {
            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const [
                supervisorsRes,
                departmentsRes,
                warehousesRes,
                familiesRes,
                countryCodesRes,
            ] = await Promise.all([
                axios.get(`${import.meta.env.VITE_APP_KEY}supervisors/`, { headers }),
                axios.get(`${import.meta.env.VITE_APP_KEY}departments/`, { headers }),
                axios.get(`${import.meta.env.VITE_APP_KEY}warehouse/add/`, { headers }),
                axios.get(`${import.meta.env.VITE_APP_KEY}familys/`, { headers }),
                axios.get(`${import.meta.env.VITE_APP_KEY}country/codes/`, { headers }),
            ]);

            setSupervisors(supervisorsRes?.data?.data || []);
            setDepartments(departmentsRes?.data?.data || []);
            setWarehouses(warehousesRes?.data || []);
            setFamilies(familiesRes?.data?.data || []);
            setCountryCodes(countryCodesRes?.data?.data || []);
        } catch (err) {
            console.error("Filter API error:", err);
            toast.error("Failed to load filter data");
        }
    };

    const fetchStaffs = async (page = 1, searchValue = "", filterValues = filters) => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: page,
                search: searchValue,
                ...filterValues,
            };

            Object.keys(params).forEach((key) => {
                if (
                    params[key] === "" ||
                    params[key] === null ||
                    params[key] === undefined
                ) {
                    delete params[key];
                }
            });

            const response = await axios.get(
                `${import.meta.env.VITE_APP_KEY}get/staffs/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                }
            );

            if (response.status === 200) {
                setData(response?.data?.results?.data || []);
                setTotalCount(response?.data?.count || 0);
                setNextPage(response?.data?.next || null);
                setPreviousPage(response?.data?.previous || null);
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to fetch staff data");
            setData([]);
            setTotalCount(0);
            setNextPage(null);
            setPreviousPage(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFilterData();
    }, []);

    useEffect(() => {
        fetchStaffs(currentPage, search, filters);
    }, [currentPage, search, filters]);

    const handleSearchSubmit = () => {
        setCurrentPage(1);
        setSearch(searchInput.trim());
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSearchSubmit();
        }
    };

    const handleReset = () => {
        setSearchInput("");
        setSearch("");
        setCurrentPage(1);
        setFilters({
            supervisor_id: "",
            department_id: "",
            warehouse_id: "",
            family: "",
            country_code: "",
            blood_group: "",
            approval_status: "",
        });
    };

    const handlePrevious = () => {
        if (previousPage) {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
        }
    };

    const handleNext = () => {
        if (nextPage) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handleReactSelectChange = (name, selectedOption) => {
        setCurrentPage(1);
        setFilters((prev) => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : "",
        }));
    };

    const supervisorOptions = supervisors.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const departmentOptions = departments.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const warehouseOptions = warehouses.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const familyOptions = families.map((item) => ({
        value: item.id,
        label: item.name,
    }));

    const countryCodeOptions = countryCodes.map((item) => ({
        value: item.id,
        label: item.code || item.country_code || item.name,
    }));

    document.title = "Staff | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Staffs Information" />
                <ToastContainer />

                <div className="card p-3 mb-3">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label">Search</label>
                            <div className="d-flex gap-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="PAN, Aadhar, Staff ID, Designation, Phone, Name, Username"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                                <button className="btn btn-primary" onClick={handleSearchSubmit}>
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">Supervisor</label>
                            <Select
                                options={supervisorOptions}
                                isClearable
                                isSearchable
                                placeholder="Select Supervisor"
                                value={supervisorOptions.find(
                                    (option) => option.value === filters.supervisor_id
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("supervisor_id", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">Department</label>
                            <Select
                                options={departmentOptions}
                                isClearable
                                isSearchable
                                placeholder="Select Department"
                                value={departmentOptions.find(
                                    (option) => option.value === filters.department_id
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("department_id", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">Warehouse</label>
                            <Select
                                options={warehouseOptions}
                                isClearable
                                isSearchable
                                placeholder="Select Warehouse"
                                value={warehouseOptions.find(
                                    (option) => option.value === filters.warehouse_id
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("warehouse_id", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">Family</label>
                            <Select
                                options={familyOptions}
                                isClearable
                                isSearchable
                                placeholder="Select Family"
                                value={familyOptions.find(
                                    (option) => option.value === filters.family
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("family", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Country Code</label>
                            <Select
                                options={countryCodeOptions}
                                isClearable
                                isSearchable
                                placeholder="Select Country Code"
                                value={countryCodeOptions.find(
                                    (option) => option.value === filters.country_code
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("country_code", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Blood Group</label>
                            <Select
                                options={bloodGroups}
                                isClearable
                                isSearchable
                                placeholder="Select Blood Group"
                                value={bloodGroups.find(
                                    (option) => option.value === filters.blood_group
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("blood_group", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-3">
                            <label className="form-label">Approval Status</label>
                            <Select
                                options={approvalStatuses}
                                isClearable
                                isSearchable
                                placeholder="Select Approval Status"
                                value={approvalStatuses.find(
                                    (option) => option.value === filters.approval_status
                                ) || null}
                                onChange={(selectedOption) =>
                                    handleReactSelectChange("approval_status", selectedOption)
                                }
                            />
                        </div>

                        <div className="col-md-3 d-flex align-items-end">
                            <button className="btn btn-secondary w-100" onClick={handleReset}>
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-3 d-flex justify-content-end">
                    <strong>Total Staffs: {totalCount}</strong>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="text-danger">Error: {error}</p>
                ) : (
                    <>
                        <TableContainer
                            columns={columns}
                            data={data || []}
                            isGlobalFilter={false}
                            isPagination={false}
                            tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        />

                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <button
                                className="btn btn-outline-primary"
                                onClick={handlePrevious}
                                disabled={!previousPage}
                            >
                                Previous
                            </button>

                            <span>
                                Page <strong>{currentPage}</strong>
                            </span>

                            <button
                                className="btn btn-outline-primary"
                                onClick={handleNext}
                                disabled={!nextPage}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

DatatableTables.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default DatatableTables;