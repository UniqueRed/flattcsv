"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"; // Importing Shadcn accordion
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash,
  Loader2,
  RotateCw,
  Wand,
} from "lucide-react";
import { motion } from "framer-motion";

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [processedCSV, setProcessedCSV] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resetFields = () => {
    setFile(null);
    setColumnNames([]);
    setProcessedCSV("");
    setError(null);
    setSuccessMessage(null);
    setIsDragging(false);
    setIsLoading(false);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(file);
    setProcessedCSV("");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const detectJSONColumns = () => {
    if (!file) {
      setError("Please upload a file before using auto-detection.");
      return;
    }

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (result) => {
        try {
          const firstRow = result.data[0] as Record<string, string>;
          const detectedColumns = Object.keys(firstRow).filter((key) => {
            try {
              JSON.parse(firstRow[key]);
              return true;
            } catch {
              return false;
            }
          });

          if (detectedColumns.length === 0) {
            setError("No JSON columns were detected in the file.");
          } else {
            setColumnNames(detectedColumns);
            setSuccessMessage("JSON columns auto-detected successfully!");
          }
        } catch {
          setError("Failed to detect JSON columns. Please check your file.");
        } finally {
          setIsLoading(false);
        }
      },
      error: () => {
        setError("An error occurred while auto-detecting JSON columns.");
        setIsLoading(false);
      },
    });
  };

  const handleAddColumn = () => {
    setColumnNames([...columnNames, ""]);
  };

  const handleRemoveColumn = (index: number) => {
    const updatedColumnNames = columnNames.filter((_, i) => i !== index);
    setColumnNames(updatedColumnNames);
  };

  const handleColumnNameChange = (index: number, value: string) => {
    const updatedColumnNames = [...columnNames];
    updatedColumnNames[index] = value;
    setColumnNames(updatedColumnNames);
  };

  const processCSV = () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!file) {
      setError("Please upload a CSV file before processing.");
      setIsLoading(false);
      return;
    }

    if (columnNames.some((name) => !name.trim())) {
      setError("Please provide valid names for all JSON columns.");
      setIsLoading(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (result) => {
        try {
          const rows = result.data as Array<Record<string, unknown>>;
          if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("The CSV file is empty or invalid.");
          }

          const updatedRows: Array<Record<string, unknown>> = [];
          const missingColumns: string[] = [];
          const invalidColumns: string[] = [];

          rows.forEach((row: Record<string, unknown>) => {
            const newRow = { ...row };

            columnNames.forEach((col) => {
              if (!(col in row)) {
                if (!missingColumns.includes(col)) missingColumns.push(col);
              } else {
                try {
                  const jsonData = JSON.parse(row[col] as string);
                  Object.keys(jsonData).forEach((key) => {
                    newRow[`${col}_${key}`] = jsonData[key];
                  });
                  delete newRow[col];
                } catch {
                  if (!invalidColumns.includes(col)) invalidColumns.push(col);
                }
              }
            });

            updatedRows.push(newRow);
          });

          if (missingColumns.length > 0) {
            throw new Error(
              `The following columns are missing: ${missingColumns.join(", ")}.`
            );
          }

          if (invalidColumns.length > 0) {
            throw new Error(
              `The following columns do not contain valid JSON: ${invalidColumns.join(
                ", "
              )}.`
            );
          }

          const updatedCSV = Papa.unparse(updatedRows);
          setProcessedCSV(updatedCSV);
          setSuccessMessage("File is ready to download!");
        } catch (err: unknown) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while processing the CSV."
          );
        } finally {
          setIsLoading(false);
        }
      },
      error: () => {
        setError("An error occurred while reading the CSV file.");
        setIsLoading(false);
      },
    });
  };

  const downloadCSV = () => {
    const blob = new Blob([processedCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "processed.csv");
    link.click();
    setSuccessMessage("File downloaded successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6"
      >
        <h1 className="text-4xl text-center font-normal">FlattCSV</h1>
        <Accordion type="single" collapsible>
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-2xl hover:no-underline">
              How to use
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-4 space-y-2">
                <li>Upload a CSV file using the drag-and-drop zone.</li>
                <li>
                  Click <span className="font-medium">&quot;Auto-detect JSON Columns&quot;</span> to identify JSON
                  fields.
                </li>
                <li>Click <span className="font-medium">&quot;Process CSV&quot;</span> to flatten the file.</li>
                <li>Download the processed file when it&apos;s ready!</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex items-center space-x-2 text-red-600 bg-red-100 dark:bg-red-800 dark:text-red-200 p-4 rounded-md"
          >
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-green-600 bg-green-100 dark:bg-green-800 dark:text-green-200 p-4 rounded-md flex items-center space-x-2"
          >
            <CheckCircle className="h-5 w-5" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* Drag and Drop Zone */}
        <div
          className={`border-dashed border-4 rounded-lg p-8 cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-gray-400 bg-gray-100 dark:bg-blue-800"
              : "border-gray-300 bg-gray-100 dark:bg-gray-700"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
        >
          <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
            {file
              ? "Selected File: " + file.name
              : "Drag & drop your CSV file here, or click to select one"}
          </p>
          <input
            type="file"
            id="file-input"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-gray-800 dark:text-gray-200 font-medium">
            Specify JSON Columns
          </h3>
          <div className="space-y-2">
            {columnNames.map((col, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 border-b pb-2"
              >
                <Input
                  value={col}
                  onChange={(e) =>
                    handleColumnNameChange(index, e.target.value)
                  }
                  placeholder={`Column ${index + 1}`}
                />
                <Button size="icon" onClick={() => handleRemoveColumn(index)}>
                  <Trash />
                </Button>
              </div>
            ))}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleAddColumn}
                className="w-full"
              >
                <Plus className="mr-2" />
                Add Column
              </Button>
              <Button
                variant="outline"
                onClick={detectJSONColumns}
                disabled={!file}
                className="w-full"
              >
                <Wand className="mr-2" />
                Auto-detect JSON Columns
              </Button>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            disabled={isLoading}
            onClick={processCSV}
            className="flex items-center w-full"
          >
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Process CSV
          </Button>
          <Button
            variant="outline"
            disabled={!processedCSV}
            onClick={downloadCSV}
            className="w-full"
          >
            Download CSV
          </Button>
          <Button
            variant="outline"
            onClick={resetFields}
            className="flex items-center w-full"
          >
            <RotateCw className="mr-2" />
            Reset
          </Button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-8 text-sm text-center">
          Created by: Adhviklal Thoppe
        </p>
      </motion.div>
    </div>
  );
};

export default Home;
