import React from "react";
import { Navigate } from "react-router-dom";

// Pages Component
import Chat from "../pages/Chat/Chat";

// // File Manager
import FileManager from "../pages/FileManager/index";

// // Profile
import UserProfile from "../pages/Authentication/user-profile";
import Movement from "../pages/Movements/movement";

// Pages Calendar
import Calendar from "../pages/Calendar/index";

// // //Tasks
import TasksList from "../pages/Tasks/tasks-list";
import TasksCreate from "../pages/Tasks/tasks-create";
import TasksKanban from "../pages/Tasks/tasks-kanban";

// // //Projects
import ProjectsGrid from "../pages/Projects/projects-grid";
import ProjectsList from "../pages/Projects/projects-list";
import ProjectsOverview from "../pages/Projects/ProjectOverview/projects-overview";
import ProjectsCreate from "../pages/Projects/projects-create";
import ExcelOrderCreation from "../pages/Product/ExcelOrderCreation";

// // //Ecommerce Pages
import EcommerceProducts from "../pages/Ecommerce/EcommerceProducts";
import EcommerceProductVariant from "../pages/Ecommerce/ProductVariant";
import ProductTableData from "../pages/Ecommerce/ProductTable"
import VariantProductUpdate from "../pages/Ecommerce/variantProductUpdate";

import EcommerceProductDetail from "../pages/Ecommerce/EcommerceProductDetail/index";
import EcommerceOrders from "../pages/Ecommerce/EcommerceOrders/index";
import EcommerceCustomers from "../pages/Ecommerce/EcommerceCustomers/index";
import EcommerceCart from "../pages/Ecommerce/EcommerceCart";
import EcommerceCheckout from "../pages/Ecommerce/EcommerceCheckout";
import EcommerceShops from "../pages/Ecommerce/EcommerceShops/index";
import EcommerenceAddProduct from "../pages/Ecommerce/EcommerceAddProduct";

// //Email
import EmailInbox from "../pages/Email/email-inbox";
import EmailRead from "../pages/Email/email-read";
import EmailBasicTemplte from "../pages/Email/email-basic-templte";
import EmailAlertTemplte from "../pages/Email/email-template-alert";
import EmailTemplateBilling from "../pages/Email/email-template-billing";

// //Invoices
import InvoicesList from "../pages/Invoices/invoices-list";
import InvoiceDetail from "../pages/Invoices/invoices-detail";

// // Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";
import AssetsMangement from "../pages/Assets/Asset";
import LibalityManagement from "../pages/Assets/Liability";
import TotalComponyAssets from "../pages/Assets/TotalComponyAssets";

// //  // Inner Authentication
import Login1 from "../pages/AuthenticationInner/Login";
import Login2 from "../pages/AuthenticationInner/Login2";
import Register1 from "../pages/AuthenticationInner/Register";
import Register2 from "../pages/AuthenticationInner/Register2";
import Recoverpw from "../pages/AuthenticationInner/Recoverpw";
import Recoverpw2 from "../pages/AuthenticationInner/Recoverpw2";
import ForgetPwd1 from "../pages/AuthenticationInner/ForgetPassword";
import ForgetPwd2 from "../pages/AuthenticationInner/ForgetPassword2";
import LockScreen from "../pages/AuthenticationInner/auth-lock-screen";
import LockScreen2 from "../pages/AuthenticationInner/auth-lock-screen-2";
import ConfirmMail from "../pages/AuthenticationInner/page-confirm-mail";
import ConfirmMail2 from "../pages/AuthenticationInner/page-confirm-mail-2";
import EmailVerification from "../pages/AuthenticationInner/auth-email-verification";
import EmailVerification2 from "../pages/AuthenticationInner/auth-email-verification-2";
import TwostepVerification from "../pages/AuthenticationInner/auth-two-step-verification";
import TwostepVerification2 from "../pages/AuthenticationInner/auth-two-step-verification-2";

// // Dashboard
import Dashboard from "../pages/Dashboard/index";
import DashboardSaas from "../pages/Dashboard-saas/index";
import DashboardCrypto from "../pages/Dashboard-crypto/index";
import Blog from "../pages/Dashboard-Blog/index";
import DashboardJob from "../pages/DashboardJob/index";




