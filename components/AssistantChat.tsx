"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore, LocationPoint } from "@/store/useBookingStore";
import { getBottomSheetVariants, backdropVariants, useReducedMotion } from "@/lib/motion";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  actions?: string[];
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Fare to Chennai?",
  "Book self-drive for 2 days",
  "What's your cancellation policy?",
  "Change to SUV",
  "Fare for a 25km local trip?",
];

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I'm your SR Travels assistant. I can set your route, calculate real fares, or answer policy questions.",
      timestamp: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const bottomSheetVariants = getBottomSheetVariants(shouldReduceMotion);

  // Zustand Store bindings
  const {
    pickup,
    drop,
    date,
    time,
    tripType,
    driveMode,
    days,
    passengers,
    vehicleId,
    route,
    screen,
    setPickup,
    setDrop,
    setDate,
    setTime,
    setTripType,
    setDriveMode,
    setDays,
    setVehicleId,
    setHighlightedField,
    fetchRoute,
  } = useBookingStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const triggerHighlight = (field: string) => {
    setHighlightedField(field);
    setTimeout(() => {
      setHighlightedField(null);
    }, 1800);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Snapshot current Zustand booking state
    const currentBookingState = {
      pickup,
      drop,
      date,
      time,
      tripType,
      driveMode,
      days,
      passengers,
      vehicleId,
      route,
      screen,
    };

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          bookingState: currentBookingState,
        }),
      });

      const data = await res.json();
      const actionsTaken: string[] = [];

      // Apply returned function calls directly to Zustand store
      if (Array.isArray(data.functionCalls) && data.functionCalls.length > 0) {
        for (const fc of data.functionCalls) {
          if (fc.name === "setPickup") {
            const loc: LocationPoint = {
              label: fc.args.label,
              address: fc.args.address || `${fc.args.label}, Tamil Nadu`,
              lat: fc.args.lat || 12.7904,
              lng: fc.args.lng || 78.7166,
            };
            setPickup(loc);
            triggerHighlight("pickup");
            actionsTaken.push(`Set pickup to ${fc.args.label}`);
          } else if (fc.name === "setDrop") {
            const loc: LocationPoint = {
              label: fc.args.label,
              address: fc.args.address || `${fc.args.label}, Tamil Nadu`,
              lat: fc.args.lat || 12.9165,
              lng: fc.args.lng || 79.1325,
            };
            setDrop(loc);
            triggerHighlight("drop");
            actionsTaken.push(`Set drop to ${fc.args.label}`);
          } else if (fc.name === "setDate") {
            setDate(fc.args.date);
            triggerHighlight("date");
            actionsTaken.push(`Date set to ${fc.args.date}`);
          } else if (fc.name === "setTime") {
            setTime(fc.args.time);
            triggerHighlight("time");
            actionsTaken.push(`Time set to ${fc.args.time}`);
          } else if (fc.name === "setTripType") {
            setTripType(fc.args.tripType);
            triggerHighlight("tripType");
            actionsTaken.push(`Trip type: ${fc.args.tripType}`);
          } else if (fc.name === "setDriveMode") {
            setDriveMode(fc.args.driveMode);
            triggerHighlight("driveMode");
            actionsTaken.push(`Service: ${fc.args.driveMode}`);
          } else if (fc.name === "setVehicle") {
            setVehicleId(fc.args.vehicleId);
            triggerHighlight("vehicle");
            actionsTaken.push(`Selected ${fc.args.vehicleId.toUpperCase()}`);
          }
        }

        // If pickup and drop are now both defined, calculate route in background
        setTimeout(() => {
          fetchRoute().catch(() => {});
        }, 100);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: data.reply || "I've updated your trip details.",
        actions: actionsTaken.length > 0 ? actionsTaken : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "assistant",
          text: "I had trouble connecting. Please try again or tap Call Us for instant help.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Bubble Button (bottom-right, above bottom nav bar) */}
      <div className="fixed bottom-20 right-4 z-40 select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close AI Trip Assistant" : "Open AI Trip Assistant"}
          className="relative w-12 h-12 rounded-full bg-[#1c2d4f] hover:bg-[#15233e] text-[#cb950f] border-2 border-[#cb950f]/80 shadow-[0_4px_20px_rgba(28,45,79,0.4)] flex items-center justify-center active:scale-95 transition-all group"
        >
          {isOpen ? (
            <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              {/* Sparkle AI Icon */}
              <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
              </svg>
              {/* Subtle pulse indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/30 z-40 backdrop-blur-[1px] sm:hidden"
            />
            <motion.div
              variants={bottomSheetVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-24 right-4 z-50 w-[calc(100vw-32px)] max-w-sm h-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden select-none"
            >
          {/* Header */}
          <div className="bg-[#1c2d4f] text-white px-4 pt-2 pb-3 flex flex-col border-b border-slate-700/60 shrink-0">
            {/* Drag handle bar */}
            <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-2 active:scale-95 transition-transform cursor-grab shrink-0" />
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-[#cb950f] flex items-center justify-center text-[#cb950f]">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>SR Travels Assistant</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white">AI</span>
                </h3>
                <p className="text-[10px] text-slate-300">Instant trip booking &amp; transparent fares</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#1c2d4f] text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Actions summary pill */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {m.actions.map((act, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          <span>{act}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </motion.div>
            ))}

            {/* Loading Indicator per Requirement 9 */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 text-slate-500 bg-white border border-slate-200 rounded-2xl px-3.5 py-2 max-w-[60%]"
              >
                <div className="flex gap-1.5 items-center">
                  <motion.span
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0,
                    }}
                    className="w-2 h-2 rounded-full bg-[#1c2d4f]"
                  />
                  <motion.span
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                    className="w-2 h-2 rounded-full bg-[#cb950f]"
                  />
                  <motion.span
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.2, 1, 0.2] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4,
                    }}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400">Thinking...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 5 Suggested Opening Prompts Chips (Requirement 6) */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-[#1c2d4f] hover:text-[#cb950f] text-slate-700 rounded-xl text-[10px] font-bold border border-slate-200/80 active:scale-95 transition-all disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Book sedan from Ambur to Vellore..."
              disabled={isLoading}
              className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1c2d4f] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </motion.div>
      </>
    )}
  </AnimatePresence>
    </>
  );
}
