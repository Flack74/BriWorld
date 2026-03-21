import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackgroundLayout } from "@/components/BackgroundLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to send reset email');

      setSent(true);
      toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : "Failed to send reset email";
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
              <CardTitle className="text-xl sm:text-2xl">Forgot Password</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                {sent ? "Check your email" : "Enter your email to reset your password"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {sent ? (
                <div className="text-center space-y-4">
                  <Mail className="w-16 h-16 mx-auto text-primary" />
                  <p className="text-sm">
                    If an account exists with that email, you'll receive a password reset link shortly.
                  </p>
                  <Button onClick={() => navigate("/login")} className="w-full">
                    Return to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full h-10 sm:h-12 text-sm sm:text-base" disabled={loading}>
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
              <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </BackgroundLayout>
  );
};

export default ForgotPassword;
