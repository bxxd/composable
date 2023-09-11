import React, { useState } from "react";

type DocumentStatus = "pending" | "processed";

type DocumentType = {
  name: string;
  status: DocumentStatus;
};

export default function Docs() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [keywords, setKeywords] = useState<string>("");
  const [entity, setEntity] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("5y");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs = files.map((file) => ({
      name: file.name,
      status: "pending" as DocumentStatus,
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
  };

  return (
    <div className="p-6">
      <div className="py-6">
        <form className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Keywords to search for in filing documents"
            className="px-4 py-2 border rounded-lg"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <input
            type="text"
            placeholder="Company name, ticker, CIK number or individual's name"
            className="px-4 py-2 border rounded-lg"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded-lg"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All (since 2001)</option>
            <option value="10y">Last 10 years</option>
            <option value="5y">Last 5 years</option>
            <option value="1y">Last year</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </form>
      </div>

      <div className="mt-6">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="mb-2"
        />
        <ul className="space-y-2">
          {documents.map((doc, index) => (
            <li key={index} className="border-b">
              <p className="py-2">
                {doc.name} - {doc.status}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// https://www.sec.gov/Archives/edgar/data/1679268/000167926823000049/tusk-20230630.htm
// https://www.sec.gov/Archives/edgar/data/1679268/000167926823000049/tusk-20230630.htm
// https://data.sec.gov/submissions/CIK0001679268.json
