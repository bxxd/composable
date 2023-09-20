import { NextResponse, NextRequest } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";
import { Filing, Company, Excerpt } from "@/lib/types";
import { getEmbedding } from "@/app/api/lib/embedding";

export const dynamic = "force-dynamic";

interface QueryResult extends Filing, Company, Excerpt {}

export async function GET(req: NextRequest) {
  const db = await getDbInstance();
  try {
    const url = new URL(req.url);
    let limit: string | null = url.searchParams.get("limit");
    let numericLimit: number = limit ? Number(limit) : 1000;
    let get_excerpts = url.searchParams.get("get_excerpts") === "true";
    const get_tags = url.searchParams.get("get_tags") === "true";
    let search_term = url.searchParams.get("search_term");

    let embedding: any;

    if (search_term) {
      console.log(`search_term: ${search_term}`);
      if (search_term.length < 3) {
        return NextResponse.json(
          "Search term must be at least 3 characters long",
          { status: 400 }
        );
      }

      get_excerpts = true;

      embedding = await getEmbedding(search_term);
    }

    console.log(`get filings.. limit:${limit} `);

    let excerptLimitClause = "";
    let filingLimitClause = "";

    if (get_excerpts) {
      excerptLimitClause = `LIMIT ${limit}`;
    } else {
      filingLimitClause = `LIMIT ${limit}`;
    }

    let baseQuery = `
    WITH CompanyFilings AS (
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
      FROM filings f
      JOIN companies c ON f.company_id = c.id
      ORDER BY c.id ASC, f.id ASC
      ${filingLimitClause}
    )
  `;

    if (get_excerpts) {
      let selectClause = `
      e.id,
      e.title,
      e.category,
      e.subcategory,
      e.insight,
      e.excerpt,
      e.tokens,
      cf.*
      ${embedding ? `,e.embedding_distance` : ``}
  `;

      let joinClause = `
      FROM excerpts e `;

      if (get_tags) {
        baseQuery += `,
        TagsAggregated AS (
          SELECT
              excerpt_id,
              ARRAY_AGG(tag) AS tags
          FROM tags
          GROUP BY excerpt_id
        )
        `;

        selectClause += `,e.tags`;

        joinClause += `
      LEFT JOIN TagsAggregated ta ON e.id = ta.excerpt_id
`;
      }

      joinClause += `${
        embedding ? `ORDER BY embedding_distance ASC` : `ORDER BY e.id ASC`
      }
      ${excerptLimitClause}
      `;

      baseQuery += `
      , ExcerptsWithTags AS (
        SELECT
            e.id AS id,
            e.filing_id AS filing_id,
            e.title AS title,
            e.category AS category,
            e.subcategory AS subcategory,
            e.insight AS insight,
            e.excerpt AS excerpt,
            e.tokens AS tokens
            ${
              embedding
                ? `,e.embedding <=> '${JSON.stringify(
                    embedding
                  )}' AS base_embedding_distance`
                : ``
            }
            ${
              embedding
                ? `,e.category_embedding <=> '${JSON.stringify(
                    embedding
                  )}' AS category_embedding_distance`
                : ``
            }
            ${
              embedding
                ? `,(
                    (
                      e.embedding <=> '${JSON.stringify(embedding)}'
                    ) + (
                      e.category_embedding <=> '${JSON.stringify(embedding)}'
                    )
                  ) / 2 AS embedding_distance`
                : ``
            }
            ${get_tags ? ",ta.tags AS tags" : ""}
        ${joinClause}
      )
      SELECT
        ${selectClause}
      FROM ExcerptsWithTags e
      JOIN CompanyFilings cf ON e.filing_id = cf.filing_id
      ${embedding ? `ORDER BY e.embedding_distance ASC` : `ORDER BY e.id ASC`}
    `;
    } else {
      baseQuery += `
      SELECT
        cf.*
      FROM CompanyFilings cf
      ORDER BY cf.filing_id ASC;
    `;
    }

    const result: QueryResult[] = await db.any(baseQuery, numericLimit);

    console.log(`result length: ${result.length}`);

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
          company_id: companyId,
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
          embedding_distance: row.embedding_distance,
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
  } finally {
    await releaseDbInstance();
  }
}
