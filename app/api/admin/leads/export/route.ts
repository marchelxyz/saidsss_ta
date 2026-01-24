import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { isAdminSession } from "@/lib/admin";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  if (!isAdminSession(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const filters = parseExportFilters(request.url);
  const pool = getPool();
  const { query, values } = buildExportQuery(filters);
  const result = await pool.query(query, values);

  const rows = result.rows.map((row) => ({
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    company: row.company ?? "",
    role: row.role ?? "",
    summary: row.summary ?? "",
    message: row.message ?? "",
    budget: row.budget ?? "",
    timeline: row.timeline ?? "",
    status: row.status ?? "",
    stage: row.stage ?? "",
    is_lost: row.is_lost ? "да" : "нет",
    loss_reason: row.loss_reason ?? "",
    created_at: row.created_at ? new Date(row.created_at).toISOString() : ""
  }));

  const headers = [
    "name",
    "phone",
    "email",
    "company",
    "role",
    "summary",
    "message",
    "budget",
    "timeline",
    "status",
    "stage",
    "is_lost",
    "loss_reason",
    "created_at"
  ];
  const csv = toCsv(rows, { delimiter: ";", headers, includeBom: true });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads.csv"
    }
  });
}

type ExportFilters = {
  stages: string[];
  lossReasons: string[];
  inWorkOnly: boolean;
  lostOnly: boolean;
};

function parseExportFilters(url: string): ExportFilters {
  const requestUrl = new URL(url);
  const stages = splitListParam(requestUrl.searchParams.get("stages"));
  const lossReasons = splitListParam(requestUrl.searchParams.get("loss_reasons"));
  const inWorkOnly = requestUrl.searchParams.get("in_work") === "true";
  const lostOnly = requestUrl.searchParams.get("lost") === "true";
  return { stages, lossReasons, inWorkOnly, lostOnly };
}

function splitListParam(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildExportQuery(filters: ExportFilters) {
  const conditions: string[] = [];
  const values: Array<string[] | string> = [];
  let idx = 1;

  if (filters.stages.length) {
    conditions.push(`l.stage = any($${idx++})`);
    values.push(filters.stages);
  }
  if (filters.inWorkOnly) {
    conditions.push(`coalesce(l.is_lost, false) = false`);
  }
  if (filters.lostOnly) {
    conditions.push(`coalesce(l.is_lost, false) = true`);
  }
  if (filters.lossReasons.length) {
    conditions.push(`l.loss_reason_id = any($${idx++})`);
    values.push(filters.lossReasons);
    if (!filters.lostOnly) {
      conditions.push(`coalesce(l.is_lost, false) = true`);
    }
  }

  const whereClause = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return {
    query: `
      select l.name, l.phone, l.email, l.company, l.role, l.summary, l.message,
             l.budget, l.timeline, l.status, l.stage, l.is_lost,
             lr.name as loss_reason, l.created_at
      from leads l
      left join lead_loss_reasons lr on lr.id = l.loss_reason_id
      ${whereClause}
      order by l.created_at desc
    `,
    values
  };
}
