import { useState } from "react";
import { X, Key, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api"; // Adjust path as needed
import { Button } from "../common/Button"; // Adjust path as needed

export function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("Please fill in all password fields.");
    }
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match!");
    }

    // 2. API Request
    try {
      setIsUpdating(true);
      // Assuming your backend has an endpoint like this:
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword
      });

      toast.success("Password updated successfully!");
      
      // Clean up and close
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password.");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleShow = () => setShowPasswords(!showPasswords);
  const inputType = showPasswords ? "text" : "password";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Key size={18} className="text-indigo-600" />
            Change Password
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Current Password</label>
            <div className="relative">
              <input
                type={inputType}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="Enter current password"
              />
              <button type="button" onClick={toggleShow} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">New Password</label>
            <input
              type={inputType}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
            <input
              type={inputType}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="Type new password again"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating} className="flex-1">
              {isUpdating ? "Saving..." : "Update Password"}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}