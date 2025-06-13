import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const ExcelOrderCreation = () => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState([]);

  // Handle file selection and preview
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Read Excel file
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet name
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];


        let parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });


        parsedData = parsedData.map(row =>
            row.map(cell => {
                if (cell === null || cell === undefined) return "";  // Replace null/undefined with empty string
                if (typeof cell === "number") return String(cell);  // Convert numbers to strings
                return cell;  // Leave text values as they are
            })
        );

        setExcelData(parsedData.slice(0, 5)); 
    };
    reader.readAsArrayBuffer(selectedFile);
};



  // Upload file to API
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${import.meta.env.VITE_APP_KEY}bulk/upload/products/`, formData, {
        headers: { "Content-Type": "multipart/form-data", 
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
      });

      console.log("Upload success:", response.data);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("File upload failed!");
    }
  };

  return (
    <div style={{ marginTop:"100px", justifyContent:"center", alignContent:"center"}}>
      <h2>Upload & Preview Excel File</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      
      {excelData.length > 0 && (
        <div>
          <h3>Preview (First 5 Rows)</h3>
          <table border="1">
            <thead>
              <tr>
                {excelData[0].map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleUpload}>Upload</button>
        </div>
      )}
    </div>
  );
};

export default ExcelOrderCreation;
