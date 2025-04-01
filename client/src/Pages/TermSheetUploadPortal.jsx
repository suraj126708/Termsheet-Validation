/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Upload,
  Check,
  X,
  AlertCircle,
  Eye,
  ChevronLeft,
  Download,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

// Import styles directly (you might need to add these packages)
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

const TermSheetUploadPortal = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pdfText, setPdfText] = useState(""); // Fix unused state
  const [extractedTerms, setExtractedTerms] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const fileInputRef = useRef(null);

  // Clean up object URLs when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const addFiles = (newFiles) => {
    const updatedFiles = [...files];

    newFiles.forEach((file) => {
      // Check if file is already in the list
      if (
        !updatedFiles.some((f) => f.name === file.name && f.size === file.size)
      ) {
        const fileType = getFileType(file);
        updatedFiles.push({
          name: file.name,
          size: file.size,
          type: fileType,
          status: "pending",
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          file: file, // Store the actual file for preview
        });
      }
    });

    setFiles(updatedFiles);
  };

  const getFileType = (file) => {
    const extension = file.name.split(".").pop().toLowerCase();

    if (["pdf"].includes(extension)) return "pdf";
    if (["doc", "docx"].includes(extension)) return "document";
    if (["xls", "xlsx", "csv"].includes(extension)) return "spreadsheet";
    if (["eml", "msg"].includes(extension)) return "email";
    if (["txt", "rtf"].includes(extension)) return "text";
    return "other";
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "document":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      case "email":
        return <Mail className="w-5 h-5 text-purple-500" />;
      case "text":
        return <MessageSquare className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const removeFile = (id) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const processFiles = () => {
    if (files.length === 0) return;

    setProcessingStatus("processing");

    // Simulate processing with a delay
    setTimeout(() => {
      const updatedFiles = files.map((file) => ({
        ...file,
        status: Math.random() > 0.2 ? "success" : "error", // Random success/error for demo
      }));

      setFiles(updatedFiles);
      setProcessingStatus("completed");
    }, 2000);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const openFilePreview = (file) => {
    setPreviewFile(file);
    setCurrentPage(1);
    setPdfText("");
    setExtractedTerms(null);
    setPdfLoadError(null);

    // Create object URL for PDF if it's a PDF file
    if (file.type === "pdf" && file.file) {
      try {
        const url = URL.createObjectURL(file.file);
        setPdfUrl(url);
      } catch (error) {
        console.error("Error creating object URL:", error);
        setPdfLoadError("Failed to load PDF file");
        setPdfUrl(null);
      }
    } else {
      setPdfUrl(null);
    }
  };

  const closeFilePreview = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPreviewFile(null);
    setPdfText("");
    setExtractedTerms(null);
    setPdfLoadError(null);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const zoomIn = () => {
    setZoomLevel((prevZoom) => Math.min(prevZoom + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prevZoom) => Math.max(prevZoom - 0.25, 0.5));
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setTotalPages(numPages);
    setPdfLoadError(null);
    extractTextFromPDF(); // Ensure text extraction happens after successful load
  };

  const onDocumentLoadError = (error) => {
    console.error("Error loading PDF:", error);
    setPdfLoadError(
      "Failed to load PDF file. Please make sure it's a valid PDF."
    );
  };

  const extractTextFromPDF = async () => {
    try {
      if (!pdfUrl) return;

      const loadingTask = pdfjs.getDocument(pdfUrl); // Ensure proper loading
      const pdf = await loadingTask.promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item) => item.str);
        fullText += textItems.join(" ") + "\n";
      }

      setPdfText(fullText);
      extractTerms(fullText); // Parse terms after text extraction
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      setPdfLoadError("Failed to extract text from PDF");
    }
  };

  const extractTerms = (text) => {
    // In a real app, you would use NLP or regex patterns to extract terms
    // This is a simplified demo version with pattern matching

    // Example patterns to look for
    const patterns = {
      transactionType: /Transaction Type[:\s]+([^.\n]+)/i,
      principalAmount:
        /(?:Principal|Amount|Facility Amount)[:\s]+([$€£]?\s?\d[\d,]*(?:\.\d+)?(?:\s?[Mm]illion)?)/i,
      maturityDate: /Maturity Date[:\s]+([^.\n]+)/i,
      interestRate: /Interest Rate[:\s]+([^.\n]+)/i,
      borrower: /Borrower[:\s]+([^.\n]+)/i,
      lender: /Lender[:\s]+([^.\n]+)/i,
    };

    // Extract data using patterns
    const extractedData = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        extractedData[key] = match[1].trim();
      }
    }

    // If we found some terms, set them
    if (Object.keys(extractedData).length > 0) {
      // Fill in placeholders for demo if some terms weren't found
      const terms = {
        transactionType: extractedData.transactionType || "Term Loan Facility",
        principalAmount: extractedData.principalAmount || "$25,000,000",
        maturityDate: extractedData.maturityDate || "March 15, 2030",
        interestRate: extractedData.interestRate || "SOFR + 3.25%",
        borrower: extractedData.borrower || "Acme Corporation",
        lender: extractedData.lender || "First National Bank",
      };

      setExtractedTerms(terms);
    }
  };

  // Main render for the entire component
  return (
    <div className="flex mt-36 flex-col w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {previewFile ? (
        // File preview view
        <div className="space-y-4">
          <div className="flex items-center mb-2">
            <button
              className="flex items-center text-blue-600 hover:text-blue-800"
              onClick={closeFilePreview}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to files
            </button>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center space-x-3">
              {getFileIcon(previewFile.type)}
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {previewFile.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatFileSize(previewFile.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {previewFile.status === "success" && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {previewFile.status === "error" && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <button className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          {previewFile.type === "pdf" && pdfUrl ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={zoomOut}
                    className="p-2 rounded-full hover:bg-gray-200"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-5 h-5 text-gray-700" />
                  </button>
                  <span className="flex items-center text-gray-700">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={zoomIn}
                    className="p-2 rounded-full hover:bg-gray-200"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "text-gray-400"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "text-gray-400"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>

              <div
                className="flex justify-center bg-white border rounded-lg p-4 overflow-auto"
                style={{ minHeight: "500px" }}
              >
                {pdfLoadError ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-500 font-medium">{pdfLoadError}</p>
                    <p className="text-gray-500 mt-2 text-center max-w-md">
                      There was a problem loading the PDF. Please make sure its
                      a valid PDF file.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: "top center",
                    }}
                  >
                    {/* PDF.js Document viewer */}
                    <Document
                      file={pdfUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      options={{
                        cMapUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`, // Fix cMapUrl
                        cMapPacked: true,
                      }}
                    >
                      <Page
                        pageNumber={currentPage}
                        width={600}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                  </div>
                )}
              </div>

              {/* Terms extraction - only show if no error */}
              {!pdfLoadError && (
                <div className="mt-6 p-4 bg-white border rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Extracted Terms
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Transaction Type
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.transactionType ||
                            "Term Loan Facility"}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Principal Amount
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.principalAmount || "$25,000,000"}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Maturity Date
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.maturityDate || "March 15, 2030"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Interest Rate
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.interestRate || "SOFR + 3.25%"}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Borrower
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.borrower || "Acme Corporation"}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-sm font-medium text-gray-700">
                          Lender
                        </p>
                        <p className="text-gray-800">
                          {extractedTerms?.lender || "First National Bank"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      * These terms have been extracted from the document and
                      may require verification.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="border rounded-lg p-6 bg-white flex justify-center items-center"
              style={{ minHeight: "400px" }}
            >
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  File Preview Not Available
                </h3>
                <p className="text-gray-500 max-w-md">
                  Preview is currently only available for PDF files. For other
                  file formats, please process the document to extract terms.
                </p>
              </div>
            </div>
          )}

          {previewFile.status !== "pending" && (
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Validation Status
              </h3>
              <div
                className={`p-4 rounded-lg ${
                  previewFile.status === "success" ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-start">
                  {previewFile.status === "success" ? (
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-500 mr-3 mt-1" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {previewFile.status === "success"
                        ? "Document Validated Successfully"
                        : "Validation Issues Detected"}
                    </p>
                    <p className="text-gray-600 mt-1">
                      {previewFile.status === "success"
                        ? "All required terms have been identified and match expected patterns."
                        : "Some terms require manual review or may be missing from the document."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Main upload interface
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Term Sheet Validation Portal
          </h1>
          <p className="text-gray-600 mb-6">
            Upload your term sheets in any format for AI-powered validation and
            analysis
          </p>

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-400"
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.eml,.msg,.txt,.rtf"
            />

            <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Drag & drop files here or click to browse
            </h3>
            <p className="text-gray-500">
              Support for PDF, Word, Excel, Emails, and Text files
            </p>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Uploaded Files
              </h3>
              <div className="border rounded-lg divide-y">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === "success" && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}

                      <button
                        onClick={() => openFilePreview(file)}
                        className="p-1 rounded-full hover:bg-blue-100 text-blue-600"
                        title="View file"
                      >
                        <Eye className="w-5 h-5" />
                      </button>

                      {file.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 ml-1"
                          title="Remove file"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-4">
            <button
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => setFiles([])}
              disabled={files.length === 0 || processingStatus === "processing"}
            >
              Clear All
            </button>
            <button
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                files.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : processingStatus === "processing"
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              onClick={processFiles}
              disabled={files.length === 0 || processingStatus === "processing"}
            >
              {processingStatus === "processing"
                ? "Processing..."
                : "Validate Term Sheets"}
            </button>
          </div>

          {/* Processing status */}
          {processingStatus === "completed" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Processing Results
              </h3>
              <div className="flex space-x-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {files.length}
                  </p>
                  <p className="text-sm text-gray-600">Files Processed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {files.filter((f) => f.status === "success").length}
                  </p>
                  <p className="text-sm text-gray-600">
                    Successfully Validated
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {files.filter((f) => f.status === "error").length}
                  </p>
                  <p className="text-sm text-gray-600">Require Attention</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TermSheetUploadPortal;
