import { NextResponse, NextRequest } from "next/server";
import { getDbInstance } from "@/lib/db";
import { Filing, Excerpt, Company } from "@/lib/types";

interface QueryResult extends Excerpt {
  form_file: string;
  reporting_for: Date;
  filed_at: Date;
  filing_period: string;
  filing_type: string;
  url: string;
  created_at: Date;
  company_id: number;
  company_name: string;
  company_ticker: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log("get excerpts..");

    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") || "100";

    console.log("limit", limit);

    const db_query = `
  SELECT
    f.id AS filing_id,
    f.form_file AS form_file,
    f.reporting_for AS reporting_for,
    f.filed_at AS filed_at,
    f.filing_period AS filing_period,
    f.filing_type AS filing_type,
    f.url AS url,
    f.created_at AS created_at,
    c.id AS company_id,
    c.name AS company_name,
    c.ticker AS company_ticker
  FROM  filings f
  JOIN companies c ON f.company_id = c.id
  GROUP BY f.id, c.id
  ORDER BY c.id ASC, f.id ASC
  LIMIT $1;
`;

    let db = getDbInstance();
    const result: QueryResult[] = await db.any(db_query, limit);

    // Reshape data
    const groupedData = result.reduce<Record<number, Company>>((acc, row) => {
      const companyId = row.company_id;
      const filingId = row.filing_id;

      if (!acc[companyId]) {
        acc[companyId] = {
          company_id: companyId,
          company_name: row.company_name,
          company_ticker: row.company_ticker.toUpperCase(),
          filings: {},
        };
      }

      // let reportTitle = "Report";
      const upperFilingPeriod = row.filing_period.toUpperCase();
      const reportingYear = new Date(row.reporting_for).getFullYear();
      const upperFilingType = row.filing_type.toUpperCase();

      let reportTitle = `${upperFilingType} (${upperFilingPeriod} ${reportingYear})`;

      if (!acc[companyId].filings[filingId]) {
        acc[companyId].filings[filingId] = {
          filing_id: filingId,
          form_file: row.form_file,
          reporting_for: row.reporting_for,
          filed_at: row.filed_at,
          filing_period: upperFilingPeriod,
          filing_type: upperFilingType,
          url: row.url,
          created_at: row.created_at,
          report_title: reportTitle ? reportTitle : row.form_file,
          excerpts: [],
        };
      }

      if (row.excerpt) {
        acc[companyId].filings[filingId].excerpts.push({
          id: row.id,
          filing_id: row.filing_id,
          title: row.title,
          category: row.category,
          subcategory: row.subcategory,
          insight: row.insight,
          excerpt: row.excerpt,
          tokens: row.tokens,
          tags: row.tags,
        });
      }

      return acc;
    }, {});

    return NextResponse.json(groupedData);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        message: "An error occurred while fetching data",
      },
      { status: 500 }
    );
  }
}
