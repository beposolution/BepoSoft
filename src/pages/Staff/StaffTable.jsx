import React, { useEffect, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import axios from 'axios'; 
import Breadcrumbs from '../../components/Common/Breadcrumb';
import TableContainer from '../../components/Common/TableContainer';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DatatableTables = () => {
    const [data, setData] = useState([]); // State to store user data
    const [loading, setLoading] = useState(true); // State for loading status
    const [error, setError] = useState(null); // State for error handling
    const token = localStorage.getItem('token');
    const navigate = useNavigate(); // Initialize useNavigate hook for redirection

    const columns = useMemo(
        () => [
            {
                header: 'EID',
                accessorKey: 'eid',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Name',
                accessorKey: 'name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Position',
                accessorKey: 'designation',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Phone',
                accessorKey: 'phone',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Email',
                accessorKey: 'email',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Start date',
                accessorKey: 'join_date',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Department',
                accessorKey: 'department_name',
                enableColumnFilter: false,
                enableSorting: true,
            },
            {
                header: 'Image',
                accessorKey: 'image',
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ row }) => (
                    row.original.image ? (
                        <img
                            src={`${import.meta.env.VITE_APP_IMAGE}${row.original.image}`}
                            alt="Staff"
                            style={{ width: '70px', height: '70px' }} // Adjust the size as needed
                        />
                    ) : null
                ),
            },
            {
                header: 'Actions',
                accessorKey: 'actions',
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => (
                    <button
                        className="btn btn-primary"
                        style={{ height: '30px' }} // Change height here (adjust the value as needed)
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
        // Ensure that staff.id is defined
        if (staff && staff.id) {
            navigate(`/edit/staffs/${staff.id}/`);
        } else {
            toast.error('Staff ID is undefined');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_APP_KEY}staffs/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }); // Fetch department data
                if (response.status === 200) {
                    setData(response.data.data); // Set the data
                } else {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
            } catch (error) {
                setError(error.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Set meta title
    document.title = "Staff | Beposoft";

    return (
        <div className="page-content">
            <div className="container-fluid">
                <Breadcrumbs title="Tables" breadcrumbItem="Staffs Information" />
                {loading ? (
                    <p>Loading...</p> // Show loading text while fetching data
                ) : error ? (
                    <p className="text-danger">Error: {error}</p> // Show error message if any
                ) : (
                    <TableContainer
                        columns={columns}
                        data={data || []} // Pass the fetched data to TableContainer
                        isGlobalFilter={true}
                        isPagination={true}
                        SearchPlaceholder="Search by Name, Department, or Designation..."
                        pagination="pagination"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                    />
                )}
            </div>
        </div>
    );
}

DatatableTables.propTypes = {
    preGlobalFilteredRows: PropTypes.any,
};

export default DatatableTables;
