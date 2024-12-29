"use client";

import { message } from "antd";
import { getDownloadURL, listAll, ref } from "firebase/storage";
import { useEffect, useState } from "react";

import { storage } from "../../../firebase/firebaseConfig";
import Wrapper from "../wealth/_components/wapper";

const TermsPage = () => {
  const [pdfUrls, setPdfUrls] = useState<any>([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const termsRef = ref(storage, "terms"); // Reference to the "terms" folder
      const response = await listAll(termsRef);

      const fileUrls: any = await Promise.all(
        response.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return { name: item.name, url }; // Return file name and URL
        })
      );

      setPdfUrls(fileUrls);
      if (fileUrls.length > 0) {
        setSelectedPdf(fileUrls[0].url);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      message.error("Failed to fetch terms and conditions.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: any) => setNumPages(numPages);

  return (
    <Wrapper>
      <div className="flex items-center justify-center p-3 bg-white mt-3">
        <h1 className="text-2xl font-bold text-center ">Terms & Conditions</h1>
      </div>

      <div className="flex gap-4 mb-6">
        {pdfUrls.length > 1 &&
          pdfUrls.map((file: any, index: any) => (
            <button
              key={index}
              onClick={() => setSelectedPdf(file.url)}
              className={`px-4 py-2 rounded ${
                selectedPdf === file.url
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {file.name}
            </button>
          ))}
      </div>

      <div className="mb-4">
        {selectedPdf ? (
          <iframe
            src={selectedPdf}
            title="Terms and Conditions"
            width="100%"
            height="800px"
            style={{ border: "none" }}
          />
        ) : (
          <h4 className="text-center text-xl">No Terms & Conditions found</h4>
        )}
      </div>
    </Wrapper>
  );
};

export default TermsPage;
