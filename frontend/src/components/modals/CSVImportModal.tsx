import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setSuccessMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      await onImport(selectedFile);
      setSuccessMessage(`File '${selectedFile.name}' imported successfully!`);
      setSelectedFile(null);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Leads from CSV"
      subtitle="Bulk upload buyer records with Name, Phone, Email, Location & Budget"
      maxWidth="md"
    >
      <div className="space-y-4">
        {successMessage ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <p className="font-semibold text-emerald-300 text-sm">{successMessage}</p>
          </div>
        ) : (
          <>
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl p-8 text-center bg-slate-900/40 transition">
              <UploadCloud className="h-12 w-12 text-blue-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Drag and drop your CSV file here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Expected columns: Name, Phone, Email, Source, Location, Budget Min, Budget Max</p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input">
                <Button size="sm" variant="outline" className="mt-4" icon={<FileSpreadsheet className="h-4 w-4" />}>
                  Select CSV File
                </Button>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button disabled={!selectedFile} isLoading={isUploading} onClick={handleUpload}>
                Upload & Import Leads
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
