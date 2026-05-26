import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { parseCSV } from '../utils/dataProcessor'

export default function Upload({ onData }) {
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const handleFile = async file => {
    if (!file) return
    setErr('')
    setFileName(file.name)
    setBusy(true)
    try {
      const data = await parseCSV(file)
      if (!data.orders.length) throw new Error('No orders found in the CSV')
      onData(data)
    } catch (e) {
      setErr(e.message || 'Failed to parse CSV')
    } finally {
      setBusy(false)
    }
  }

  const onDrop = e => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600 text-white items-center justify-center mb-4 shadow-lg">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Order Insights Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Upload an Ecwid-format orders CSV to instantly see KPIs across SKUs, products, financials & customers.
          </p>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`bg-white rounded-2xl border-2 border-dashed p-8 md:p-12 text-center cursor-pointer transition shadow-sm
            ${drag ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />

          {busy ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-700 font-medium">Parsing {fileName}…</p>
              <p className="text-xs text-gray-500">Computing KPIs across all orders</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <UploadIcon className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-gray-800 font-semibold">Drop your CSV here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-1">Ecwid order export format · processed locally in your browser</p>
              </div>
              <button className="btn-primary mt-2" type="button">Choose CSV file</button>
            </div>
          )}
        </div>

        {err && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Could not parse the file</p>
              <p>{err}</p>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {['SKUs', 'Products', 'Financials', 'Customers'].map(t => (
            <div key={t} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">{t}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
