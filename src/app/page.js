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
    if (name.endsWith(".pdf") || name.endsWith(".docx") || name.match(/\.(jpg|jpeg|png)$/)) {
      setFile(uploadedFile);
    } else {
      setFile(null);
      setStatus("error");
      setErrorMsg("Please upload a valid PDF, Word document, or Image (JPG/PNG).");
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        const textData = await response.text();
        let errorMessage = "Failed to process translation.";
        try {
          const errData = JSON.parse(textData);
          errorMessage = errData.error || errData.message || textData;
        } catch {
          errorMessage = textData;
        }
        throw new Error(errorMessage);
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
    <>
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      <main className="app-container">
        <div className="glass-panel">

          <header className="header">
            <h1>Document Translator</h1>
            <p>Seamlessly translate Kannada or Hindi text from your Word, PDF, or Image documents into English. Experience flawless meaning retention and instant outputs.</p>
          </header>

          <div
            className={`dropzone ${dragActive ? "active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="dropzone-content">
              <div className="icon-wrapper">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <h3>Drag & Drop your document here</h3>
              <p>Supports .pdf, .docx, .jpg, .png</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              style={{ display: "none" }}
              onChange={handleChange}
            />
          </div>

          {file && (
            <div className="file-view">
              <div className="file-name">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {file.name}
              </div>
              <button className="remove-btn" onClick={removeFile} aria-label="Remove file">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="action-area">
            {status === "error" && (
              <div className="status error">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {status === "success" && (
              <div className="status success">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Perfectly translated! Your PDF is downloading.</span>
              </div>
            )}

            {status === "processing" ? (
              <div className="status processing">
                <svg className="spinner" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span>Engine analyzing and securely translating text...</span>
              </div>
            ) : (
              <button
                className="btn-process"
                onClick={handleProcess}
                disabled={!file}
              >
                Translate & Generate Output
              </button>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