// //Crypto
import CryptoWallet from "../pages/Crypto/CryptoWallet/crypto-wallet";
import CryptoBuySell from "../pages/Crypto/crypto-buy-sell";
import CryptoExchange from "../pages/Crypto/crypto-exchange";
import CryptoLending from "../pages/Crypto/crypto-lending";
import CryptoOrders from "../pages/Crypto/CryptoOrders";
import CryptoKYCApplication from "../pages/Crypto/crypto-kyc-application";
import CryptoIcoLanding from "../pages/Crypto/CryptoIcoLanding/index";

// // Charts
import ChartApex from "../pages/Charts/Apexcharts";
import ChartjsChart from "../pages/Charts/ChartjsChart";
import EChart from "../pages/Charts/EChart";
import SparklineChart from "../pages/Charts/SparklineChart";
import ChartsKnob from "../pages/Charts/charts-knob";
import ReCharts from "../pages/Charts/ReCharts";

// // Maps
// import MapsGoogle from "../pages/Maps/MapsGoogle";

// //Icons
import IconBoxicons from "../pages/Icons/IconBoxicons";
import IconDripicons from "../pages/Icons/IconDripicons";
import IconMaterialdesign from "../pages/Icons/IconMaterialdesign";
import IconFontawesome from "../pages/Icons/IconFontawesome";

// //Tables
import BasicTables from "../pages/Tables/BasicTables";
import DatatableTables from "../pages/Tables/DatatableTables";

// //Blog
import BlogList from "../pages/Blog/BlogList/index";
import BlogGrid from "../pages/Blog/BlogGrid/index";
import BlogDetails from "../pages/Blog/BlogDetails";

//Job
import JobGrid from "../pages/JobPages/JobGrid/index";
import JobDetails from "../pages/JobPages/JobDetails";
import JobCategories from "../pages/JobPages/JobCategories";
import JobList from "../pages/JobPages/JobList/index";
import ApplyJobs from "../pages/JobPages/ApplyJobs/index";
import CandidateList from "../pages/JobPages/CandidateList";
import CandidateOverview from "../pages/JobPages/CandidateOverview";

// // Forms
import FormElements from "../pages/Forms/FormElements";
import FormLayouts from "../pages/Forms/FormLayouts";
import FormAdvanced from "../pages/Forms/FormAdvanced/index";
import FormEditors from "../pages/Forms/FormEditors";
import FormValidations from "../pages/Forms/FormValidations";
import FormMask from "../pages/Forms/FormMask";
import FormRepeater from "../pages/Forms/FormRepeater";
import FormUpload from "../pages/Forms/FormUpload";
import FormWizard from "../pages/Forms/FormWizard";
import DualListbox from "../pages/Tables/DualListbox";
import Emi from "../pages/Emi/Emi";
import EmiDetails from "../pages/Emi/EmiDetails";
import EmiTotalInfo from "../pages/Emi/EmiTotalInfo";

// //Ui
import UiAlert from "../pages/Ui/UiAlerts/index";
import UiButtons from "../pages/Ui/UiButtons/index";
import UiCards from "../pages/Ui/UiCard/index";
import UiCarousel from "../pages/Ui/UiCarousel";
import UiColors from "../pages/Ui/UiColors";
import UiDropdown from "../pages/Ui/UiDropdown/index";
import UiOffCanvas from "../pages/Ui/UiOffCanvas";

import UiGeneral from "../pages/Ui/UiGeneral";
import UiGrid from "../pages/Ui/UiGrid";
import UiImages from "../pages/Ui/UiImages";
// import UiLightbox from "../pages/Ui/UiLightbox";
import UiModal from "../pages/Ui/UiModal/index";


import UiTabsAccordions from "../pages/Ui/UiTabsAccordions";
import UiTypography from "../pages/Ui/UiTypography";
import UiVideo from "../pages/Ui/UiVideo";
import UiSessionTimeout from "../pages/Ui/UiSessionTimeout";
import UiRating from "../pages/Ui/UiRating";
import UiRangeSlider from "../pages/Ui/UiRangeSlider";
import UiNotifications from "../pages/Ui/UINotifications";

import UiPlaceholders from "../pages/Ui/UiPlaceholders";
import UiToasts from "../pages/Ui/UiToast";
import UiUtilities from "../pages/Ui/UiUtilities";


