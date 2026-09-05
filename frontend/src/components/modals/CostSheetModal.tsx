import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calculator, Building2, MapPin, Tag, ShieldCheck, 
  MessageCircle, CheckCircle2, AlertTriangle, FileText, ArrowRight,
  Sparkles, RefreshCw, Car, Landmark, Coins, Lock
} from 'lucide-react';
import { 
  CostSheetCalculateRequest, 
  CostSheetResponse, 
  QuickBookFromCostSheetRequest 
} from '../../types/costSheet';
import { costSheetApi } from '../../api/costSheet';
import { projectsApi } from '../../api/projects';
import { leadsApi } from '../../api/leads';
import { Project } from '../../types/project';
import { Lead } from '../../types/lead';
import { Button } from '../ui/Button';
import { WhatsAppModal } from './WhatsAppModal';

export const formatINR = (val: number): string => {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  } else if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakhs`;
  } else {
    return `₹${val.toLocaleString('en-IN')}`;
  }
};

interface CostSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeadId?: number;
  initialProjectId?: number;
  onBookingCreated?: () => void;
}

export const CostSheetModal: React.FC<CostSheetModalProps> = ({
  isOpen,
  onClose,
  initialLeadId,
  initialProjectId,
  onBookingCreated,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<number | undefined>(initialLeadId);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);

  // Form Fields
  const [unitNumber, setUnitNumber] = useState('Tower A - 1204');
  const [configuration, setConfiguration] = useState('3 BHK + Servant');
  const [areaSqft, setAreaSqft] = useState<number>(1650);
  const [baseRate, setBaseRate] = useState<number>(7500);
  const [floorNumber, setFloorNumber] = useState<number>(12);
  const [floorRiseRate, setFloorRiseRate] = useState<number>(25);
  const [plcRate, setPlcRate] = useState<number>(150);
  const [parkingSlots, setParkingSlots] = useState<number>(1);
  const [parkingRate, setParkingRate] = useState<number>(400000);
  const [clubhouseCharges, setClubhouseCharges] = useState<number>(350000);
  const [possessionCharges, setPossessionCharges] = useState<number>(150000);
  const [gstRate, setGstRate] = useState<number>(5.0);
  const [stampDutyRate, setStampDutyRate] = useState<number>(7.0);
  const [registrationFee, setRegistrationFee] = useState<number>(30000);
  const [discountAmount, setDiscountAmount] = useState<number>(100000);

  // Result & UI State
  const [costSheet, setCostSheet] = useState<CostSheetResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  // Load projects and leads on mount
  useEffect(() => {
    if (!isOpen) return;

    projectsApi.getProjects().then((projs) => {
      setProjects(projs);
      if (!selectedProjectId && projs.length > 0) {
        setSelectedProjectId(projs[0].id);
      }
    }).catch(console.error);

    leadsApi.getLeads({ limit: 100 }).then((res) => {
      setLeads(res.data);
    }).catch(console.error);
  }, [isOpen]);

  // When project changes, fetch sensible defaults
  useEffect(() => {
    if (!selectedProjectId) return;
    costSheetApi.getProjectDefaults(selectedProjectId).then((defs) => {
      setAreaSqft(defs.super_builtup_area_sqft || 1500);
      setBaseRate(defs.base_rate_per_sqft || 7500);
      setGstRate(defs.gst_rate_pct ?? 5.0);
      setStampDutyRate(defs.stamp_duty_rate_pct || 7.0);
      if (defs.configuration) {
        setConfiguration(defs.configuration);
      }
    }).catch(console.error);
  }, [selectedProjectId]);

  // Recalculate cost sheet whenever parameters change
  const runCalculation = async () => {
    if (!selectedProjectId) return;
    setIsCalculating(true);
    try {
      const payload: CostSheetCalculateRequest = {
        lead_id: selectedLeadId || undefined,
        project_id: selectedProjectId,
        unit_number: unitNumber,
        configuration: configuration,
        super_builtup_area_sqft: areaSqft,
        base_rate_per_sqft: baseRate,
        floor_number: floorNumber,
        floor_rise_rate_per_sqft: floorRiseRate,
        plc_rate_per_sqft: plcRate,
        car_parking_slots: parkingSlots,
        car_parking_rate: parkingRate,
        clubhouse_charges: clubhouseCharges,
        possession_charges: possessionCharges,
        gst_rate_pct: gstRate,
        stamp_duty_rate_pct: stampDutyRate,
        registration_fee: registrationFee,
        discount_amount: discountAmount,
      };
      const res = await costSheetApi.calculateCostSheet(payload);
      setCostSheet(res);
    } catch (err) {
      console.error('Failed to calculate cost sheet:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedProjectId) {
      runCalculation();
    }
  }, [
    isOpen, selectedProjectId, selectedLeadId, unitNumber, configuration,
    areaSqft, baseRate, floorNumber, floorRiseRate, plcRate, parkingSlots,
    parkingRate, clubhouseCharges, possessionCharges, gstRate, stampDutyRate,
    registrationFee, discountAmount
  ]);

  const handleQuickBook = async () => {
    if (!selectedLeadId) {
      alert('Please select a Buyer Lead to lock this unit booking.');
      return;
    }
    if (!selectedProjectId) return;

    setIsBooking(true);
    try {
      const payload: QuickBookFromCostSheetRequest = {
        lead_id: selectedLeadId,
        project_id: selectedProjectId,
        unit_number: unitNumber,
        configuration: configuration,
        super_builtup_area_sqft: areaSqft,
        base_rate_per_sqft: baseRate,
        floor_number: floorNumber,
        floor_rise_rate_per_sqft: floorRiseRate,
        plc_rate_per_sqft: plcRate,
        car_parking_slots: parkingSlots,
        car_parking_rate: parkingRate,
        clubhouse_charges: clubhouseCharges,
        possession_charges: possessionCharges,
        gst_rate_pct: gstRate,
        stamp_duty_rate_pct: stampDutyRate,
        registration_fee: registrationFee,
        discount_amount: discountAmount,
        notes: `Confirmed booking from Cost Sheet Generator for unit ${unitNumber}.`,
      };
      const b = await costSheetApi.quickBookFromCostSheet(payload);
      setBookingSuccessMsg(`Booking ${b.booking_number} locked successfully! Lead marked as Booked.`);
      if (onBookingCreated) {
        onBookingCreated();
      }
      setTimeout(() => {
        onClose();
        setBookingSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to lock booking.');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen) return null;

  const currentLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="glass-modal relative w-full max-w-5xl max-h-[92vh] rounded-2xl p-4 sm:p-6 shadow-2xl z-50 flex flex-col border border-slate-800 text-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Indian Real Estate Cost Sheet Generator</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      RERA Compliant
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live dynamic pricing, floor rise, statutory taxes, and milestone payment schedules
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Toast / Success Banner */}
          {bookingSuccessMsg && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{bookingSuccessMsg}</span>
            </div>
          )}

          {/* Main 2-Column Split */}
          <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1 text-xs">
            {/* Left Column: Form Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-800 lg:pr-5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-400" /> Unit & Pricing Parameters
              </h4>

              {/* Lead & Project Selectors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Buyer Lead</label>
                  <select
                    value={selectedLeadId || ''}
                    onChange={(e) => setSelectedLeadId(e.target.value ? Number(e.target.value) : undefined)}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  >
                    <option value="">-- Direct / Walk-in --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name} (#{l.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Developer Project *</label>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5 font-bold text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit Number & Configuration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Unit Number</label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5 font-semibold text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Configuration</label>
                  <input
                    type="text"
                    value={configuration}
                    onChange={(e) => setConfiguration(e.target.value)}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Super Builtup Area & Base Rate */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold">Super Area (sq.ft)</span>
                  <input
                    type="number"
                    value={areaSqft}
                    onChange={(e) => setAreaSqft(Number(e.target.value))}
                    className="glass-input w-24 text-right px-2 py-1 text-xs font-bold text-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold">Base Rate (₹/sq.ft)</span>
                  <input
                    type="number"
                    value={baseRate}
                    onChange={(e) => setBaseRate(Number(e.target.value))}
                    className="glass-input w-24 text-right px-2 py-1 text-xs font-bold text-emerald-400"
                  />
                </div>
              </div>

              {/* Floor Rise & PLC */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Floor No. (Floor {floorNumber})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={floorNumber}
                    onChange={(e) => setFloorNumber(Number(e.target.value))}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    PLC (₹/sq.ft)
                  </label>
                  <input
                    type="number"
                    value={plcRate}
                    onChange={(e) => setPlcRate(Number(e.target.value))}
                    placeholder="e.g. 150 (Park Facing)"
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Parking & Clubhouse */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Parking Slots</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={parkingSlots}
                    onChange={(e) => setParkingSlots(Number(e.target.value))}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Clubhouse Dev (₹)</label>
                  <input
                    type="number"
                    value={clubhouseCharges}
                    onChange={(e) => setClubhouseCharges(Number(e.target.value))}
                    className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              {/* Statutory Tax Rates */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="h-3 w-3 text-purple-400" /> Government Taxes
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">GST Rate %</label>
                    <select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="glass-input w-full text-xs rounded-lg px-2 py-1"
                    >
                      <option value="5">5% (Under Construction)</option>
                      <option value="0">0% (Ready to Move / OC)</option>
                      <option value="1">1% (Affordable Housing)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Stamp Duty %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={stampDutyRate}
                      onChange={(e) => setStampDutyRate(Number(e.target.value))}
                      className="glass-input w-full text-xs rounded-lg px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Special Incentive Discount */}
              <div>
                <label className="text-[11px] font-semibold text-amber-400 block mb-1">
                  Special Incentive Discount (₹)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  placeholder="e.g. 100000"
                  className="glass-input w-full text-xs rounded-lg px-2.5 py-1.5 text-amber-300 font-semibold"
                />
              </div>
            </div>

            {/* Right Column: Live Quotation Preview & Milestones (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {costSheet ? (
                <>
                  {/* Hero Grand Total Box */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        All-Inclusive Grand Total
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                        {formatINR(costSheet.breakdown.grand_total)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Token Required: <strong className="text-emerald-400 font-bold">{formatINR(costSheet.breakdown.token_booking_amount)}</strong> (10%)
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs font-bold text-slate-200">{costSheet.project_name}</div>
                      <div className="text-[11px] text-slate-400">{costSheet.unit_number}</div>
                      <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                        ₹{costSheet.base_rate_per_sqft}/sq.ft
                      </div>
                    </div>
                  </div>

                  {/* 3 Summary Breakdown Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Agreement Value */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Agreement Value
                      </span>
                      <div className="text-base font-bold text-slate-100">
                        {formatINR(costSheet.breakdown.total_agreement_value)}
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                        <div>BSP: {formatINR(costSheet.breakdown.base_selling_price)}</div>
                        {costSheet.breakdown.floor_rise_charges > 0 && (
                          <div>Floor Rise: +{formatINR(costSheet.breakdown.floor_rise_charges)}</div>
                        )}
                        {costSheet.breakdown.plc_charges > 0 && (
                          <div>PLC: +{formatINR(costSheet.breakdown.plc_charges)}</div>
                        )}
                        {costSheet.breakdown.car_parking_charges > 0 && (
                          <div>Parking: +{formatINR(costSheet.breakdown.car_parking_charges)}</div>
                        )}
                      </div>
                    </div>

                    {/* Additional Charges */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Club & Possession
                      </span>
                      <div className="text-base font-bold text-slate-100">
                        {formatINR(costSheet.breakdown.total_additional_charges)}
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                        <div>Clubhouse: {formatINR(costSheet.breakdown.clubhouse_charges)}</div>
                        <div>Possession/IFMS: {formatINR(costSheet.breakdown.possession_charges)}</div>
                      </div>
                    </div>

                    {/* Statutory Levies */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Govt Duties & Taxes
                      </span>
                      <div className="text-base font-bold text-purple-300">
                        {formatINR(costSheet.breakdown.total_statutory_charges)}
                      </div>
                      <div className="text-[10px] text-slate-500 space-y-0.5 pt-1">
                        <div>GST ({gstRate}%): {formatINR(costSheet.breakdown.gst_amount)}</div>
                        <div>Stamp Duty ({stampDutyRate}%): {formatINR(costSheet.breakdown.stamp_duty_amount)}</div>
                        <div>Registration: {formatINR(costSheet.breakdown.registration_fee)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Milestone Schedule (CLP) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-amber-400" /> Construction-Linked Payment Plan (CLP)
                      </span>
                      <span className="text-[10px] text-slate-400">7 Milestones</span>
                    </div>

                    <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60 max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-2">Milestone / Stage</th>
                            <th className="p-2 text-center">%</th>
                            <th className="p-2 text-right">Amount Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-[11px]">
                          {costSheet.payment_schedule.map((ms, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/40">
                              <td className="p-2 font-medium text-slate-200">
                                <div>{ms.milestone_name}</div>
                                <div className="text-[9px] text-slate-500">{ms.due_condition}</div>
                              </td>
                              <td className="p-2 text-center font-mono font-bold text-slate-300">
                                {ms.percentage}%
                              </td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-400">
                                {formatINR(ms.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsWhatsAppOpen(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/30"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Pitch Cost Sheet on WhatsApp</span>
                    </button>

                    <Button
                      variant="primary"
                      isLoading={isBooking}
                      onClick={handleQuickBook}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-600/20"
                      icon={<Lock className="h-4 w-4" />}
                    >
                      Lock Unit & Create Booking
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-24 text-center text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-400 mb-2" />
                  <span>Computing real estate cost sheet breakdown...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* WhatsApp Modal with formatted cost sheet */}
        {isWhatsAppOpen && currentLead && costSheet && (
          <WhatsAppModal
            isOpen={isWhatsAppOpen}
            onClose={() => setIsWhatsAppOpen(false)}
            leadId={currentLead.id}
            leadPhone={currentLead.phone}
            leadName={currentLead.name}
            defaultTemplate="CUSTOM"
            customText={costSheet.whatsapp_summary}
          />
        )}
      </div>
    </AnimatePresence>
  );
};
