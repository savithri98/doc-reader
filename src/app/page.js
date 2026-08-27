"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, processing, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    setErrorMsg("");
    setStatus("idle");
    const name = uploadedFile.name.toLowerCase();
    if (name.endsWith(".pdf") || name.endsWith(".docx")) {
      setFile(uploadedFile);
    } else {
      setFile(null);
      setStatus("error");
      setErrorMsg("Please upload a valid PDF or Word (.docx) document.");
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setStatus("processing");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/translate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to process translation.");
      }

      // Download the PDF stream
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `translated_${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <main className="container">
      <div className="glass-panel">
        <h1>Document Translator</h1>
        <p className="subtitle">
          Seamlessly translate Kannada or Hindi text from your Word & PDF documents into English. Experience flawless meaning retention and instant downloading.
        </p>

        <div
          className={`upload-zone ${dragActive ? "drag-active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="upload-content">
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p style={{ fontSize: "1.1rem", fontWeight: "500", marginBottom: "0.5rem" }}>
              Drag & Drop your document here
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              or click to browse from your computer
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "8px" }}>
              Supports .pdf and .docx
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style={{ display: "none" }}
            onChange={handleChange}
          />
        </div>

        {file && (
          <div className="file-info">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {file.name}
          </div>
        )}

        <div style={{ marginTop: "2.5rem" }}>
          <button
            className="primary-btn"
            onClick={handleProcess}
            disabled={!file || status === "processing"}
          >
            {status === "processing" ? "Translating & Generating PDF..." : "Convert to English PDF"}
          </button>
        </div>

        {status === "processing" && (
          <div className="status-indicator status-processing">
            <svg className="spinner" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Processing your document... This may take a moment.
          </div>
        )}

        {status === "success" && (
          <div className="status-indicator status-success">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Successfully generated and downloaded your translated PDF!
          </div>
        )}

        {status === "error" && (
          <div className="status-indicator status-error">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

      </div>
    </main>
  );
}
