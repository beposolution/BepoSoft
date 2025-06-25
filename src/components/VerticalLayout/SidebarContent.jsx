import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";
import SimpleBar from "simplebar-react";
import MetisMenu from "metismenujs";
import { Link, useLocation } from "react-router-dom";
import withRouter from "../Common/withRouter";
import { withTranslation } from "react-i18next";
import { useCallback } from "react";
import { FaUsers, FaUserTie, FaWarehouse } from 'react-icons/fa';
import { AiFillProduct } from "react-icons/ai";
import { BiCheckDouble, BiSolidBank } from "react-icons/bi";
import { BsArrowRightSquareFill } from "react-icons/bs";
import { LuCircleCheckBig } from "react-icons/lu";
import { GiBassetHoundHead, GiExpense } from "react-icons/gi";
import { TbReportSearch } from "react-icons/tb";
import { MdOutlineVideogameAsset, MdLocalFireDepartment, MdAssignmentReturn, MdDetails } from "react-icons/md";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { FaReceipt } from "react-icons/fa6";
import { GrOrganization } from "react-icons/gr";
import { RiOrderPlayLine } from "react-icons/ri";


const SidebarContent = (props) => {
  const ref = useRef();
  const path = useLocation();

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];
    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("active")
  }, [])

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
    activeMenu();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  const [role, setRole] = React.useState(localStorage.getItem("active"));

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem("active")); // Update the role
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{props.t("Menu")} </li>
            <li>
              <Link to="/#" className="has-arrow">
                <i className="bx bx-home-circle"></i>
                <span>{props.t("Dashboards")}</span>
              </Link>

            </li>
            <li>
              <Link to="/dashboard/" className=" ">
                <i className="bx bx-calendar"></i>
                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>
            {/* <li>
              <Link to="/chat" className="">
                <i className="bx bx-chat"></i>
                <span>{props.t("Chat")}</span>
              </Link>
            </li>
            <li>
              <Link to="/apps-filemanager">
                <i className="bx bx-file"></i>
                <span>{props.t("File Manager")}</span>
              </Link>
            </li> */}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <FaUserTie size={17} style={{ marginRight: '6px' }} />
                  <span>{props.t("Staff")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-staffs">{props.t("Staffs")}</Link>
                  </li>
                  <li>
                    <Link to="/add-staffs">{props.t("Add Staff")}</Link>
                  </li>

                </ul>
              </li>

            ) : null}

            {role === 'BDO' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <AiFillProduct size={17} style={{ marginRight: '6px' }} />
                  <span>{props.t("Customers")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all/staff/customers/">{props.t("Customers")}</Link>
                  </li>
                  <li>
                    <Link to="/add/staff/customer/">{props.t("Add Customers")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'BDM' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <FaUserTie size={17} style={{ marginRight: '6px' }} />
                  <span>{props.t("Customers")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/managed/staff/customer/">{props.t("Customers")}</Link>
                  </li>
                  <li>
                    <Link to="/add/staff/customer/">{props.t("Add Customers")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'BDO' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <RiOrderPlayLine size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Order")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/staff/new/order/">{props.t("new order")}</Link>
                  </li>
                  <li>
                    <Link to="/managed/family/order/">{props.t("order list")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'BDM' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <RiOrderPlayLine size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Order")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/staff/new/order/">{props.t("new order")}</Link>
                  </li>
                  <li>
                    <Link to="/staff/order/list/">{props.t("order list")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}


            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <AiFillProduct size={17} style={{ marginRight: '6px' }} />
                  <span>{props.t("purchase")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/add/products/">{props.t("Purchase")}</Link>
                  </li>
                  <li>
                    <Link to="/add/products/bulk/">{props.t("Bulk Order Creation")}</Link>
                  </li>
                  <li>
                    <Link to="/product/list/">{props.t("Purchase List")}</Link>
                  </li>
                  <li>
                    <Link to="/product/add-excel/">{props.t("Excel upload products")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Customers")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-customers/">{props.t("Customers")}</Link>
                  </li>
                  <li>
                    <Link to="/add-customers/">{props.t("Add Customers")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Supervisor")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-supervisors/">{props.t("Supervisors")}</Link>
                  </li>
                  <li>
                    <Link to="/add-supervisors/">{props.t("add Supervisors")}</Link>
                  </li>
                </ul>
              </li>

            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("States")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-states/">{props.t("States")}</Link>
                  </li>
                </ul>
              </li>

            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <MdLocalFireDepartment size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Department")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-departments/">{props.t("Departments")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}
            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Family")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/all-families/">{props.t("Families")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}
            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Attribute")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/attributes/">{props.t("attribute")}</Link>
                  </li>
                  <li>
                    <Link to="/attribute-values/">{props.t("attribute-values")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <RiOrderPlayLine size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Order")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/New/Order/">{props.t("new order")}</Link>
                  </li>
                  <li>
                    <Link to="/Orders/">{props.t("order list")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}


            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' || role === 'BDO' || role === "BDM" ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Perfoma Invoice")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/create/perfoma/invoice/">{props.t("new Perfoma invoice")}</Link>
                  </li>
                  <li>
                    <Link to="/perfoma/invoices/">{props.t("Perfoma invoices")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}


            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <BiSolidBank size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Bank")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/add/bank/">{props.t("Add Bank")}</Link>
                  </li>
                  <li>
                    <Link to="/bank/datas/">{props.t("Bank List")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}
            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <GrOrganization size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Company")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/add/beposoft/company/details/">{props.t("Add company")}</Link>
                  </li>
                  <li>
                    <Link to="/beposoft/companies/">{props.t("Companies")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}
            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' || role === 'Warehouse Admin' || role === 'warehouse' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <MdAssignmentReturn size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("GRV")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/beposoft/new/grv/">{props.t("new grv")}</Link>
                  </li>
                  <li>
                    <Link to="/beposoft/grv/view/">{props.t("grv list")}</Link>
                  </li>

                </ul>
              </li>

            ) : null}
            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' || role === 'Warehouse Admin' || role === 'warehouse' ? (


              <li>
                <Link to="/#" className="has-arrow">
                  <MdDetails size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("DELIVERY NOTES")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/delivery/notes/">{props.t("delivery-notes")}</Link>
                  </li>
                  <li>
                    <Link to="/daily/good/movment/">{props.t("Daily Good Movment")}</Link>
                  </li>

                </ul>
              </li>
            ) : null}

            {role === 'Warehouse Admin' || role === 'warehouse' ? (
              <li>
                <Link to="/#" className="has-arrow">
                  <FaUsers size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Orders")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li><Link to="/Orders/">{props.t("Waiting For Packing")}</Link></li>
                  <li><Link to="/Orders2">{props.t("Waiting For Shipping")}</Link></li>
                </ul>
              </li>


            ) : null}



            {/* {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'Warehouse Admin' ? (


<li>
<Link to="/order/warehousee/" className=" ">
  <i className="bx bx-box"></i>
  <span>{props.t("order request")}</span>
</Link>
</li>

) : null} */}



            {(role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT') && (
              <>
                {/* Expense Section */}
                <li>
                  <Link to="/#" className="has-arrow">
                    <GiExpense size={20} style={{ marginRight: '8px' }} />
                    <span>{props.t("Expense")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/add/expense/">{props.t("Add Expense")}</Link>
                    </li>
                    <li>
                      <Link to="/expense/list/">{props.t("Expenses")}</Link>
                    </li>
                    <li>
                      <Link to="/expense/add-category/">{props.t("Add category")}</Link>
                    </li>
                    <li>
                      <Link to="/expense/add-expanse-modal/">{props.t("add expanse type")}</Link>
                    </li>
                  </ul>
                </li>

                {/* Warehouse Section */}
                <li>
                  <Link to="/#" className="has-arrow">
                    <FaWarehouse size={20} style={{ marginRight: '8px' }} />
                    <span>{props.t("Warehouse")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/add/warehouse/">{props.t("Add Warehouse")}</Link>
                    </li>

                  </ul>
                </li>
              </>
            )}

            {role === 'ADMIN' || role === 'ACCOUNTS' ? (
              <li>
                <Link className="has-arrow" to="/#">
                  <FaReceipt size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Receipts")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/order/receipt/">{props.t("Order Receipt")}</Link>
                  </li>
                  <li>
                    <Link to="/other/receipt/">{props.t("Other Receipt")}</Link>
                  </li>
                  <li>
                    <Link to="/advance/receipt/">{props.t("Advance Receipt")}</Link>
                  </li>
                </ul>
              </li>
            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (

              <li>
                <Link to="/#" className="has-arrow">
                  <TbReportSearch size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Reports")}</span>
                </Link>
                <ul className="sub-menu" aria-expanded="false">
                  <li>
                    <Link to="/bank/bankmodule">{props.t("Finance Report")}</Link>
                  </li>
                  <li>
                    <Link to="/sales/reports/">{props.t("Sales Report")}</Link>
                  </li>
                  <li>
                    <Link to="/credit/sale/">{props.t("Credit Sales")}</Link>
                  </li>
                  <li>
                    <Link to="/COD/sales/resport/">{props.t("COD Sales Report")}</Link>
                  </li>

                  <li>
                    <Link to="/states/sales/resport/">{props.t("States Sales Report")}</Link>
                  </li>
                  <li>
                    <Link to="/expense/report/">{props.t("Expense Report")}</Link>
                  </li>
                  <li>
                    <Link to="/Delivery/report/">{props.t("Delivery Report")}</Link>
                  </li>
                  <li>
                    <Link to="/product/sold/report/">{props.t("Product Sold Report")}</Link>
                  </li>
                  <li>
                    <Link to="/product/stock/report/">{props.t("Product Stock Report")}</Link>
                  </li>
                  <li>
                    <Link to="/order/postoffice/">{props.t("Post Office Report")}</Link>
                  </li>
                  <li>
                    <Link to="/calllog/reports/">{props.t("Call Log Report")}</Link>
                  </li>
                </ul>
              </li>


            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (
              <li>
                <Link to="#" >
                  <BiCheckDouble size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Add Emi")}</span>
                </Link>

                <ul>
                  <li>
                    <Link to="/add-emi/" >
                      <BiCheckDouble size={20} style={{ marginRight: '8px' }} />
                      <span>{props.t("Add Emi")}</span>
                    </Link>

                  </li>
                  <Link to="/emi-report/" >
                    <LuCircleCheckBig size={20} style={{ marginRight: '8px' }} />
                    <span>{props.t("Emi Details")}</span>
                  </Link>
                </ul>
              </li>


            ) : null}

            {role === 'Warehouse Admin' || role === 'ADMIN' ? (
              <li>
                <Link to="/warehouse/waitingproducts/" >
                  <BsArrowRightSquareFill size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("products Waiting For Confirmation")}</span>
                </Link>
              </li>


            ) : null}

            {role === 'ADMIN' || role === 'ACCOUNTS' || role === 'IT' ? (
              <li>
                <Link to="#" >
                  <GiBassetHoundHead size={20} style={{ marginRight: '8px' }} />
                  <span>{props.t("Compony Asset Information")}</span>
                </Link>

                <ul>
                  <li>
                    <Link to="/profile/asset/" >
                      <MdOutlineVideogameAsset size={20} style={{ marginRight: '8px' }} />
                      <span>{props.t("Assets")}</span>
                    </Link>

                  </li>

                  <Link to="/profile/liability/" >
                    <LuCircleCheckBig size={20} style={{ marginRight: '8px' }} />
                    <span>{props.t("Liability Information")}</span>
                  </Link>

                  <li>
                    <Link to="/profile/total/assets/" >
                      <IoMdInformationCircleOutline size={20} style={{ marginRight: '8px' }} />
                      <span>{props.t("compony profile summary")}</span>
                    </Link>

                  </li>
                </ul>
              </li>


            ) : null}

          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withRouter(withTranslation()(SidebarContent));
