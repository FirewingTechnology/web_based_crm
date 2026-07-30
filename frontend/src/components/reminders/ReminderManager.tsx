import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Volume2, Phone, Calendar, CheckCircle2, Clock, X, Sparkles } from 'lucide-react';
import { followupsApi } from '../../api/followups';
import { Followup } from '../../types/followup';
import { Button } from '../ui/Button';

// Play synthesized Google-style chime sound using Web Audio API
export const playReminderChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.4);
    });
  } catch (err) {
    console.error('Audio chime playback failed:', err);
  }
};

// Voice announcement using Web Speech API
export const speakReminderVoice = (text: string) => {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch (err) {
    console.error('Voice synth failed:', err);
  }
};

export const ReminderManager: React.FC = () => {
  const [activeReminder, setActiveReminder] = useState<Followup | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll for due followups every 8 seconds
  useEffect(() => {
    const checkFollowups = async () => {
      try {
        const followups = await followupsApi.getFollowups({ status: 'Pending', my_followups_only: true });
        const now = new Date();

        for (const item of followups) {
          if (notifiedIds.has(item.id)) continue;

          // Parse scheduled_at cleanly (handling local format YYYY-MM-DDTHH:mm)
          const timeStr = item.scheduled_at.replace(' ', 'T');
          const scheduledTime = new Date(timeStr);
          
          if (isNaN(scheduledTime.getTime())) continue;

          // Difference in minutes between current time and scheduled time
          const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60);

          // Trigger if scheduled time is due (between 1 minute before to 60 minutes after)
          if (diffMinutes >= -1.5 && diffMinutes <= 60) {
            setActiveReminder(item);
            setNotifiedIds((prev) => new Set(prev).add(item.id));

            // Play Chime + Voice Alert
            playReminderChime();
            setTimeout(() => {
              const voiceMsg = `Reminder Alert! You have a scheduled ${item.type} with ${item.lead_name || 'client'}.`;
              speakReminderVoice(voiceMsg);
            }, 500);
            break;
          }
        }
      } catch (err) {
        console.error('Error checking followup reminders:', err);
      }
    };

    checkFollowups();
    const interval = setInterval(checkFollowups, 8000);
    return () => clearInterval(interval);
  }, [notifiedIds]);

  const handleComplete = async () => {
    if (!activeReminder) return;
    setIsProcessing(true);
    try {
      await followupsApi.updateFollowup(activeReminder.id, { status: 'Completed' });
      setActiveReminder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnooze = async (minutes: number) => {
    if (!activeReminder) return;
    setIsProcessing(true);
    try {
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      const pad = (n: number) => String(n).padStart(2, '0');
      const newTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      await followupsApi.updateFollowup(activeReminder.id, { scheduled_at: newTime, status: 'Pending' });
      setActiveReminder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerTestAlert = () => {
    playReminderChime();
    speakReminderVoice("Voice reminder system test working perfectly!");
  };

  if (!activeReminder) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveReminder(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Glowing Alarm Modal Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 p-6 shadow-2xl border-2 border-blue-500/50 shadow-blue-500/20 text-white space-y-5"
        >
          {/* Header Badge & Pulsing Ring Icon */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/40 animate-bounce">
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1 w-max">
                  <Sparkles className="h-3 w-3" /> Voice Alert Reminder
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Followup Scheduled</h3>
              </div>
            </div>

            <button
              onClick={() => setActiveReminder(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Followup Details Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white text-base truncate">{activeReminder.title}</h4>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30">
                {activeReminder.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">{activeReminder.lead_name || 'Buyer Lead'}</p>
                  <p className="text-[11px] text-slate-400">{activeReminder.lead_phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <p className="font-medium text-slate-200">
                    {new Date(activeReminder.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-blue-400">Scheduled Time</p>
                </div>
              </div>
            </div>

            {activeReminder.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                "{activeReminder.notes}"
              </p>
            )}
          </div>

          {/* Voice Sound Re-trigger & Quick Call Bar */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-400">
            <button
              onClick={() => {
                playReminderChime();
                speakReminderVoice(`Reminder Alert! ${activeReminder.type} with ${activeReminder.lead_name}`);
              }}
              className="flex items-center gap-1.5 text-blue-400 hover:underline"
            >
              <Volume2 className="h-4 w-4" /> Replay Voice Alert
            </button>

            {activeReminder.lead_phone && (
              <a
                href={`tel:${activeReminder.lead_phone}`}
                className="flex items-center gap-1 text-emerald-400 font-medium hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> Call {activeReminder.lead_phone}
              </a>
            )}
          </div>

          {/* Interactive Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSnooze(15)}
              isLoading={isProcessing}
              icon={<Clock className="h-3.5 w-3.5" />}
            >
              Snooze 15m
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setActiveReminder(null)}
              className="bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleComplete}
              isLoading={isProcessing}
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Complete
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