// Staffs
import StaffTable from "../pages/Staff/StaffTable";
import StaffForm from "../pages/Staff/RegisterStaff";
import StaffEdit from "../pages/Staff/StaffUpdate";
import CategoryTable from "../pages/Expense/Addcategory";

// Staffs
import CustomerTable from "../pages/Customers/customerTable";
import CustomerForm from "../pages/Customers/add-customers";
import Address from "../pages/Customers/address";
import CustomerEdit from "../pages/Customers/CustomerUpdate";
import Ledger from "../pages/Customers/Ledger";
import Bulkcustomers from '../pages/Staff-Customers/Bulkcustomers';


// supervisor

import SupervisorTable from "../pages/Supervisor/supervisors";
import SupervisorForm from "../pages/Supervisor/supervisor";


import CreateOrder from "../pages/Order/OrderCreate";
import OrderTable from "../pages/Order/OrderList";
import OrderItems from "../pages/Order/OrderProducts";
import Warehouseorders from "../pages/Order/orderrequestwarehouse";
import OrderwarehouseConform from "../pages/Order/wareorderconform"
import Stafforder from '../pages/Order/Stafforder'



import StaffOrderCreate from "../pages/StaffOrders/OrderCreate";
// import StaffOrdersList from "../pages/StaffOrders/OrderList"
import StaffOrdersList from "../pages/Order/OrderList";





import StaffBasedCustomers from "../pages/Staff-Customers/Staff-based-customers"
import AddStaffBasedCustomers from "../pages/Staff-Customers/Add-customers"


/////warehouse section

import AddWarehousePage from "../pages/warehouse/addwarehouse";




//perfoma Invoice

import InvoiceTable from "../pages/PerfomaInvoive/CreatePerfomaInvoice";
import InvoiceList from "../pages/PerfomaInvoive/PerfomaInvoiceList"
import Invoice from "../pages/PerfomaInvoive/PerfoamInvoiceProducts";
import GenerateInvoice from "../pages/PerfomaInvoive/Invoice"

import States from "../pages/State/stateTable";
import Departments from "../pages/Department/departments";
import Family from "../pages/Family/Families";


import Attrubutes from "../pages/Attributes/attribute";
import AttributeValues from "../pages/Attributes/attribute-values";

import ProductUpdate from "../pages/Ecommerce/ProductUpdateForm";


import Bank from "../pages/Bank/Add-Bank";
import BankList from "../pages/Bank/Banks";
import BankModule from "../pages/Bank/BankModule";
import AddExpanseModal from "../pages/Expense/AddExpanseModal";





//expense 

import AddExpense from "../pages/Expense/AddExpense";
import ExpenseList from "../pages/Expense/ListExpenses"

// Repots

import Salesreport from "../pages/Resports/SaleReposts";
import InvoiceDatas from "../pages/Resports/FilderdOrders";
import StaffOrders from "../pages/Resports/Bills";
import CreditSales from "../pages/Resports/CreditSale";
import CreditOrders from "../pages/Resports/Creditorders";
import StockReport from "../pages/Resports/StockReport";

// company  

import Company from "../pages/Company/Company";
import Companies from "../pages/Company/Companies";

// GRV 

import GrvTable from "../pages/GRV/GRC-table";
import GrvForm from "../pages/GRV/GRV-creating";


//PRODUCT

import Product from "../pages/Product/Add-product";
import ProductList from "../pages/Product/Products";
import Images from "../pages/Product/Images";
import BulkProduct from "../pages/Product/Bulk-product";
import WaitingProducts from "../pages/Product/waitingProducts";


//DJM

import DGmTable from "../pages/DGM/Delivery-notes";
import ParcelDetails from "../pages/DGM/Packing";
import Dailygoodmovment from "../pages/DGM/Daily-Goods-Movments";
import DGmTable2 from "../pages/DGM/Delivery-notes2";




// Super visor based customer 

import ManagedStaffCustomers from "../pages/BDM/Customers";
import FamilyBasedOrders from "../pages/BDM/Orders";




// COD ORDERS

import CodOrders from "../pages/Resports/Cod";
import CodOrdersDetails from "../pages/Resports/Codfilterdorders";


// STATE

import StatewaiseReport from "../pages/Resports/States";
import Statewisestaffsale from "../pages/Resports/StatesReport";


import ExpensReport from "../pages/Resports/ExpenseReport";

