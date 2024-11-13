import React, { useState } from "react";
import { requestResetPassword } from "../../services/authService";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Label from "../ui/Label";

function SecuritySettings() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Request password reset email
      await requestResetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(
        err.message || "Failed to send password reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Security Settings</h1>
      <p className="text-gray-700 mb-6">
        Change your password here. Enter your email address, and we'll send you
        a link to reset your password.
      </p>
      {!isSubmitted ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      ) : (
        <p className="text-green-500 mt-2">
          If the email exists in our system, a password reset link has been sent. Please check your inbox.
        </p>
      )}
    </div>
  );
}

export default SecuritySettings;
