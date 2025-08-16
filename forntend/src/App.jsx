import React, { useState } from "react"
import Papa from "papaparse"
import "./App.css"

function App() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showActions, setShowActions] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState("")

  const handleFileChange = e => {
    setFile(e.target.files[0])
    setResult(null)
    setShowActions(false)
    setDownloadUrl("")
    setError("")
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file.")
      return
    }
    setLoading(true)
    setError("")
    setResult(null)
    setShowActions(false)
    setDownloadUrl("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("http://127.0.0.1:8000/classify/", {
        method: "POST",
        body: formData
      })
      if (!response.ok) {
        throw new Error("Failed to classify logs. " + (await response.text()))
      }
      // For download, create a blob URL
      const blob = await response.blob()
      setDownloadUrl(window.URL.createObjectURL(blob))
      // Parse CSV for display using PapaParse
      const text = await blob.text()
      const parsed = Papa.parse(text, { header: false })
      const headers = parsed.data[0] || []
      const data = parsed.data.slice(1).filter(row => row.length > 1 || (row.length === 1 && row[0] !== ""))
      setResult({ headers, data })
      setShowActions(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    handleUpload()
  }

  return (
    <div className="container">
      <h1>Log Classification</h1>
      <div className="upload-section">
        <input type="file" accept=".csv" onChange={handleFileChange} disabled={loading} />
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? "Classifying..." : "Classify Logs"}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result-section">
          <h2>Classification Result</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {result.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showActions && (
        <div className="actions-section">
          <p>Are you satisfied with the result?</p>
          <a href={downloadUrl} download="classified_logs.csv" className="download-btn">
            Download Report
          </a>
          <button onClick={handleRegenerate} className="regenerate-btn">
            Regenerate
          </button>
        </div>
      )}
      <footer className="footer-signature">
        Made with <span style={{ color: "#e25555", fontSize: "1.2em" }}>&hearts;</span> by Sahil Tanwar
      </footer>
    </div>
  )
}

export default App
