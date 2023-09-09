import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import baselineAddCircle from "@iconify/icons-ic/baseline-add-circle";
import baselineExpandMore from "@iconify/icons-ic/baseline-expand-more"; // Import down arrow icon
import baselineChevronRight from "@iconify/icons-ic/baseline-chevron-right"; // Right arrow icon
import baselineExpandLess from "@iconify/icons-ic/baseline-expand-less";
import baselineChevronLeft from "@iconify/icons-ic/baseline-chevron-left"; // Left arrow icon
import chevronUp from "@iconify/icons-mdi/chevron-up";
import { DataItem } from "@/lib/types";
import searchIcon from "@iconify/icons-ic/search";
import { toast } from "sonner";
import closeIcon from "@iconify/icons-ic/baseline-close";
import { useCallback } from "react";

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
  // const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(true);
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

  const [hydrated, setHydrated] = useState(false);

  const resetStates = useCallback(() => {
    setExpandedItem(null);
    setExpandedExcerpt(null);
    setCollapsedCompanies({});
    setCollapsedFilings({});
  }, []);

  const fetchData = useCallback(
    async (searchTerm?: string) => {
      try {
        let url = `/api/edgar/filings`;
        if (searchTerm) {
          url += `?search_term=${searchTerm}&limit=20`;
        }

        console.log(`fetching data from ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API request failed with status: ${response.status}`);
        }
        const groupedData: Record<number, Company> = await response.json();
        console.log("groupedData", groupedData);
        resetStates();
        setData(groupedData);
      } catch (err) {
        console.warn("An error occurred in fetchData:", err);
        setData({});
      }
    },
    [setData, resetStates]
  );

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

  const clearSearch = () => {
    setSearchQuery("");
    fetchData();
  };

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      fetchData(searchQuery);
    } else {
      if (searchQuery.length > 0) {
        toast.error("Search query must be at least 3 characters long.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    if (!hydrated) {
      fetchData();
      setHydrated(true);
    }
  }, [fetchData, hydrated]);

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
    <div className="flex flex-col m-1 border rounded p-1 border-red-200">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="opacity-50">Documents</span>

        <Icon
          icon={isExpanded ? baselineExpandLess : baselineExpandMore}
          width={24}
          height={24}
        />
      </div>
      {isExpanded && (
        <>
          <div className="flex flex-row justify-between">
            <div className="relative w-full inline-block mb-2">
              <input
                type="text"
                placeholder="Semantic Search..."
                value={searchQuery}
                onKeyDown={handleKeyDown}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-4 pr-6 border rounded  focus:outline-none focus:ring-1 focus:border-red-200"
              />
              {searchQuery && (
                <div
                  onClick={() => clearSearch()}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 cursor-pointer rounded-full bg-red-100 w-5 h-5 flex items-center justify-center"
                >
                  <Icon icon={closeIcon} width={12} height={12} />
                </div>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="p-1 border rounded ml-1 mb-2 flex items-center justify-center"
            >
              <Icon icon={searchIcon} width={16} height={16} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto ">
            {Object.values(data).map((company) => (
              <div
                key={company.company_ticker}
                className="border p-1 rounded border-red-100"
              >
                <div
                  onClick={() => toggleCollapseCompany(company.company_id)}
                  className="cursor-pointer flex justify-between items-center"
                >
                  <span>
                    <span className="italic">
                      {company.company_name} ({company.company_ticker})
                    </span>
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
                      <div
                        key={filing.filing_id}
                        className="border p-1 rounded"
                      >
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
                                          {item.category} - {item.subcategory}{" "}
                                          {item.embedding_distance}
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
                                          <strong>Title:</strong> {item.title}
                                        </div>
                                        {/* <div>
                                      <strong>Category:</strong> {item.category}
                                    </div>
                                    <div>
                                      <strong>Subcategory:</strong>{" "}
                                      {item.subcategory}
                                    </div> */}
                                        <div>
                                          <strong>Insight:</strong>{" "}
                                          {item.insight}
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
                                        {item.tags && (
                                          <div>
                                            <strong>Tags:</strong>{" "}
                                            {item.tags.join(", ")}
                                          </div>
                                        )}
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
        </>
      )}
    </div>
  );
};
SearchColumn.displayName = "SearchColumn";
export default SearchColumn;
