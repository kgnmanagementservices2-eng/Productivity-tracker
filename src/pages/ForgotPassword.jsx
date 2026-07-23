/* eslint-disable no-unused-vars */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/common/Card";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    // We will wire this to a real backend endpoint later.
    // For now, we simulate the network request and show a success state.
    return new Promise((resolve) => {
      setTimeout(() => {
        toast.success(
          "If an account exists, a reset link has been sent to your email.",
        );
        resolve();
      }, 1500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            Reset Password
          </CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Enter your email and we'll send you a recovery link.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              {...register("email")}
              error={errors.email?.message}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending Link..." : "Send Recovery Link"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              to="/login"
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              &larr; Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
