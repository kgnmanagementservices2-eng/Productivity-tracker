import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../../../services/api";
import { useSocket } from "../../../context/SocketContext";
import { Button } from "../../common/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../common/Card";
import {
  MessageSquare,
  Paperclip,
  Send,
  UploadCloud,
  X,
  File,
} from "lucide-react";

export default function SupportChat({ ticketId, currentUserId, ticketStatus }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dragCounter = useRef(0);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (selectedFile && selectedFile.type?.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

  useEffect(() => {
    const fetchMessages = async () => {
      const msgResponse = await api.get(`/tickets/${ticketId}/messages`);
      if (msgResponse.data && Array.isArray(msgResponse.data.data)) {
        setMessages(msgResponse.data.data);
      }
    };
    fetchMessages();
  }, [ticketId]);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (String(msg.ticket_id) === String(ticketId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on("new_ticket_message", handleNewMessage);
    return () => socket.off("new_ticket_message", handleNewMessage);
  }, [socket, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0)
      setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) setSelectedFile(files[0]);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        const file = items[i].getAsFile();
        if (file) {
          setSelectedFile(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setIsSending(true);
    try {
      let finalS3Url = null;
      let finalFileName = null;

      if (selectedFile) {
        if (selectedFile.size > 25 * 1024 * 1024) {
          toast.error("File is too large. Maximum size allowed is 25MB.");
          setIsSending(false);
          return;
        }
        setUploadProgress(1);
        const presignedRes = await api.post("/upload/presigned-url", {
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/octet-stream",
        });
        const { uploadUrl, fileUrl } = presignedRes.data.data;

        await axios.put(uploadUrl, selectedFile, {
          headers: {
            "Content-Type": selectedFile.type || "application/octet-stream",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total)
              setUploadProgress(
                Math.round((progressEvent.loaded * 100) / progressEvent.total),
              );
          },
        });
        finalS3Url = fileUrl;
        finalFileName = selectedFile.name;
      }

      await api.post(`/tickets/${ticketId}/messages`, {
        message: newMessage,
        attachmentUrl: finalS3Url,
        attachmentName: finalFileName,
      });
      setNewMessage("");
      setSelectedFile(null);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload file or send message.",
      );
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card
      className="shadow-sm border-slate-200/60 rounded-xl bg-white/90 backdrop-blur-md flex flex-col flex-1 min-h-[500px] relative overflow-hidden transition-all"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-indigo-50/90 backdrop-blur-sm border-4 border-dashed border-indigo-400 m-2 rounded-xl flex flex-col items-center justify-center transition-all duration-200">
          <div className="pointer-events-none flex flex-col items-center">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 animate-bounce">
              <UploadCloud size={40} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-indigo-900 tracking-tight">
              Drop your file to attach
            </h3>
          </div>
        </div>
      )}

      <CardHeader className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-4 px-6 sticky top-0 z-10">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2 tracking-tight">
          <MessageSquare size={18} className="text-slate-400" /> Support Thread
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {!messages || messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-200">
              <MessageSquare size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-500">
              No messages yet. Start the conversation below.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = String(msg.sender_id) === String(currentUserId);
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <div className="flex items-baseline gap-2 mb-1.5 px-1">
                  <span className="text-xs font-semibold text-slate-600">
                    {isMine ? "You" : msg.sender_name}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {msg.created_at
                      ? new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                        }).format(new Date(msg.created_at))
                      : ""}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm rounded-2xl ${isMine ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm" : "bg-white border border-slate-200/60 text-slate-800 rounded-tl-sm shadow-sm"}`}
                >
                  {msg.attachment_url && (
                    <a
                      href={msg.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block group ${!msg.message ? "mb-0" : "mb-3"}`}
                    >
                      {msg.attachment_name?.match(
                        /\.(jpeg|jpg|gif|png|webp|avif)$/i,
                      ) ||
                      msg.attachment_url?.match(
                        /\.(jpeg|jpg|gif|png|webp|avif)(\?.*)?$/i,
                      ) ? (
                        <img
                          src={msg.attachment_url}
                          alt="attachment"
                          className="rounded-xl max-h-64 max-w-full object-cover border border-black/5 shadow-sm group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isMine ? "bg-white/10 border-white/20 hover:bg-white/20 text-white" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"}`}
                        >
                          <File
                            size={16}
                            className={
                              isMine ? "text-indigo-200" : "text-slate-400"
                            }
                          />
                          <span className="truncate text-xs font-medium max-w-[200px]">
                            {msg.attachment_name || "Attachment"}
                          </span>
                        </div>
                      )}
                    </a>
                  )}
                  {msg.message && (
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                      {msg.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {ticketStatus !== "CLOSED" && (
        <div className="border-t border-slate-100 bg-white/80 backdrop-blur-md p-4 rounded-b-xl relative z-10">
          {isSending && uploadProgress > 0 && (
            <div className="mb-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-900">
                <span className="truncate max-w-[250px]">
                  Uploading {selectedFile?.name}...
                </span>
                <span className="tabular-nums font-bold">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-indigo-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {selectedFile && !isSending && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100 shadow-sm w-fit relative group">
              {previewUrl ? (
                <div className="h-10 w-10 rounded overflow-hidden shrink-0 bg-slate-100 border border-indigo-200/50">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <File size={16} className="text-indigo-500 ml-1" />
              )}
              <span className="text-xs text-slate-700 truncate max-w-[200px] font-semibold pr-2">
                {selectedFile.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-slate-400 hover:text-red-500 p-1 bg-white hover:bg-red-50 rounded-md border border-slate-200 transition-colors absolute -top-2 -right-2 shadow-sm"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex items-end gap-3 relative"
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50 outline-none"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onPaste={handlePaste}
              disabled={isSending}
              placeholder="Reply to this thread or paste an image..."
              className="flex-1 max-h-32 min-h-[44px] bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white resize-none transition-all custom-scrollbar disabled:bg-slate-100"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={isSending || (!newMessage.trim() && !selectedFile)}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex-shrink-0 h-[44px] w-[44px] flex items-center justify-center shadow-sm"
            >
              <Send
                size={18}
                className={isSending ? "animate-pulse" : "ml-0.5"}
              />
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}
