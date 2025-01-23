"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle, Plus, Trash, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [processedCSV, setProcessedCSV] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
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
          const rows = result.data;
          if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("The CSV file is empty or invalid.");
          }

          const updatedRows: any[] = [];
          const missingColumns: string[] = [];
          const invalidColumns: string[] = [];

          rows.forEach((row: any) => {
            const newRow = { ...row };

            columnNames.forEach((col) => {
              if (!(col in row)) {
                if (!missingColumns.includes(col)) missingColumns.push(col);
              } else {
                try {
                  const jsonData = JSON.parse(row[col]);
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
          setSuccessMessage(
            "File is ready to download!"
          );
        } catch (err: any) {
          setError(
            err.message || "An error occurred while processing the CSV."
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
    <div className="min-h-screen bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-200">
            CSV JSON Flattener
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload your CSV, specify JSON columns, and get a flattened CSV file.
          </p>
        </div>

        {error && (
          <AnimatePresence>
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
          </AnimatePresence>
        )}

        {processedCSV && !error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex items-center space-x-2 text-green-600 bg-green-100 dark:bg-green-800 dark:text-green-200 p-4 rounded-md"
            >
              <CheckCircle className="h-5 w-5" />
              <span>{successMessage}</span>
            </motion.div>
          </AnimatePresence>
        )}

        <div
          className={`border-dashed border-4 rounded-lg p-8 cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-800"
              : "border-gray-300 bg-gray-100 dark:bg-gray-700"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-center text-gray-600 dark:text-gray-300 font-medium">
            {file
              ? "Selected File: " + file.name
              : "Drag & drop your CSV file here, or click to select a file."}
          </p>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              JSON Columns
            </span>
            <Button
              onClick={handleAddColumn}
              className="bg-blue-500 text-white hover:bg-blue-600 rounded-md py-1 px-3 flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add Column</span>
            </Button>
          </div>

          <AnimatePresence>
            {columnNames.map((name, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex items-center space-x-4"
              >
                <Input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    handleColumnNameChange(index, e.target.value)
                  }
                  placeholder={`Column ${index + 1} Name`}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full hover:shadow-sm focus:ring-blue-500"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleRemoveColumn(index)}
                  className="bg-red-500 text-white hover:bg-red-600 rounded-md py-1 px-3 flex items-center space-x-1"
                >
                  <Trash className="h-4 w-4" />
                  <span>Remove</span>
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <Button
            onClick={processCSV}
            disabled={isLoading} // Disable button while loading
            className={`w-full bg-blue-500 text-white hover:bg-blue-600 rounded-md py-2 transition ${
              isLoading && "opacity-50 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Processing...</span>
              </div>
            ) : (
              "Process CSV"
            )}
          </Button>
          {processedCSV && (
            <>
              <Button
                variant="secondary"
                onClick={downloadCSV}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md py-2 transition"
              >
                Download Processed CSV
              </Button>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by <span className="font-semibold">Adhviklal Thoppe</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
