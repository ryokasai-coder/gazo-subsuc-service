'use client'

import { useState } from 'react'

interface ImportResult {
  records?: { count?: number; error?: string }
  contracts?: { count?: number; error?: string }
}

export default function BillingImport({ billingMonth, onImported }: { billingMonth: string; onImported: () => void }) {
  const [recordsFile, setRecordsFile] = useState<File | null>(null)
  const [contractsFile, setContractsFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const handleImport = async () => {
    if (!recordsFile && !contractsFile) { setError('少なくとも1つのファイルを選択してください'); return }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      if (recordsFile) formData.append('records_file', recordsFile)
      if (contractsFile) formData.append('contracts_file', contractsFile)
      formData.append('billingMonth', billingMonth)

      const res = await fetch('/api/admin/billing/import', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'インポートに失敗しました')
      setResult(data)
      onImported()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-1">請求管理ロボ CSVインポート</h3>
      <p className="text-xs text-gray-400 mb-5">※両ファイルとも Shift-JIS（CP932）形式 ／ どちらか一方のみも可</p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📄 請求明細CSV（毎月の入金・消込状況）
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={e => setRecordsFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {recordsFile && <p className="text-xs text-indigo-600 mt-1">選択: {recordsFile.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📋 請求情報CSV（契約中サービスのマスタ）
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={e => setContractsFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {contractsFile && <p className="text-xs text-indigo-600 mt-1">選択: {contractsFile.name}</p>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm mb-4 space-y-1">
          {result.records && (
            result.records.error
              ? <p className="text-red-700">請求明細CSV：エラー — {result.records.error}</p>
              : <p className="text-green-800">請求明細CSV：<strong>{result.records.count}件</strong> 取込完了</p>
          )}
          {result.contracts && (
            result.contracts.error
              ? <p className="text-red-700">請求情報CSV：エラー — {result.contracts.error}</p>
              : <p className="text-green-800">請求情報CSV：<strong>{result.contracts.count}件</strong> 取込完了</p>
          )}
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || (!recordsFile && !contractsFile)}
        className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? 'インポート中...' : 'インポート実行'}
      </button>
    </div>
  )
}
