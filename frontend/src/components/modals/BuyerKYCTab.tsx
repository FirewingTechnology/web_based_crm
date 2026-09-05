import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, CheckCircle2, AlertCircle, Clock, Plus, 
  Trash2, Check, X, ExternalLink, FileCheck, Award
} from 'lucide-react';
import { documentsApi } from '../../api/documents';
import { BuyerKYCSummary, BuyerDocument, DocumentType } from '../../types/document';
import { Button } from '../ui/Button';

interface BuyerKYCTabProps {
  leadId: number;
  leadName: string;
}

const DOC_TYPES: { type: DocumentType; label: string; icon: string }[] = [
  { type: 'PAN_CARD', label: 'PAN Card (Mandatory for RERA)', icon: '💳' },
  { type: 'AADHAAR_CARD', label: 'Aadhaar Card (Identity & Address)', icon: '🆔' },
  { type: 'PASSPORT', label: 'Passport (NRI / Foreign Buyer)', icon: '🛂' },
  { type: 'COST_SHEET', label: 'Signed Cost Sheet', icon: '📊' },
  { type: 'PAYMENT_RECEIPT', label: 'Booking Advance / Cheque Receipt', icon: '🧾' },
  { type: 'ALLOTMENT_LETTER', label: 'Builder Allotment Letter', icon: '📑' },
  { type: 'BBA_AGREEMENT', label: 'Builder-Buyer Agreement (BBA)', icon: '📜' },
  { type: 'SALE_DEED', label: 'Registered Sale Deed', icon: '🏛️' },
  { type: 'OTHER', label: 'Other Document', icon: '📁' },
];

export const BuyerKYCTab: React.FC<BuyerKYCTabProps> = ({ leadId, leadName }) => {
  const [kycData, setKycData] = useState<BuyerKYCSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Upload form state
  const [docType, setDocType] = useState<DocumentType>('PAN_CARD');
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKYC = async () => {
    try {
      setIsLoading(true);
      const data = await documentsApi.getLeadKYCSummary(leadId);
      setKycData(data);
    } catch (err) {
      console.error('Failed to load KYC documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, [leadId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !docType) return;
    setIsSubmitting(true);
    try {
      await documentsApi.uploadDocument({
        lead_id: leadId,
        document_type: docType,
        title: title.trim(),
        file_name: fileName.trim() || `${docType.toLowerCase()}_${Date.now()}.pdf`,
        file_url: fileUrl.trim() || `https://vault.realvion.internal/docs/${leadId}/${docType.toLowerCase()}.pdf`,
        document_number: docNumber.trim() || undefined,
        mime_type: 'application/pdf',
      });
      setIsUploadOpen(false);
      setTitle('');
      setDocNumber('');
      setFileName('');
      setFileUrl('');
      await fetchKYC();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (docId: number, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await documentsApi.verifyDocument(docId, {
        verification_status: status,
        rejection_reason: status === 'REJECTED' ? 'Document blur or details do not match' : undefined
      });
      await fetchKYC();
    } catch (err) {
      console.error('Failed to update verification status:', err);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await documentsApi.deleteDocument(docId);
      await fetchKYC();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading Buyer KYC Vault...</span>
      </div>
    );
  }

  const compliance = kycData?.compliance_status || 'PENDING';
  const compliancePct = kycData?.kyc_compliance_pct || 0;

  return (
    <div className="space-y-4">
      {/* KYC Compliance Hero Card */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Buyer KYC & Document Vault
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  compliance === 'FULLY_COMPLIANT' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : compliance === 'PARTIALLY_COMPLIANT'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {compliance.replace('_', ' ')}
                </span>
              </h4>
              <p className="text-xs text-slate-400">RERA & Builder audit compliance tracker</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Document</span>
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium">Compliance Readiness</span>
            <span className="font-bold text-white">{compliancePct}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                compliancePct >= 80 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                  : compliancePct >= 40 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
                  : 'bg-gradient-to-r from-rose-500 to-orange-400'
              }`}
              style={{ width: `${compliancePct}%` }}
            />
          </div>
        </div>

        {/* Quick Check Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            {kycData?.pan_verified ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={kycData?.pan_verified ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              PAN Card Verified
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            {kycData?.aadhaar_verified ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={kycData?.aadhaar_verified ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              Aadhaar Verified
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            {kycData?.payment_proof_present ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            )}
            <span className={kycData?.payment_proof_present ? 'text-slate-200 font-medium' : 'text-slate-500'}>
              Payment Receipt
            </span>
          </div>
        </div>
      </div>

      {/* Upload Document Form Drawer/Collapse */}
      {isUploadOpen && (
        <form onSubmit={handleUpload} className="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileCheck className="h-4 w-4 text-indigo-400" />
              Upload Buyer Document / Legal Proof
            </h5>
            <button 
              type="button" 
              onClick={() => setIsUploadOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document Category</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                {DOC_TYPES.map(d => (
                  <option key={d.type} value={d.type}>{d.icon} {d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document Title</label>
              <input
                type="text"
                placeholder="e.g. Buyer PAN Card - Front"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Document ID / Number (Optional)</label>
              <input
                type="text"
                placeholder="e.g. ABCDE1234F / 12-digit Aadhaar"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">File Name</label>
              <input
                type="text"
                placeholder="pan_card.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Direct URL / Cloud Storage Path</label>
            <input
              type="text"
              placeholder="https://drive.google.com/... or cloud bucket URL"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save into Vault'}
            </Button>
          </div>
        </form>
      )}

      {/* Document Records List */}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Vault Documents ({kycData?.documents.length || 0})</span>
        </h5>

        {(!kycData?.documents || kycData.documents.length === 0) ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 p-4">
            <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No documents uploaded yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload PAN, Aadhaar, or Cheque copy to initiate verification and increase lead health
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {kycData.documents.map((doc) => {
              const isVerified = doc.verification_status === 'VERIFIED';
              const isRejected = doc.verification_status === 'REJECTED';

              return (
                <div 
                  key={doc.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isRejected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          {doc.document_type}
                        </span>
                        {doc.document_number && (
                          <span className="text-[10px] text-indigo-400 font-mono">
                            #{doc.document_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Uploaded by {doc.uploaded_by_name || 'Team'}</span>
                        <span>•</span>
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        {doc.verified_at && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">Verified on {new Date(doc.verified_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Verification Badges / Actions */}
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded-md">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Rejected
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleVerify(doc.id, 'VERIFIED')}
                          title="Verify Document"
                          className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Check className="h-3 w-3" />
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerify(doc.id, 'REJECTED')}
                          title="Reject Document"
                          className="p-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="View Document"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                      title="Delete from Vault"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
