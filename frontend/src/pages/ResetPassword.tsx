import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackgroundLayout } from "@/components/BackgroundLayout";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast({ title: "Invalid link", description: "No reset token found", variant: "destructive" });
      navigate("/login");
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
      return;
    }

    if (password.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      toast({ title: "Success!", description: "Your password has been reset" });
      navigate("/login");
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : "Failed to reset password";
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundLayout>
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-md mx-2 sm:mx-4">
          <Button
            variant="outline"
            className="mb-3 sm:mb-4 h-8 sm:h-10 text-xs sm:text-sm"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back to Login
          </Button>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="text-center p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl">Reset Password</CardTitle>
              <CardDescription className="text-sm sm:text-base">Enter your new password</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="password" className="text-sm sm:text-base">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                </div>
                <Button type="submit" className="w-full h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackgroundLayout>
  );
};

export default ResetPassword;
