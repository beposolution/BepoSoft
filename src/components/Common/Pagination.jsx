import { Link } from "react-router-dom";
import React, { useEffect } from "react";
import { Row } from "reactstrap";

const Paginations = ({
  perPageData,
  data,
  currentPage,
  setCurrentPage,
  isShowingPageLength,
  paginationDiv,
  paginationClass
}) => {
  const totalPages = Math.ceil(data?.length / perPageData);
  const pageNumbers = [];

  const getPagination = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === 2 ||
        i === totalPages ||
        i === totalPages - 1 ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handlePageClick = (e, page) => {
    e.preventDefault();
    if (page !== "..." && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    if (totalPages && totalPages < currentPage) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage, setCurrentPage]);

  return (
    <React.Fragment>
      <Row className="justify-content-center align-items-center">
        {isShowingPageLength && (
          <div className="col-auto">
            <div className="text-muted">
              Showing <span className="fw-semibold">{perPageData}</span> of{" "}
              <span className="fw-semibold">{data?.length}</span> entries
            </div>
          </div>
        )}
        <div className={`${paginationDiv} mt-2`}>
          <ul className={`${paginationClass} pagination justify-content-center mb-0`}>
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <Link className="page-link" to="#" onClick={handlePrev}>
                ←
              </Link>
            </li>

            {getPagination().map((item, index) => (
              <li
                key={index}
                className={`page-item ${
                  item === currentPage ? "active" : item === "..." ? "disabled" : ""
                }`}
              >
                <Link
                  className="page-link"
                  to="#"
                  onClick={(e) => handlePageClick(e, item)}
                >
                  {item}
                </Link>
              </li>
            ))}

            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <Link className="page-link" to="#" onClick={handleNext}>
                →
              </Link>
            </li>
          </ul>
        </div>
      </Row>
    </React.Fragment>
  );
};

export default Paginations;
