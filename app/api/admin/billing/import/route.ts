import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import iconv from 'iconv-lite'
import { parse } from 'csv-parse/sync'

async function checkAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = createServiceClient()
  const { data } = await service.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? service : null
}

function parseDate(val: string): string | null {
  if (!val) return null
  const cleaned = val.replace(/\//g, '-')
  return cleaned || null
}

function parseNum(val: string): number {
  return parseFloat((val ?? '').replace(/[^\d.-]/g, '')) || 0
}

function parseInt2(val: string): number {
  return parseInt((val ?? '').replace(/[^\d-]/g, ''), 10) || 0
}

export async function POST(req: NextRequest) {
  const service = await checkAdmin()
  if (!service) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const recordsFile = formData.get('records_file') as File | null
  const contractsFile = formData.get('contracts_file') as File | null

  if (!recordsFile && !contractsFile) {
    return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
  }

  // billing_code → user_id マップ
  const { data: users } = await service
    .from('users')
    .select('id, billing_code')
    .not('billing_code', 'is', null)
  const userMap = new Map((users ?? []).map((u: { id: string; billing_code: string }) => [u.billing_code, u.id]))

  const results: Record<string, { count?: number; new?: number; updated?: number; error?: string }> = {}

  // ── 請求明細CSV のインポート ──
  if (recordsFile) {
    try {
      const buffer = Buffer.from(await recordsFile.arrayBuffer())
      const csvText = iconv.decode(buffer, 'Shift_JIS')
      const parsed = parse(csvText, {
        columns: [
          'billing_name', 'billing_code', 'invoice_number',
          'product_code', 'product_name', 'period_start', 'period_end',
          'unit_price', 'quantity', 'subtotal',
          '_tax_type', '_tax_rate', 'tax_excluded', 'tax_amount', '_withholding',
          'billing_amount', 'payment_due', 'payment_date', 'clearing_status',
          'deposit_date', 'notes',
          '_d1', '_d2', '_d3', '_d4', '_d5', '_d6', '_d7',
          'sales_date',
        ],
        from_line: 2,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as Record<string, string>[]

      const rows = parsed.map((r) => ({
        billing_name: r.billing_name,
        billing_code: r.billing_code,
        invoice_number: r.invoice_number,
        product_code: r.product_code,
        product_name: r.product_name,
        period_start: parseDate(r.period_start),
        period_end: parseDate(r.period_end),
        unit_price: parseNum(r.unit_price),
        quantity: parseNum(r.quantity),
        subtotal: parseInt2(r.subtotal),
        tax_excluded: parseInt2(r.tax_excluded),
        tax_amount: parseInt2(r.tax_amount),
        billing_amount: parseInt2(r.billing_amount),
        payment_due: parseDate(r.payment_due),
        payment_date: parseDate(r.payment_date),
        clearing_status: r.clearing_status,
        deposit_date: parseDate(r.deposit_date),
        notes: r.notes,
        billing_month: r.period_start
          ? parseDate(r.period_start)?.substring(0, 7) ?? null
          : null,
        sales_date: parseDate(r.sales_date),
        user_id: userMap.get(r.billing_code) ?? null,
      })).filter(r => r.invoice_number)

      const { error } = await service
        .from('billing_records')
        .upsert(rows, { onConflict: 'invoice_number' })

      results.records = error
        ? { error: error.message }
        : { count: rows.length }
    } catch (e: unknown) {
      results.records = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  // ── 請求情報CSV のインポート ──
  if (contractsFile) {
    try {
      const buffer = Buffer.from(await contractsFile.arrayBuffer())
      const csvText = iconv.decode(buffer, 'Shift_JIS')
      const parsed = parse(csvText, {
        columns: [
          'billing_info_number', 'billing_code', 'billing_dept_no',
          'billing_dept_code', 'product_code', 'billing_type',
          'billing_method', 'repeat_cycle', 'repeat_cycle_unit',
          'service_start_date', 'repeat_count', 'period_format',
          'period', 'period_unit', 'base_month',
          'sales_month', 'sales_day', 'invoice_issue_month', 'invoice_issue_day',
          'invoice_send_month', 'invoice_send_day',
          'payment_due_month', 'payment_due_day',
          'payment_info_no', 'payment_info_code', 'invoice_template',
          'staff_code', 'sender_code', 'file_attach',
          'text_pattern', 'slip_expire_month', 'slip_expire_day',
          'remaining_count', 'remaining_amount', 'billing_info_code',
          'aggregate_product_code', 'accounting_product_code',
          'product_name', 'unit_price', 'quantity', 'unit',
          'tax_type', 'tax_rate', 'withholding_tax',
          'notes', 'memo', 'invoice_merge_key',
        ],
        from_line: 2,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as Record<string, string>[]

      const rows = parsed.map((r) => ({
        billing_info_number: r.billing_info_number,
        billing_code: r.billing_code,
        billing_dept_code: r.billing_dept_code,
        product_code: r.product_code,
        billing_type: r.billing_type,
        billing_method: r.billing_method,
        repeat_cycle: parseInt2(r.repeat_cycle) || null,
        service_start_date: parseDate(r.service_start_date),
        repeat_count: r.repeat_count,
        remaining_count: r.remaining_count,
        remaining_amount: r.remaining_amount,
        aggregate_product_code: r.aggregate_product_code,
        product_name: r.product_name,
        unit_price: parseNum(r.unit_price),
        quantity: parseNum(r.quantity),
        tax_rate: parseInt2(r.tax_rate) || 10,
        notes: r.notes,
        memo: r.memo,
        user_id: userMap.get(r.billing_code) ?? null,
      })).filter(r => r.billing_info_number)

      const { error } = await service
        .from('billing_contracts')
        .upsert(rows, { onConflict: 'billing_info_number' })

      results.contracts = error
        ? { error: error.message }
        : { count: rows.length }
    } catch (e: unknown) {
      results.contracts = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  return NextResponse.json(results)
}