import DeliveryReports from "../pages/Resports/DeliveryReposrts";
import DeliveryReportsDeliverdOrdes from "../pages/Resports/DeliveryReportsFilter";


import ProductSalesReport from "../pages/Resports/ProductSalesReport";





// //Pages
import PagesStarter from "../pages/Utility/pages-starter";
import PagesMaintenance from "../pages/Utility/pages-maintenance";
import PagesComingsoon from "../pages/Utility/pages-comingsoon";
import PagesTimeline from "../pages/Utility/pages-timeline";
import PagesFaqs from "../pages/Utility/pages-faqs";
import PagesPricing from "../pages/Utility/pages-pricing";
import Pages404 from "../pages/Utility/pages-404";
import Pages500 from "../pages/Utility/pages-500";

// //Contacts
import ContactsGrid from "../pages/Contacts/contacts-grid";
import ContactsList from "../pages/Contacts/ContactList/contacts-list";
import ContactsProfile from "../pages/Contacts/ContactsProfile/index";
import UiProgressbar from "../pages/Ui/UiProgressbar";
import { components } from "react-select";

// Dashboard Details
import TodaysBillDetails from "../pages/DashboardDetails/TodaysBillDetails";
import GRVWaitingForConfirmationDetails from "../pages/DashboardDetails/GRVWaitingForConfirmationDetails";
import ShippedDetails from "../pages/DashboardDetails/ShippedDetails";
import WaitingForApprovalDetails from "../pages/DashboardDetails/WaitingForApprovalDetails";
import WaitingForConfirmationDetails from "../pages/DashboardDetails/WaitingForConfirmationDetails";
import UpdateExpense from "../pages/Expense/UpdateExpense";
import OrderList2 from "../pages/Order/OrderList2";
import PerfomaOrder from "../pages/PerfomaInvoive/PerfomaOrder";
import CallLogReport from "../pages/Resports/CallLogReport";
import AdvanceReceipt from "../pages/Receipts/AdvanceReceipt";
import OtherReceipt from "../pages/Receipts/OtherReceipt";
import OrderReceipt from "../pages/Receipts/OrderReceipt";
import ReceiptList from "../pages/Receipts/ReceiptList";
import AdvanceReceiptList from "../pages/Receipts/AdvanceReceiptList";
import OrderReceiptList from "../pages/Receipts/OrderReceiptList";
import OtherReceiptList from "../pages/Receipts/OtherReceiptList";
import AddParcelService from "../pages/ParcelServices/AddParcelService";
import MonthlySalesReport from "../pages/Resports/MonthlySalesReport";
import TrackingReport from "../pages/Resports/TrackingReport";
import DivisionWiseReport from "../pages/Resports/DivisionWiseReport";
import InternalTransfer from "../pages/Receipts/InternalTransfer";
import InternalTransferList from "../pages/Receipts/InternalTransferList";
import ParcelServiceData from "../pages/DGM/ParcelServiceData";
import CountryCode from "../pages/country/CountryCode";
import AddRack from "../pages/RackDetails/AddRack";
import FamilyDetails from "../pages/DashboardJob/FamilyDetails";
import AddCategory from "../pages/Product/AddCategory";
import CustomerType from "../pages/CustomerType/CustomerType";
import DataLog from "../pages/DataLog/DataLog"
import InvoiceApproved from "../pages/Order/InvoiceApproved";
import WaitingForConfirmation from "../pages/Order/WaitingForConfirmation";
import ToPrint from "../pages/Order/ToPrint";
import InvoiceCreated from "../pages/Order/InvoiceCreated";
import PackingUnderProgress from "../pages/Order/PackingUnderProgress";
import Packed from "../pages/Order/Packed";
import ReadyToShip from "../pages/Order/ReadyToShip";
import Shipped from "../pages/Order/Shipped";
import InvoiceRejected from "../pages/Order/InvoiceRejected";
import GSTReport from "../pages/Resports/GSTReport";


// import UiProgressbar from "../../src/pages/Ui/UiProgressbar"

