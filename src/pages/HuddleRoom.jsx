/* eslint-disable no-unused-vars */
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  PhoneOff,
  Mic,
  MicOff,
  Users,
  FileText,
  ShieldAlert,
  Loader2,
  PhoneForwarded,
  PhoneMissed,
  PhoneOutgoing,
  PhoneIncoming,
  History,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import { Button } from "../components/common/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/common/Card";

export default function HuddleRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const socket = useSocket();
  const callId = location.state?.callId;
  const isInitiator = location.state?.isInitiator || false;

  // UI & Ticket State
  const [ticket, setTicket] = useState(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(true);

  // Call State
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isRinging, setIsRinging] = useState(isInitiator);
  const [hasOtherJoined, setHasOtherJoined] = useState(false);

  // NATIVE WEBRTC REFS
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const iceQueueRef = useRef([]); // 🟢 NEW: Safely queues network coordinates

  // 1. Fetch Ticket Data
  useEffect(() => {
    const fetchTicketContext = async () => {
      try {
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data.data);
      } catch (error) {
        toast.error("Could not load ticket context.");
      } finally {
        setIsLoadingTicket(false);
      }
    };
    fetchTicketContext();
  }, [id]);

  // 2. Trigger the Backend "Answered" Event so the Caller unlocks
  useEffect(() => {
    if (!isInitiator) {
      // Hit this endpoint so the backend tells the Caller we picked up!
      api.get(`/tickets/${id}/call-token`).catch(() => {});
    }
  }, [id, isInitiator]);

  // 3. Caller listens for the Agent to pick up
  useEffect(() => {
    if (socket && isInitiator && isRinging) {
      const handleAnswered = (data) => {
        if (String(data.ticketId) === String(id)) {
          toast.success("Agent accepted! Connecting audio...", { icon: "🎧" });
          setIsRinging(false); // 🟢 Unlocks the Caller's WebRTC connection
        }
      };

      socket.on("call_answered", handleAnswered);
      return () => socket.off("call_answered", handleAnswered);
    }
  }, [socket, isInitiator, isRinging, id]);

  // 4. NATIVE WEBRTC SETUP & SIGNALING
  useEffect(() => {
    if (isRinging || !socket) return;

    const roomName = `ticket_huddle_${id}`;
    const rtcConfig = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // A. Ask for Microphone Access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Safety check in case the user hit "Back" while waiting for mic permissions
        if (pc.signalingState === "closed") {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // 🟢 THE FIX: We just join the room and wait.
        // If we are first, we will get 'user_joined_huddle' when the other person arrives and send the offer.
        // If we are second, the other person gets 'user_joined_huddle' and they will send the offer!
        socket.emit("join_huddle_room", { roomName });
      })
      .catch((err) => {
        console.error("Mic Error:", err);
        setConnectionError("Microphone access denied.");
        toast.error("We need microphone access to connect the call.");
      });

    // B. Listen for the other person's voice track arriving
    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
      setHasOtherJoined(true);
      toast.success("Voice network connected securely!");
    };

    // C. Pass Network Routing Data (ICE Candidates)
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          candidate: event.candidate,
          roomName,
        });
      }
    };

    // --- SOCKET.IO SIGNALING HANDLERS ---

    const processIceQueue = async () => {
      for (const cand of iceQueueRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.error(e);
        }
      }
      iceQueueRef.current = [];
    };

    // 🟢 Whoever is already in the room when the other person joins will send the Offer!
    const handleUserJoined = async () => {
      setHasOtherJoined(true);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc_offer", { offer, roomName });
      } catch (e) {
        console.error("Offer Error", e);
      }
    };

    const handleReceiveOffer = async ({ offer }) => {
      setHasOtherJoined(true);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processIceQueue(); // Process any network coordinates that arrived early
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc_answer", { answer, roomName });
      } catch (e) {
        console.error("Answer Error", e);
      }
    };

    const handleReceiveAnswer = async ({ answer }) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await processIceQueue();
      } catch (e) {
        console.error("Set Answer Error", e);
      }
    };

    const handleReceiveIceCandidate = async ({ candidate }) => {
      try {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          iceQueueRef.current.push(candidate); // Queue it if we aren't ready yet!
        }
      } catch (e) {
        console.error("ICE Error", e);
      }
    };

    const handleUserLeft = () => {
      toast.error("The other person hung up.", { icon: "☎️" });
      handleLeaveCall();
    };

    // Attach listeners
    socket.on("user_joined_huddle", handleUserJoined);
    socket.on("webrtc_offer", handleReceiveOffer);
    socket.on("webrtc_answer", handleReceiveAnswer);
    socket.on("webrtc_ice_candidate", handleReceiveIceCandidate);
    socket.on("user_left_huddle", handleUserLeft);

    // CLEANUP
    return () => {
      socket.emit("leave_huddle_room", { roomName });
      socket.off("user_joined_huddle", handleUserJoined);
      socket.off("webrtc_offer", handleReceiveOffer);
      socket.off("webrtc_answer", handleReceiveAnswer);
      socket.off("webrtc_ice_candidate", handleReceiveIceCandidate);
      socket.off("user_left_huddle", handleUserLeft);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (pc) {
        pc.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRinging, socket, id]);

  // 5. Hang Up
  const handleLeaveCall = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    try {
      await api.post(`/tickets/${id}/end-call`, {
        callId,
        isAnswered: hasOtherJoined,
      });
    } catch (error) {
      console.error("Failed to log call end", error);
    }

    navigate(`/tickets/${id}`);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            {isConnected && (
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
            Live Voice Huddle
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ticket #{id.substring(0, 8)}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={handleLeaveCall}
          className="text-slate-500 hover:text-red-600"
        >
          <ArrowLeft size={18} className="mr-2" /> Leave & Go Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VOICE INTERFACE */}
        <div className="lg:col-span-2 flex flex-col h-[600px] bg-[#0f172a] rounded-2xl shadow-2xl overflow-hidden border border-slate-800 relative">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div
              className={`h-24 w-24 rounded-full flex items-center justify-center mb-6 shadow-inner border transition-all duration-500 ${
                isRinging
                  ? "bg-amber-500/20 border-amber-500 animate-pulse"
                  : isConnected
                    ? "bg-indigo-600/20 border-indigo-500"
                    : "bg-slate-800 border-slate-700"
              }`}
            >
              {isRinging ? (
                <PhoneForwarded size={40} className="text-amber-400" />
              ) : isConnected ? (
                <Users size={40} className="text-indigo-400" />
              ) : connectionError ? (
                <PhoneOff size={40} className="text-red-500" />
              ) : (
                <Loader2 size={40} className="text-slate-400 animate-spin" />
              )}
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {isRinging
                ? "Waiting for user..."
                : isConnected
                  ? "Connected to Secure Voice Network"
                  : connectionError
                    ? "Connection Failed"
                    : "Connecting..."}
            </h2>
            <p className="text-slate-400 text-sm max-w-md">
              {isRinging
                ? "The room will automatically connect when the agent accepts."
                : connectionError
                  ? connectionError
                  : "Audio is encrypted end-to-end via WebRTC."}
            </p>

            {/* 🟢 THE MAGIC AUDIO ELEMENT */}
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
          </div>

          <div className="h-20 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-6 px-6">
            <button
              onClick={toggleMute}
              disabled={!isConnected}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                isMuted
                  ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={handleLeaveCall}
              className="h-12 px-6 rounded-full flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 font-bold shadow-lg transition-transform hover:scale-105"
            >
              <PhoneOff size={20} /> End Call
            </button>
          </div>
        </div>

        {/* TICKET CONTEXT & CALL HISTORY */}
        <div className="lg:col-span-1 h-[600px] overflow-y-auto">
          <Card className="h-full border-slate-200 shadow-sm flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 sticky top-0 z-10">
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <FileText size={18} className="text-indigo-600" />
                Ticket Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {isLoadingTicket ? (
                <div className="text-slate-400 text-sm animate-pulse">
                  Loading data...
                </div>
              ) : ticket ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Category
                      </span>
                      {ticket.priority === "EMERGENCY" && (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                          <ShieldAlert size={12} /> EMERGENCY
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">
                      {ticket.category_level_1}
                    </p>
                    <p className="text-sm text-slate-500">
                      {ticket.category_level_2}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Reported By
                    </span>
                    <p className="font-semibold text-slate-900">
                      {ticket.creator_name || "Employee"}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Issue Summary
                    </span>
                    <div className="bg-slate-50 rounded-md p-4 text-sm text-slate-700 border border-slate-200 leading-relaxed whitespace-pre-wrap">
                      {(ticket.description || ticket.reason || "")
                        .replace(
                          /TICKET SUBMISSION:[\s\S]*?Priority:.*(\n|$)/i,
                          "",
                        )
                        .trim() || "No additional comments provided."}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <History size={14} /> Call History
                    </span>

                    <div className="space-y-3">
                      {!ticket.call_history ||
                      ticket.call_history.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">
                          No previous calls recorded.
                        </p>
                      ) : (
                        ticket.call_history.map((log) => {
                          const isCurrentlyActive = log.ended_at === null;
                          const isMissed =
                            !isCurrentlyActive && log.is_answered === false;
                          const isOutgoing =
                            log.initiator_id === (user?.id || user?.userId);

                          return (
                            <div
                              key={log.id}
                              className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-full ${isMissed ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}
                                >
                                  {isMissed ? (
                                    <PhoneMissed size={16} />
                                  ) : isOutgoing ? (
                                    <PhoneOutgoing size={16} />
                                  ) : (
                                    <PhoneIncoming size={16} />
                                  )}
                                </div>

                                <div>
                                  <p
                                    className={`text-sm font-semibold ${isMissed ? "text-red-600" : "text-slate-900"}`}
                                  >
                                    {log.initiator_name}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <span>
                                      {new Intl.DateTimeFormat("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "numeric",
                                        minute: "numeric",
                                      }).format(new Date(log.started_at))}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                {isCurrentlyActive ? (
                                  <span className="text-xs font-bold text-emerald-600 animate-pulse bg-emerald-50 px-2 py-1 rounded">
                                    Active
                                  </span>
                                ) : isMissed ? (
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-red-500 font-bold">
                                      Missed
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Waited {log.duration_seconds || 0}s
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                    {Math.floor(log.duration_seconds / 60)}m{" "}
                                    {log.duration_seconds % 60}s
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-red-400 text-sm">
                  Failed to load ticket data.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
