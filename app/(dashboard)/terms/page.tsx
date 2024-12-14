"use client";

import { getDownloadURL, getStorage, listAll, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Document, Page } from "react-pdf"; // Ensure react-pdf is installed
import "react-pdf/dist/esm/Page/AnnotationLayer.css"; // Optional styling
import "react-pdf/dist/esm/Page/TextLayer.css"; // Optional styling

const TermsPage = () => {
  const [pdfUrls, setPdfUrls] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);

  useEffect(() => {
    const fetchPdfs = async () => {
      const storage = getStorage();
      const termsFolderRef = ref(storage, "terms"); // Adjust 'terms' to your Firebase folder name

      try {
        const list = await listAll(termsFolderRef);
        const urls: any = await Promise.all(
          list.items.map((itemRef) => getDownloadURL(itemRef))
        );
        setPdfUrls(urls);
        if (urls.length > 0) {
          setSelectedPdf(urls[0]); // Automatically select the first PDF
        }
      } catch (error) {
        console.error("Error fetching PDF files:", error);
      }
    };

    fetchPdfs();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: any) => setNumPages(numPages);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-center mb-4">
        Terms & Conditions
      </h1>

      <div className="flex gap-4 mb-6">
        {pdfUrls.length > 1 &&
          pdfUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setSelectedPdf(url)}
              className={`px-4 py-2 rounded ${
                selectedPdf === url ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              View PDF {index + 1}
            </button>
          ))}
      </div>

      {selectedPdf ? (
        <div className="flex justify-center items-center">
          <Document
            file={selectedPdf}
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-md"
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page key={`page_${index + 1}`} pageNumber={index + 1} />
            ))}
          </Document>
        </div>
      ) : (
        <h4 className="text-center text-xl">No Terms & Conditions found</h4>
      )}
    </div>
  );
};

export default TermsPage;
