/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";

import HeroPage from "./Pages/HeroPage";
import LoginPage from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import ProtectedRoute from "./Authorisation/ProtectedRoute";
import { AuthProvider } from "./Authorisation/AuthProvider";
import NavBar from "./components/Navbar";
import TermSheetUploadPortal from "./Pages/TermSheetUploadPortal";
import PDFTextExtractor from "./components/ExtractTextFromPdf";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <ToastContainer />
        <BrowserRouter>
          <NavBar id="black" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/extract" element={<PDFTextExtractor />} />

            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <TermSheetUploadPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HeroPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