const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/dashboard-saas", component: <DashboardSaas /> },
  { path: "/dashboard-crypto", component: <DashboardCrypto /> },
  { path: "/blog", component: <Blog /> },
  { path: "/dashboard/", component: <DashboardJob /> },
  { path: "/dashboard/family/details", component: <FamilyDetails /> },

  //   //Crypto
  { path: "/crypto-wallet", component: <CryptoWallet /> },
  { path: "/crypto-buy-sell", component: <CryptoBuySell /> },
  { path: "/crypto-exchange", component: <CryptoExchange /> },
  { path: "/crypto-lending", component: <CryptoLending /> },
  { path: "/crypto-orders", component: <CryptoOrders /> },
  { path: "/crypto-kyc-application", component: <CryptoKYCApplication /> },

  //chat
  { path: "/chat", component: <Chat /> },

  //File Manager
  { path: "/apps-filemanager", component: <FileManager /> },

  // //calendar
  { path: "/calendar", component: <Calendar /> },

  //   // //profile
  { path: "/profile", component: <UserProfile /> },
  { path: "/add-emi/", component: <Emi /> },
  { path: "/emi-report/", component: <EmiDetails /> },
  { path: "/emi-fulldetails/:id/", component: <EmiTotalInfo /> },
  { path: "/profile/asset/", component: <AssetsMangement /> },
  { path: "/profile/liability/", component: <LibalityManagement /> },
  { path: "/profile/total/assets/", component: <TotalComponyAssets /> },
  { path: "/expense/add-expanse-modal/", component: <AddExpanseModal /> },




  //stafs
  { path: "/all-staffs", component: <StaffTable /> },
  { path: "/add-staffs", component: <StaffForm /> },
  { path: "/edit/staffs/:id/", component: <StaffEdit /> },


  // customers
  { path: "/all-customers/", component: <CustomerTable /> },
  { path: "/add-customers/", component: <CustomerForm /> },
  { path: "customer/address/:id/add/", component: <Address /> },
  { path: "/customer/:id/ledger/", component: <Ledger /> },
  { path: "/customer/:id/edit/", component: <CustomerEdit /> },
  { path: "/customers/beposoft", component: <Bulkcustomers /> },
  { path: "/customer/type", component: <CustomerType /> },


  // {path: "/all-customers/",component:<CustomerTable />},
  { path: "/add/products/", component: <Product /> },
  { path: "/product/list/", component: <ProductList /> },
  { path: "/product/:id/Images/", component: <Images /> },
  { path: "/add/products/bulk/", component: <BulkProduct /> },
  { path: "/warehouse/waitingproducts/", component: <WaitingProducts /> },
  { path: "/product/category/", component: <AddCategory /> },

  // Receipts
  { path: "/advance/receipt/", component: <AdvanceReceipt /> },
  { path: "/other/receipt/", component: <OtherReceipt /> },
  { path: "/order/receipt/", component: <OrderReceipt /> },
  { path: "/all/receipt/", component: <ReceiptList /> },
  { path: "/advance/receipt/view/", component: <AdvanceReceiptList /> },
  { path: "/other/receipt/view/", component: <OtherReceiptList /> },
  { path: "/order/receipt/view/", component: <OrderReceiptList /> },
  { path: "/internal/bank/transfer/", component: <InternalTransfer /> },
  { path: "/internal/bank/transfer/view/", component: <InternalTransferList /> },

  // company

  { path: "/add/beposoft/company/details/", component: <Company /> },
  { path: "/beposoft/companies/", component: <Companies /> },


  //GRV 

  { path: "/beposoft/new/grv/", component: <GrvForm /> },
  { path: "/beposoft/grv/view/", component: <GrvTable /> },

  //DGM
  { path: "/delivery/notes/", component: < DGmTable /> },
  { path: "/order/postoffice/", component: < DGmTable2 /> },
  { path: "/order/packing/:id/progress/", component: < ParcelDetails /> }, ,
  { path: "/daily/good/movment/", component: < Dailygoodmovment /> },
  { path: "/parcel/report/datewise/details/", component: <ParcelServiceData /> },


  ///warehouse....,
  { path: "/add/warehouse/", component: <AddWarehousePage /> },

  // Rack Details
  { path: "/rack/details/", component: <AddRack /> },

  //all supervisors

  { path: "/all-supervisors/", component: <SupervisorTable /> },
  { path: "/add-supervisors", component: <SupervisorForm /> },

  { path: "/New/Order/", component: <CreateOrder /> },
  { path: "/Orders/", component: <OrderTable /> },
  { path: "/Orders2", component: <OrderList2 /> },
  { path: "/order/:id/items/", component: <OrderItems /> },
  { path: "/order/:id/stafforder/", component: <Stafforder /> },
  { path: "/warehouseorder/:id/items", component: <OrderwarehouseConform /> },
  { path: "/orders/invoicecreated", component: <InvoiceCreated /> },
  { path: "/orders/invoiceapproved", component: <InvoiceApproved /> },
  { path: "/orders/waitingforconfirmation", component: <WaitingForConfirmation /> },
  { path: "/orders/toprint", component: <ToPrint /> },
  { path: "/orders/packingunderprogress", component: <PackingUnderProgress /> },
  { path: "/orders/packed", component: <Packed /> },
  { path: "/orders/readytoship", component: <ReadyToShip /> },
  { path: "/orders/shipped", component: <Shipped /> },
  { path: "/orders/invoicerejected", component: <InvoiceRejected /> },

  { path: "/order/warehousee/", component: <Warehouseorders /> },


  { path: "/staff/new/order/", component: <StaffOrderCreate /> },
  { path: "/staff/order/list/", component: <StaffOrdersList /> },


  { path: "/data/log/details/", component: <DataLog /> },

  { path: "/create/perfoma/invoice/", component: <InvoiceTable /> },
  { path: "/perfoma/invoices/", component: <InvoiceList /> },
  { path: "/perfoma/invoice/:invoice/view/", component: <Invoice /> },
  { path: "/generate/perfoma/invoice/:invoice/", component: <GenerateInvoice /> },
  { path: "/perfoma/order/:invoice/", component: <PerfomaOrder /> },




  { path: "/all/staff/customers/", component: <StaffBasedCustomers /> },
  { path: "/add/staff/customer/", component: <AddStaffBasedCustomers /> },
  { path: "/managed/staff/customer/", component: <ManagedStaffCustomers /> },
  { path: "/managed/family/order/", component: <FamilyBasedOrders /> },


  // all states

  { path: "/all-states/", component: <States /> },
  { path: "/all-departments/", component: <Departments /> },
  { path: "/all-families/", component: <Family /> },
  { path: "/attributes", component: <Attrubutes /> },
  { path: "/attribute-values/", component: <AttributeValues /> },
  { path: "/add/view/country/code/", component: <CountryCode /> },



  //   //Ecommerce
  {
    path: "/ecommerce-product-detail/:id/:type/", component: <EcommerceProductDetail />,
  },
  { path: "/ecommerce-products", component: <ProductTableData /> },
  { path: "/ecommerce-product-variant/:id/:type/", component: <EcommerceProductVariant /> },
  { path: "/ecommerce-product-edit/:id/", component: <ProductUpdate /> },

  { path: "/ecommerce-orders", component: <EcommerceOrders /> },
  { path: "/ecommerce-customers", component: <EcommerceCustomers /> },
  { path: "/ecommerce-cart", component: <EcommerceCart /> },
  { path: "/ecommerce-checkout", component: <EcommerceCheckout /> },
  { path: "/ecommerce-shops", component: <EcommerceShops /> },
  { path: "/ecommerce-add-product", component: <EcommerenceAddProduct /> },
  { path: "/ecommerce/product/:id/update/", component: <VariantProductUpdate /> },

  //   //Email
  { path: "/email-inbox", component: <EmailInbox /> },
  { path: "/email-read/:id?", component: <EmailRead /> },
  { path: "/email-template-basic", component: <EmailBasicTemplte /> },
  { path: "/email-template-alert", component: <EmailAlertTemplte /> },
  { path: "/email-template-billing", component: <EmailTemplateBilling /> },

  //   //Invoices
  { path: "/invoices-list", component: <InvoicesList /> },
  { path: "/invoices-detail", component: <InvoiceDetail /> },
  { path: "/invoices-detail/:id?", component: <InvoiceDetail /> },

  //   // Tasks
  { path: "/tasks-list", component: <TasksList /> },
  { path: "/tasks-create", component: <TasksCreate /> },
  { path: "/tasks-kanban", component: <TasksKanban /> },

  //   //Projects
  { path: "/projects-grid", component: <ProjectsGrid /> },
  { path: "/projects-list", component: <ProjectsList /> },
  { path: "/projects-overview", component: <ProjectsOverview /> },
  { path: "/projects-overview/:id", component: <ProjectsOverview /> },
  { path: "/projects-create", component: <ProjectsCreate /> },
  { path: "/movement/:id", component: <Movement /> },

  // Parcel Services
  { path: "/add/parcel/service/", component: <AddParcelService /> },

  //Bank

  { path: "/add/bank/", component: <Bank /> },
  { path: "/bank/datas/", component: <BankList /> },
  { path: "/bank/bankmodule", component: <BankModule /> },
  { path: "/add/expense/", component: <AddExpense /> },
  { path: "/expense/list/", component: <ExpenseList /> },
  { path: '/expense/add-category/', component: <CategoryTable /> },
  { path: "/expense/update/:id/", component: <UpdateExpense /> },


  { path: "/sales/reports/", component: <Salesreport /> },
  { path: "/calllog/reports/", component: <CallLogReport /> },
  { path: "/sales/view/:date/data/", component: <InvoiceDatas /> },
  { path: "/sales/resport/:id/staff/:date/:name/", component: <StaffOrders /> },
  { path: "/credit/sale/", component: <CreditSales /> },
  { path: "/credit/sales/report/:date/", component: <CreditOrders /> },
  { path: "/product/stock/report/", component: <StockReport /> },
  { path: "/product/add-excel/", component: <ExcelOrderCreation /> },
  { path: "/monthly/sales/report/", component: <MonthlySalesReport /> },
  { path: "/orders/tracking/report/", component: <TrackingReport /> },
  { path: "/gst/report/", component: <GSTReport /> },



  { path: "/COD/sales/resport/", component: <CodOrders /> },
  { path: "/COD/sales/resport/:date/", component: <CodOrdersDetails /> },


  { path: "/states/sales/resport/", component: <StatewaiseReport /> },
  { path: "/state/sales/view/:name/data/", component: <Statewisestaffsale /> },


  { path: "/expense/report/", component: <ExpensReport /> },
  { path: "/Delivery/report/", component: <DeliveryReports /> },
  { path: "/delivery/:date/reports/", component: <DeliveryReportsDeliverdOrdes /> },
  { path: "/product/sold/report/", component: <ProductSalesReport /> },
  { path: "/division/wise/report/", component: <DivisionWiseReport /> },

  //   //Blog
  { path: "/blog-list", component: <BlogList /> },
  { path: "/blog-grid", component: <BlogGrid /> },
  { path: "/blog-details", component: <BlogDetails /> },

  { path: "/job-grid", component: <JobGrid /> },
  { path: "/job-details", component: <JobDetails /> },
  { path: "/job-categories", component: <JobCategories /> },
  { path: "/job-list", component: <JobList /> },
  { path: "/job-apply", component: <ApplyJobs /> },
  { path: "/candidate-list", component: <CandidateList /> },
  { path: "/candidate-overview", component: <CandidateOverview /> },

  // Contacts
  { path: "/contacts-grid", component: <ContactsGrid /> },
  { path: "/contacts-list", component: <ContactsList /> },
  { path: "/contacts-profile", component: <ContactsProfile /> },

  //   //Charts
  { path: "/apex-charts", component: <ChartApex /> },
  { path: "/chartjs-charts", component: <ChartjsChart /> },
  { path: "/e-charts", component: <EChart /> },
  { path: "/sparkline-charts", component: <SparklineChart /> },
  { path: "/charts-knob", component: <ChartsKnob /> },
  { path: "/re-charts", component: <ReCharts /> },

  //   // Icons
  { path: "/icons-boxicons", component: <IconBoxicons /> },
  { path: "/icons-dripicons", component: <IconDripicons /> },
  { path: "/icons-materialdesign", component: <IconMaterialdesign /> },
  { path: "/icons-fontawesome", component: <IconFontawesome /> },

  //   // Tables
  { path: "/tables-basic", component: <BasicTables /> },
  { path: "/tables-datatable", component: <DatatableTables /> },

  //   // Maps
  // { path: "/maps-google", component: <MapsGoogle /> },

  //   // Forms
  { path: "/form-elements", component: <FormElements /> },
  { path: "/form-layouts", component: <FormLayouts /> },
  { path: "/form-advanced", component: <FormAdvanced /> },
  { path: "/form-editors", component: <FormEditors /> },
  { path: "/form-mask", component: <FormMask /> },
  { path: "/form-repeater", component: <FormRepeater /> },
  { path: "/form-uploads", component: <FormUpload /> },
  { path: "/form-wizard", component: <FormWizard /> },
  { path: "/form-validation", component: <FormValidations /> },
  { path: "/dual-listbox", component: <DualListbox /> },

  // Table details
  { path: "/dashboard/todaysbill-details", component: <TodaysBillDetails /> },
  { path: "/dashboard/grvwaitingforconfirmation-details", component: <GRVWaitingForConfirmationDetails /> },
  { path: "/dashboard/shipped-details", component: <ShippedDetails /> },
  { path: "/dashboard/waitingforapproval-details", component: <WaitingForApprovalDetails /> },
  { path: "/dashboard/waitingforconfirmation-details", component: <WaitingForConfirmationDetails /> },

  //   // Ui
  { path: "/ui-alerts", component: <UiAlert /> },
  { path: "/ui-buttons", component: <UiButtons /> },
  { path: "/ui-cards", component: <UiCards /> },
  { path: "/ui-carousel", component: <UiCarousel /> },
  { path: "/ui-colors", component: <UiColors /> },
  { path: "/ui-dropdowns", component: <UiDropdown /> },
  { path: "/ui-offcanvas", component: <UiOffCanvas /> },
  { path: "/ui-general", component: <UiGeneral /> },
  { path: "/ui-grid", component: <UiGrid /> },
  { path: "/ui-images", component: <UiImages /> },
  // { path: "/ui-lightbox", component: <UiLightbox /> },
  { path: "/ui-modals", component: <UiModal /> },
  { path: "/ui-progressbars", component: <UiProgressbar /> },
  { path: "/ui-tabs-accordions", component: <UiTabsAccordions /> },
  { path: "/ui-typography", component: <UiTypography /> },
  { path: "/ui-video", component: <UiVideo /> },
  { path: "/ui-session-timeout", component: <UiSessionTimeout /> },
  { path: "/ui-rating", component: <UiRating /> },
  { path: "/ui-rangeslider", component: <UiRangeSlider /> },
  { path: "/ui-notifications", component: <UiNotifications /> },
  { path: "/ui-placeholders", component: <UiPlaceholders /> },
  { path: "/ui-toasts", component: <UiToasts /> },
  { path: "/ui-utilities", component: <UiUtilities /> },

  //   //Utility
  { path: "/pages-starter", component: <PagesStarter /> },
  { path: "/pages-timeline", component: <PagesTimeline /> },
  { path: "/pages-faqs", component: <PagesFaqs /> },
  { path: "/pages-pricing", component: <PagesPricing /> },

  //   // this route should be at the end of all other routes
  //   // eslint-disable-next-line react/display-name
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },

  { path: "/pages-maintenance", component: <PagesMaintenance /> },
  { path: "/pages-comingsoon", component: <PagesComingsoon /> },
  { path: "/pages-404", component: <Pages404 /> },
  { path: "/pages-500", component: <Pages500 /> },
  { path: "/crypto-ico-landing", component: <CryptoIcoLanding /> },

  //   // Authentication Inner
  { path: "/pages-login", component: <Login1 /> },
  { path: "/pages-login-2", component: <Login2 /> },
  { path: "/pages-register", component: <Register1 /> },
  { path: "/pages-register-2", component: <Register2 /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
  { path: "/page-recoverpw-2", component: <Recoverpw2 /> },
  { path: "/pages-forgot-pwd", component: <ForgetPwd1 /> },
  { path: "/pages-forgot-pwd-2", component: <ForgetPwd2 /> },
  { path: "/auth-lock-screen", component: <LockScreen /> },
  { path: "/auth-lock-screen-2", component: <LockScreen2 /> },
  { path: "/page-confirm-mail", component: <ConfirmMail /> },
  { path: "/page-confirm-mail-2", component: <ConfirmMail2 /> },
  { path: "/auth-email-verification", component: <EmailVerification /> },
  { path: "/auth-email-verification-2", component: <EmailVerification2 /> },
  { path: "/auth-two-step-verification", component: <TwostepVerification /> },
  {
    path: "/auth-two-step-verification-2",
    component: <TwostepVerification2 />,
  },
];

// export { authProtectedRoutes, publicRoutes };
export { authProtectedRoutes, publicRoutes }
