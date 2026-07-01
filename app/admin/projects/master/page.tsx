'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface User {
  id: string
  email: string
  company_name: string
  contact_name: string
  role: string
  created_at: string
}

interface ProjectMaster {
  user_id: string
  brand_name: string | null
  brand_colors: string | null
  font_style: string | null
  tone: string | null
  notes: string | null
}

interface EditForm {
  brand_name: string
  brand_colors: string
  font_style: string
  tone: string
  notes: string
}

const emptyForm: EditForm = {
  brand_name: '',
  brand_colors: '',
  font_style: '',
  tone: '',
  notes: '',
}

const FONT_STYLES = ['明朝系', 'ゴシック系', '手書き風', 'ポップ', 'モダン', 'お任せ']
const TONE_OPTIONS = ['高級感', 'シンプル', 'カジュアル', 'ポップ', 'ナチュラル', 'プロフェッショナル', 'お任せ']

export default function ProjectMasterPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [masters, setMasters] = useState<ProjectMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [form, setForm] = useState<EditForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tableNotFound, setTableNotFound] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const { data: ud } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (ud?.role !== 'admin') { router.push('/admin/login'); return }
      await fetchData()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    const [usersRes, mastersRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/project-masters'),
    ])
    if (usersRes.ok) {
      const data = await usersRes.json()
      setUsers((data as User[]).filter((u: User) => u.role !== 'admin'))
    }
    if (mastersRes.ok) {
      const data = await mastersRes.json()
      if (Array.isArray(data)) {
        setMasters(data as ProjectMaster[])
      } else if (data?.error?.includes('project_masters')) {
        setTableNotFound(true)
      }
    }
    setLoading(false)
  }

  const getMaster = (userId: string): ProjectMaster | undefined =>
    masters.find(m => m.user_id === userId)

  const startEdit = (user: User) => {
    const master = getMaster(user.id)
    setForm({
      brand_name: master?.brand_name ?? '',
      brand_colors: master?.brand_colors ?? '',
      font_style: master?.font_style ?? '',
      tone: master?.tone ?? '',
      notes: master?.notes ?? '',
    })
    setEditingUserId(user.id)
    setError('')
  }

  const handleSave = async () => {
    if (!editingUserId) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/project-masters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: editingUserId, ...form }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? '保存に失敗しました')
    } else {
      setMasters(prev => {
        const existing = prev.find(m => m.user_id === editingUserId)
        if (existing) {
          return prev.map(m => m.user_id === editingUserId ? { ...m, ...form } : m)
        }
        return [...prev, { user_id: editingUserId, ...form } as ProjectMaster]
      })
      setEditingUserId(null)
    }
    setSaving(false)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('このブランド設定を削除しますか？')) return
    await fetch(`/api/admin/project-masters?user_id=${userId}`, { method: 'DELETE' })
    setMasters(prev => prev.filter(m => m.user_id !== userId))
  }

  const inputClass = "w-full border border-[#EFEFEF] rounded-xl px-3 py-2 text-sm text-[#111111] placeholder-[#ABABAB] focus:outline-none focus:ring-2 focus:ring-[#F5308A]/20 focus:border-[#F5308A] transition-all bg-[#FAFAFA]"

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      <header className="bg-white border-b border-[#EFEFEF] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[60px] flex items-center gap-4">
          <Link href="/admin/projects" className="w-8 h-8 rounded-full flex items-center justify-center text-[#767676] hover:bg-[#F7F7F9] transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="font-bold text-[#111111]">案件マスタ</h1>
          <p className="text-xs text-[#767676] hidden sm:block">各お客様のブランド設定を管理します</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {tableNotFound && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-sm text-amber-800">
            <p className="font-bold mb-1">project_masters テーブルが存在しません</p>
            <p>Supabase で以下のSQLを実行してテーブルを作成してください：</p>
            <pre className="mt-2 bg-amber-100 rounded-xl p-3 text-xs overflow-x-auto">{`CREATE TABLE project_masters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  brand_name text,
  brand_colors text,
  font_style text,
  tone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);`}</pre>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#F5308A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => {
              const master = getMaster(user.id)
              const isEditing = editingUserId === user.id

              return (
                <div key={user.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                  {/* ヘッダー */}
                  <div className="bg-gradient-to-br from-[#F5308A] to-[#D81B79] px-5 py-4 text-white">
                    <p className="font-bold text-sm leading-tight">{user.company_name || user.email}</p>
                    {user.contact_name && (
                      <p className="text-xs text-white/80 mt-0.5">{user.contact_name}</p>
                    )}
                    <p className="text-[10px] text-white/60 mt-1">{user.email}</p>
                  </div>

                  {/* 本文 */}
                  <div className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        {error && (
                          <p className="text-xs text-[#F5308A] bg-[#FFF0F7] rounded-lg px-3 py-2">{error}</p>
                        )}
                        <div>
                          <label className="block text-[10px] font-bold text-[#767676] mb-1">ブランド名</label>
                          <input
                            type="text"
                            value={form.brand_name}
                            onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                            placeholder="例: 〇〇カフェ"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#767676] mb-1">ブランドカラー</label>
                          <input
                            type="text"
                            value={form.brand_colors}
                            onChange={e => setForm(f => ({ ...f, brand_colors: e.target.value }))}
                            placeholder="例: #FF6B6B, #4ECDC4"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#767676] mb-1">フォントスタイル</label>
                          <div className="flex flex-wrap gap-1.5">
                            {FONT_STYLES.map(f => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, font_style: f }))}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                  form.font_style === f
                                    ? 'bg-[#F5308A] text-white border-[#F5308A]'
                                    : 'bg-white text-[#767676] border-[#EFEFEF] hover:border-[#F5308A]'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#767676] mb-1">トーン</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TONE_OPTIONS.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, tone: t }))}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                  form.tone === t
                                    ? 'bg-[#F5308A] text-white border-[#F5308A]'
                                    : 'bg-white text-[#767676] border-[#EFEFEF] hover:border-[#F5308A]'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#767676] mb-1">メモ・特記事項</label>
                          <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            rows={2}
                            placeholder="NG色、こだわりポイントなど"
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="flex-1 border border-[#EFEFEF] text-[#767676] text-xs font-semibold py-2 rounded-full hover:bg-[#F7F7F9] transition-all"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 bg-[#F5308A] text-white text-xs font-bold py-2 rounded-full hover:bg-[#D81B79] transition-all disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {master ? (
                          <div className="space-y-2 text-xs mb-4">
                            {master.brand_name && (
                              <div className="flex gap-2">
                                <span className="text-[#767676] font-semibold w-20 flex-shrink-0">ブランド名</span>
                                <span className="text-[#111111]">{master.brand_name}</span>
                              </div>
                            )}
                            {master.brand_colors && (
                              <div className="flex gap-2 items-center">
                                <span className="text-[#767676] font-semibold w-20 flex-shrink-0">カラー</span>
                                <span className="text-[#111111] break-all">{master.brand_colors}</span>
                              </div>
                            )}
                            {master.font_style && (
                              <div className="flex gap-2">
                                <span className="text-[#767676] font-semibold w-20 flex-shrink-0">フォント</span>
                                <span className="bg-[#F7F7F9] text-[#111111] px-2 py-0.5 rounded-full">{master.font_style}</span>
                              </div>
                            )}
                            {master.tone && (
                              <div className="flex gap-2">
                                <span className="text-[#767676] font-semibold w-20 flex-shrink-0">トーン</span>
                                <span className="bg-[#F7F7F9] text-[#111111] px-2 py-0.5 rounded-full">{master.tone}</span>
                              </div>
                            )}
                            {master.notes && (
                              <div className="flex gap-2">
                                <span className="text-[#767676] font-semibold w-20 flex-shrink-0">メモ</span>
                                <span className="text-[#767676]">{master.notes}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[#ABABAB] mb-4">ブランド設定が未登録です</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(user)}
                            className="flex-1 bg-[#F5308A] text-white text-xs font-bold py-2 rounded-full hover:bg-[#D81B79] transition-all"
                          >
                            {master ? '編集' : '登録する'}
                          </button>
                          {master && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user.id)}
                              className="border border-[#EFEFEF] text-[#767676] text-xs font-semibold px-3 py-2 rounded-full hover:bg-[#F7F7F9] transition-all"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {users.length === 0 && (
              <div className="col-span-3 text-center py-12 text-[#ABABAB]">
                ユーザーが存在しません
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
