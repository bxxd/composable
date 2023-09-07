import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import baselineAddCircle from "@iconify/icons-ic/baseline-add-circle";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineChevronRight from "@iconify/icons-ic/baseline-chevron-right"; // Right arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon
import chevronUp from "@iconify/icons-mdi/chevron-up";
import { DataItem } from "@/lib/types";

import { Company, Excerpt, Filing } from "@/lib/types";

interface SearchColumnProps {
  handleAddData: (content: Excerpt | DataItem) => void;
}

const toDataItem = (excerpt: Excerpt): DataItem => {
  return {
    ...excerpt,
    // Add or change properties if required.
  };
};

const SearchColumn: React.FC<SearchColumnProps> = ({ handleAddData }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [data, setData] = useState<Record<number, Company>>({});
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [expandedExcerpt, setExpandedExcerpt] = useState<number | null>(null);
  const [collapsedCompanies, setCollapsedCompanies] = useState<{
    [key: number]: boolean;
  }>({});
  const [collapsedFilings, setCollapsedFilings] = useState<{
    [key: number]: boolean;
  }>({});
  const [excerptLoading, setExcerptLoading] = useState<{
    [key: number]: boolean;
  }>({});

  const fetchData = async () => {
    try {
      const response = await fetch("/api/edgar/filings");

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      const groupedData: Record<number, Company> = await response.json();
      console.log("groupedData", groupedData);
      setData(groupedData);
    } catch (err) {
      console.warn("An error occurred in fetchData:", err);
      setData({});
    }
  };

  const fetchExcerpts = async (filing_id: number) => {
    setExcerptLoading((prev) => ({ ...prev, [filing_id]: true }));
    try {
      let url = `/api/edgar/filings/excerpts?filing_id=` + filing_id;
      console.log("fetching excerpts for filing_id", filing_id);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      const newExcerpts = await response.json();

      console.log(newExcerpts);

      setData((prevData) => {
        const updatedData = { ...prevData };

        for (const company of Object.values(updatedData)) {
          for (const filing of Object.values(company.filings)) {
            if (filing.filing_id === filing_id) {
              filing.excerpts = newExcerpts;
            }
          }
        }

        return updatedData;
      });
    } catch (err) {
      console.warn("An error occurred in fetchData:", err);
    }
    setExcerptLoading((prev) => ({ ...prev, [filing_id]: false }));
  };

  useEffect(() => {
    fetchData();
    console.log("here!");
  }, []);

  if (collapsed) {
    return (
      <div className="flex flex-col m-1 ">
        <button
          onClick={() => setCollapsed(false)}
          className="mb-2 p-2 border rounded"
        >
          Expand Search
        </button>
      </div>
    );
  }

  const toggleCollapseCompany = (companyId: number) => {
    setCollapsedCompanies({
      ...collapsedCompanies,
      [companyId]: !collapsedCompanies[companyId],
    });
  };

  const toggleCollapseFiling = (filingId: number, excerptsLength: number) => {
    if (excerptsLength === 0 && !excerptLoading[filingId]) {
      fetchExcerpts(filingId);
    } else if (excerptsLength > 0) {
      setCollapsedFilings({
        ...collapsedFilings,
        [filingId]: !collapsedFilings[filingId],
      });
    }
  };

  return (
    <div className="flex flex-col m-1 border rounded p-1">
      <span className="ml-2 mt-1 opacity-50">Documents</span>

      <div className="flex flex-row justify-between">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-2 p-2 border rounded pl-8 w-full" // Added padding-left to avoid overlap
        />
        <button
          onClick={() => setCollapsed(true)}
          className="p-2 border rounded ml-2 mb-2"
        >
          <Icon icon={chevronUp} width={24} height={24} />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto ">
        {Object.values(data).map((company) => (
          <div key={company.company_ticker} className="border p-1 rounded">
            <div
              onClick={() => toggleCollapseCompany(company.company_id)}
              className="cursor-pointer flex justify-between items-center"
            >
              <span>
                <strong>{company.company_name}</strong> (
                {company.company_ticker})
              </span>
              <Icon
                icon={
                  collapsedCompanies[company.company_id]
                    ? baselineExpandMore
                    : baselineExpandLess
                }
                width={24}
                height={24}
              />
            </div>
            {!collapsedCompanies[company.company_id] && (
              <>
                {Object.values(company.filings).map((filing) => (
                  <div key={filing.filing_id} className="border p-1 rounded">
                    <div
                      onClick={() =>
                        toggleCollapseFiling(
                          filing.filing_id,
                          filing.excerpts.length
                        )
                      }
                      className="cursor-pointer flex justify-between items-center"
                    >
                      <span>{filing.report_title}</span>
                      <Icon
                        icon={
                          collapsedFilings[filing.filing_id] ||
                          (filing.excerpts.length === 0 &&
                            !excerptLoading[filing.filing_id])
                            ? baselineExpandMore
                            : baselineExpandLess
                        }
                        width={24}
                        height={24}
                      />
                    </div>
                    {!collapsedFilings[filing.filing_id] && (
                      <>
                        {excerptLoading[filing.filing_id] ? (
                          <div className="opacity-50">Loading...</div>
                        ) : (
                          <>
                            {filing.excerpts.map((item) => (
                              <div
                                key={item.id}
                                className="p-1 flex flex-col relative group hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 border border-dashed rounded-lg mb-1"
                              >
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    className="mr-2 opacity-10 group-hover:opacity-100 cursor-pointer"
                                    onClick={() =>
                                      handleAddData(toDataItem(item))
                                    }
                                    title="Add data to context"
                                  >
                                    <Icon
                                      icon={baselineAddCircle}
                                      width={24}
                                      height={24}
                                    />
                                  </button>
                                  <div
                                    className="flex-grow flex items-center cursor-pointer"
                                    onClick={() =>
                                      setExpandedItem(
                                        expandedItem === item.id
                                          ? null
                                          : item.id
                                      )
                                    }
                                  >
                                    <span className="flex-grow">
                                      {item.title}
                                    </span>
                                    <span className="ml-2">
                                      <Icon
                                        icon={
                                          expandedItem === item.id
                                            ? baselineExpandLess
                                            : baselineExpandMore
                                        }
                                        width={24}
                                        height={24}
                                      />
                                    </span>
                                  </div>
                                </div>
                                {expandedItem === item.id && (
                                  <div className="ml-4 mt-2 border-t border-gray-300">
                                    <div>
                                      <strong>Category:</strong> {item.category}
                                    </div>
                                    <div>
                                      <strong>Subcategory:</strong>{" "}
                                      {item.subcategory}
                                    </div>
                                    <div>
                                      <strong>Insight:</strong> {item.insight}
                                    </div>
                                    <div>
                                      <strong>Length:</strong> {item.tokens}
                                    </div>
                                    <div>
                                      <strong>Raw:</strong>
                                      <span
                                        className="ml-2 cursor-pointer"
                                        onClick={() =>
                                          setExpandedExcerpt(
                                            expandedExcerpt === item.id
                                              ? null
                                              : item.id
                                          )
                                        }
                                      >
                                        <Icon
                                          icon={
                                            expandedExcerpt === item.id
                                              ? baselineChevronLeft
                                              : baselineChevronRight
                                          }
                                          width={24}
                                          height={24}
                                        />
                                      </span>
                                      {expandedExcerpt === item.id
                                        ? item.excerpt
                                        : item.excerpt.substring(0, 25) +
                                          "..."}{" "}
                                      {/* Adjust the length as needed */}
                                    </div>
                                    <div>
                                      <strong>Tags:</strong>{" "}
                                      {item.tags.join(", ")}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
SearchColumn.displayName = "SearchColumn";
export default SearchColumn;
