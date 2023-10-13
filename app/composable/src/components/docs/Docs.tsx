import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

type DocumentStatus = "pending" | "processed" | "processing" | null;

type DocumentType = {
  name: string;
  status: DocumentStatus;
};

type EdgarDocType = {
  id: number;
  company_id: number;
  name: string;
  ticker: string;
  form_file: string | null;
  reporting_for: string;
  filed_at: string;
  filing_period: string;
  filing_type: string;
  url: string;
  created_at: string;
  model: string;
  status: DocumentStatus;
  cost: number | null;
};

type CIKResponse = {
  cik_str: string;
  title: string;
  ticker: string;
};

type FilingsItem = {
  filingDate: string;
  reportDate: string;
  filingType: string;
  url: string;
};

type EdgarResponse = {
  cik: CIKResponse;
  filings: FilingsItem[];
};

type EdgarDocument = {
  cik: CIKResponse;
  filing: FilingsItem;
  force?: boolean;
};

export default function Docs() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [edgarDocs, setEdgarDocs] = useState<EdgarDocType[]>([]);
  const [keywords, setKeywords] = useState<string>("");
  const [entity, setEntity] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("5y");
  const [shouldPoll, setShouldPoll] = useState<boolean>(true);

  const [currentCIK, setCurrentCIK] = useState<CIKResponse | null>(null);
  const [availableFilings, setAvailableFilings] = useState<FilingsItem[]>([]);

  const [selectedFilings, setSelectedFilings] = useState<FilingsItem[]>([]);
  const [searchedTicker, setSearchedTicker] = useState<string>("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const proxy: string = "api/docs/proxy";

  const handleSearchTicker = async (ticker: string) => {
    setSelectedFilings([]);
    setCurrentCIK(null);
    try {
      const response = await fetch(`/${proxy}/edgar/cik/${ticker}`);
      if (!response.ok) {
        throw new Error(`Failed to search ticker: ${response.statusText}`);
      }
      const data: CIKResponse = await response.json();
      console.log("setCIK", data);

      setCurrentCIK(data);
      await handleFetchFilings(ticker);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error searching for ticker: ${error.message}`);
      } else {
        toast.error(`Error searching for ticker`);
      }
    }
  };

  const handleFetchFilings = async (ticker: string) => {
    try {
      const response = await fetch(`/${proxy}/edgar/filings/${ticker}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch filings: ${response.statusText}`);
      }
      const data: EdgarResponse = await response.json();
      if (data && data.filings) {
        setAvailableFilings(data.filings);
      } else {
        throw new Error("No filings found.");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error fetching filings: ${error.message}`);
      } else {
        toast.error(`Error fetching filings`);
      }
    }
  };

  const handleUploadSelected = async () => {
    // Suppose selectedFilings is an array of FilingsItem that the user has selected'

    console.log("handleUploadSelected", selectedFilings);
    for (let filing of selectedFilings) {
      const docToUpload: EdgarDocument = {
        cik: currentCIK as any,
        filing: filing,
      };
      console.log("docToUpload", docToUpload);
      await fetch(`/${proxy}/edgar/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(docToUpload),
      });
    }
    setAvailableFilings([]);
    timeoutRef.current = setTimeout(updateEdgarDocs, 1000);
  };

  const fetchEdgarDocs = async () => {
    console.log("fetchEdgarDocs polling:", shouldPoll);

    await updateEdgarDocs();

    if (shouldPoll) {
      timeoutRef.current = setTimeout(fetchEdgarDocs, 5000);
    }
  };

  useEffect(() => {
    if (!shouldPoll && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      console.log("Timeout cleared");
    }
    console.log("Polling for Edgar Docs");

    fetchEdgarDocs(); // Just call the function
  }, [shouldPoll]);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchedTicker(e.target.value);
  };

  const handleSelectFiling = (filing: FilingsItem) => {
    setSelectedFilings((prev) => [...prev, filing]);
  };

  const handleDeselectFiling = (filing: FilingsItem) => {
    setSelectedFilings((prev) =>
      prev.filter((f) => f.filingDate !== filing.filingDate)
    );
  };

  const updateEdgarDocs = async () => {
    console.log("updateEdgarDocs");
    try {
      const res = await fetch("/api/docs/edgar", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Network response was not ok");

      const data = await res.json();
      setEdgarDocs(data);

      // Check if any document is 'processing'
      const isProcessing = data.some(
        (doc: EdgarDocType) => doc.status === "processing"
      );

      console.log("isProcessing", isProcessing);

      if (isProcessing) {
        console.log("Documents processing");
        setShouldPoll((prevShouldPoll) => true);
      } else {
        console.log("No documents processing");
        setShouldPoll((prevShouldPoll) => false);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          "There was a problem with the fetch operation:",
          error.message
        );
      } else {
        console.error("There was a problem with the fetch operation", error);
      }
      setShouldPoll(false); // Stop polling on error
    }
  };

  useEffect(() => {
    console.log(`..shouldPoll: ${shouldPoll}`);
  }, [shouldPoll]);

  const handleDeleteFiling = async (id: number) => {
    try {
      const response = await fetch(`/api/docs/edgar`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error(response.statusText);

      toast.success("Filing deleted successfully");
      updateEdgarDocs();
    } catch (error) {
      toast.error(`Error deleting filing: ${error}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen font-sans">
      {/* Ticker Search */}
      <div className="py-4 bg-white shadow-lg rounded-md">
        <div className="flex items-center justify-between p-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Enter ticker..."
              value={searchedTicker}
              onChange={handleTickerChange}
              className="w-full pl-8 pr-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-400 transition-colors"
            />
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
              <span
                className="iconify text-gray-400"
                data-icon="ic:baseline-search"
                data-inline="false"
              ></span>
            </span>
          </div>
          <button
            onClick={() => handleSearchTicker(searchedTicker)}
            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Display Available Filings for Selection */}
      {availableFilings.length > 0 && (
        <div className="my-6 bg-white shadow-lg rounded-md p-6">
          <h3 className="text-lg font-semibold mb-4">Available Filings</h3>
          <ul className="divide-y divide-gray-200">
            {availableFilings.map((filing, index) => (
              <li key={index} className="py-3 flex items-center justify-start">
                <label className="flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded space-x-3 w-full">
                  <input
                    type="checkbox"
                    className="form-checkbox text-blue-500 cursor-pointer"
                    checked={selectedFilings.includes(filing)}
                    onChange={() =>
                      selectedFilings.includes(filing)
                        ? handleDeselectFiling(filing)
                        : handleSelectFiling(filing)
                    }
                  />
                  <div className="flex space-x-4">
                    <span className="text-gray-700">{filing.filingType}</span>
                    <span className=" text-gray-500">
                      {new Date(filing.reportDate).toLocaleDateString()}
                    </span>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button
              onClick={handleUploadSelected}
              className="px-5 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:bg-green-700 transition-colors"
            >
              Upload Selected
            </button>
          </div>
        </div>
      )}

      {/* Display Edgar Documents */}
      <div className="mt-6 bg-white shadow-lg rounded-md p-4">
        <h2 className="text-2xl font-bold mb-4 border-b border-gray-200 pb-2">
          Edgar Documents
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full bg-white border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Filing Type
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Document
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Cost
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider">
                  Model
                </th>
                <th className="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs leading-4 font-medium text-gray-600 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {edgarDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="py-2 px-3 border-b border-gray-200">
                    {doc.name}
                    {" ("}
                    {doc.ticker.toUpperCase()}
                    {")"}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    {new Date(doc.reporting_for).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    {doc.filing_type.toUpperCase()}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      View Document
                    </a>
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    {doc.status}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    ${doc.cost}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    {doc.model}
                  </td>
                  <td className="py-2 px-3 border-b border-gray-200">
                    <Icon
                      className="cursor-pointer"
                      icon="icon-park-twotone:delete"
                      color="#c25d55"
                      width="20"
                      height="20"
                      onClick={() => handleDeleteFiling(doc.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
