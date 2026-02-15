import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Lottie from "lottie-react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gift,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import celebrateAnimation from "../assets/celebrate.json";
import { SocialButton, GithubIcon } from "../components/SocialButton";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/api";

// Testimonials data
const testimonials = [
  {
    quote:
      "The best platform for saving and organizing programming guides. Saved me hours of searching!",
    author: "John Smith",
    role: "Full Stack Developer",
    image: "/auth/avatar1.png",
  },
  {
    quote: "Amazing user interface and so easy to use. I rely on it daily.",
    author: "Sarah Johnson",
    role: "Software Engineer",
    image: "/auth/avatar2.png",
  },
  {
    quote: "The AI-powered search completely changed how I work. Incredible!",
    author: "Mike Chen",
    role: "DevOps Engineer",
    image: "/auth/avatar3.png",
  },
  {
    quote:
      "A professional platform that brings everything I need in one place.",
    author: "Emily Davis",
    role: "Frontend Developer",
    image: "/auth/avatar4.png",
  },
];

// Background images for slider
const bgImages = [
  "/auth/bg1.png",
  "/auth/bg2.png",
  "/auth/bg3.png",
  "/auth/bg4.png",
];

const blurFadeImages = Array.from({ length: 9 }, (_, i) => {
  const isLandscape = i % 2 === 0;
  const width = isLandscape ? 800 : 600;
  const height = isLandscape ? 600 : 800;
  return `https://picsum.photos/seed/${i + 1}/${width}/${height}`;
});

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // login, register, forgot, reset
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [referralCode, setReferralCode] = useState("");
  const [isValidReferral, setIsValidReferral] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user: currentUser } = useAuth();
  const loginAttempted = useRef(false);

  // Auto-slide testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Check for reset token
  useEffect(() => {
    const token = searchParams.get("token");
    const action = searchParams.get("action");
    if (token && action === "reset") {
      setMode("reset");
    }
  }, [searchParams]);

  // Check for referral code (URL or LocalStorage)
  useEffect(() => {
    const ref = searchParams.get("ref");
    const storedRef = localStorage.getItem("pending_referral_code");

    // SAFETY: Only use stored ref if current URL has a ref parameter
    // This prevents showing referral banner on plain /auth visits
    const effectiveRef = ref || (ref ? storedRef : null);

    if (effectiveRef) {
      setReferralCode(effectiveRef);
      if (!storedRef && ref) {
        localStorage.setItem("pending_referral_code", effectiveRef);
      }

      // Only switch mode if we are not already in a specific flow (like reset)
      if (mode === "login" && !searchParams.get("token")) {
        setMode("register");
      }

      // Validate referral code - must be alphanumeric only, 6-12 characters
      const isValid = /^[A-Za-z0-9]{6,12}$/.test(effectiveRef);
      setIsValidReferral(isValid);

      if (!isValid) {
        // Remove any invalid stored code
        localStorage.removeItem("pending_referral_code");
      }
    } else {
      // SAFETY: Clear referral code if no valid ref in URL
      setReferralCode("");
      setIsValidReferral(false);
    }
  }, [searchParams]);

  // Handle OAuth callback - detect tokens in URL hash and process login
  useEffect(() => {
    // If already logged in, redirect to home and stop
    if (currentUser) {
      console.log("⚡ Already logged in, skipping OAuth check");
      if (!loginAttempted.current) {
        navigate("/");
      }
      return;
    }

    let didLogin = false;

    // 1. Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("🔑 Auth event:", event, "User:", session?.user?.email);

        // Handle ALL sign-in events (SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED)
        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") &&
          session?.user &&
          !didLogin &&
          !loginAttempted.current
        ) {
          didLogin = true;
          loginAttempted.current = true;
          console.log("✅ OAuth login successful:", session.user.email);

          // Save to AuthContext
          login(session.access_token, session.user);

          // Navigate to home
          setTimeout(() => {
            navigate("/");
          }, 300);
        }
      }
    );

    // 2. THEN check if URL has OAuth tokens in hash fragment (#access_token=...)
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      console.log("🔍 Found OAuth tokens in URL hash, processing...");

      // Parse hash fragment manually as a backup
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        console.log("🔄 Setting session from URL tokens...");

        // Tell Supabase to set the session from these tokens
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).then(({ data, error }) => {
          if (error) {
            console.error("❌ setSession error:", error);
            setMessage({ type: "error", text: "Login failed: " + error.message });
          } else if (data?.session?.user && !didLogin && !loginAttempted.current) {
            didLogin = true;
            loginAttempted.current = true;
            console.log("✅ Session set successfully:", data.session.user.email);

            // Save to AuthContext
            login(data.session.access_token, data.session.user);

            // Clean the URL hash
            window.history.replaceState(null, "", window.location.pathname);

            // Navigate to home
            setTimeout(() => {
              navigate("/");
            }, 300);
          }
        });
      }
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate, login]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      switch (mode) {
        case "register":
          if (formData.password !== formData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setLoading(false);
            return;
          }

          // Smart redirect logic: Use production URL in build, localhost in dev
          const redirectUrl = import.meta.env.PROD
            ? "https://zetsuquids.vercel.app/auth"
            : `${window.location.origin}/auth`;

          // Get referral code if valid
          const finalReferralCode = isValidReferral ? referralCode : "";

          // Use Custom API for Registration (Bypasses Supabase Email Limits)
          const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              redirectUrl,
              referralCode: finalReferralCode,
            }),
          });

          let result;
          try {
            const text = await response.text();
            try {
              result = JSON.parse(text);
            } catch (e) {
              // If not JSON, use the text as error message if response failed, or generic error
              console.error("Failed to parse registration response:", text);
              throw new Error(
                response.ok
                  ? "Server returned invalid response"
                  : text || "Server error",
              );
            }
          } catch (e) {
            throw new Error(e.message || "Network error during registration");
          }

          if (!response.ok) {
            throw new Error(result.error || "Registration failed");
          }

          // Show celebration
          setShowCelebration(true);

          // Show appropriate message based on environment
          const emailProvider = formData.email.includes("gmail")
            ? "Gmail"
            : "your email provider";
          setMessage({
            type: "success",
            text: `Verification link sent via Gmail! Please check ${emailProvider}.`,
          });
          break;

        case "login":
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });

          if (signInError) throw signInError;

          if (signInData.user) {
            login(signInData.session.access_token, signInData.user);
            navigate("/");
          }
          break;

        case "forgot":
          const { error: resetError } =
            await supabase.auth.resetPasswordForEmail(formData.email, {
              redirectTo: `${window.location.origin}/auth`,
            });

          if (resetError) throw resetError;
          setMessage({
            type: "success",
            text: "Password reset link sent to your email!",
          });
          break;

        case "reset":
          if (formData.password !== formData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setLoading(false);
            return;
          }

          const { error: updateError } = await supabase.auth.updateUser({
            password: formData.password,
          });

          if (updateError) throw updateError;
          setMessage({
            type: "success",
            text: "Password updated successfully!",
          });
          setTimeout(() => navigate("/"), 2000);
          break;
      }

      // Handle success messages for different modes
      if (mode === "register") {
        setTimeout(() => setMode("login"), 3000);
      }
    } catch (error) {
      console.error("Auth error:", error);

      let errorMessage = "Authentication failed";

      // Handle specific Supabase errors
      if (error.message.includes("Invalid login credentials")) {
        errorMessage =
          "Incorrect email or password. Please check your credentials or create an account.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage =
          "Please check your email and click the verification link before signing in.";
      } else if (error.message.includes("User already registered")) {
        errorMessage =
          "An account with this email already exists. Please sign in instead.";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Unable to validate email address")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth Handler
  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const redirectUrl = import.meta.env.PROD
        ? "https://zetsuquids.vercel.app/auth"
        : `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'consent', // Force consent screen to allow account switching
          }
        },
      });

      if (error) throw error;

      // User will be redirected to GitHub, then back to app
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to connect with GitHub",
      });
      setLoading(false);
    }
  };

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );

  const getTitle = () => {
    switch (mode) {
      case "register":
        return "Create New Account";
      case "forgot":
        return "Reset Password";
      case "reset":
        return "Set New Password";
      default:
        return "Sign In";
    }
  };

  return (
    <div className="min-h-screen flex animate-in fade-in duration-700 relative">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-center overflow-hidden">
          <Lottie
            animationData={celebrateAnimation}
            loop={false}
            onComplete={() => setTimeout(() => setShowCelebration(false), 3000)}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* Left Side - Testimonials & Images */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {bgImages.map((img, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? "opacity-40" : "opacity-0"
                }`}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full h-full">
          {/* Logo */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 text-white hover:opacity-80 transition-opacity group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/10 group-hover:scale-105 transition-transform duration-300">
                <span className="text-black text-2xl font-black">Z</span>
              </div>
              <span className="text-3xl font-bold tracking-tight">
                ZetsuGuides
              </span>
            </Link>
          </div>

          {/* Testimonial */}
          <div className="flex-1 flex items-center">
            <div className="max-w-xl">
              {testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className={`transition-all duration-1000 ease-out ${idx === currentSlide
                    ? "opacity-100 translate-y-0 filter blur-0"
                    : "opacity-0 translate-y-12 absolute filter blur-sm"
                    }`}
                >
                  {idx === currentSlide && (
                    <>
                      <div className="mb-8">
                        <div className="flex gap-1 mb-6">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className="text-yellow-400 text-xl"
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <blockquote className="text-white text-4xl font-medium leading-tight mb-8 drop-shadow-lg">
                          "{testimonial.quote}"
                        </blockquote>
                      </div>
                      <div className="flex items-center gap-5 backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/10 w-fit">
                        <img
                          src={testimonial.image}
                          alt={testimonial.author}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white/50"
                        />
                        <div>
                          <p className="text-white font-bold text-xl">
                            {testimonial.author}
                          </p>
                          <p className="text-white/70 font-medium">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center justify-between mt-12">
            <div className="flex gap-3">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide
                    ? "bg-white w-12"
                    : "bg-white/20 w-3 hover:bg-white/40"
                    }`}
                />
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={prevSlide}
                className="w-14 h-14 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="w-14 h-14 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-zinc-50 relative overflow-hidden">
        {/* BlurFade Gallery Background */}
        <div className="absolute inset-0 z-0 overflow-y-auto overflow-x-hidden opacity-50 pointer-events-none fade-in-50">
          <div className="columns-2 gap-4 sm:columns-3 p-4">
            {blurFadeImages.map((imageUrl, idx) => (
              <BlurFade key={imageUrl} delay={0.25 + idx * 0.05} inView>
                <img
                  className="mb-4 size-full rounded-lg object-contain"
                  src={imageUrl}
                  alt={`Random stock image ${idx + 1}`}
                />
              </BlurFade>
            ))}
          </div>
          {/* Bottom Gradient Fade */}
          <div className="fixed bottom-0 right-0 w-[50%] h-32 bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none" />
        </div>

        <Card className="w-full max-w-md animate-in slide-in-from-right-8 duration-700 shadow-2xl relative overflow-hidden border-zinc-200/80 bg-white/80 backdrop-blur-md z-10">
          <BorderBeam size={300} duration={12} delay={9} />

          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-4 flex justify-center">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                  <span className="text-white text-xl font-black">Z</span>
                </div>
                <span className="text-xl font-bold tracking-tight">
                  ZetsuGuides
                </span>
              </Link>
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-base">
              {mode === "login" && "Welcome back! Sign in to continue"}
              {mode === "register" && "Join today and save your guides"}
              {mode === "forgot" && "Enter email to reset password"}
              {mode === "reset" && "Create your new password"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Referral Banner */}
            {referralCode && mode === "register" && isValidReferral && (
              <div className="mb-6 p-4 rounded-xl flex items-center gap-4 bg-zinc-950 text-white shadow-lg ring-1 ring-black/5">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <Gift size={20} className="text-yellow-300" />
                </div>
                <div>
                  <p className="font-bold text-sm">Invitation Accepted!</p>
                  <p className="text-xs text-zinc-300">
                    You'll receive existing bonus credits.
                  </p>
                </div>
              </div>
            )}

            {/* Invalid Referral Banner */}
            {referralCode && mode === "register" && !isValidReferral && (
              <div className="mb-6 p-4 rounded-xl flex items-center gap-4 bg-red-50 text-red-900 border border-red-100">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="font-bold text-sm">Invalid Link</p>
                  <p className="text-xs text-red-600">
                    This referral code doesn't look right.
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            {message.text && (
              <div
                className={`mb-6 p-3 rounded-lg flex items-center gap-3 ${message.type === "success"
                  ? "bg-green-50 text-green-900 border border-green-100"
                  : "bg-red-50 text-red-900 border border-red-100"
                  } animate-in zoom-in-95 duration-200`}
              >
                {message.type === "success" ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Register only) */}
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="pl-10 h-11"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              {(mode === "login" ||
                mode === "register" ||
                mode === "forgot") && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="pl-10 h-11"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                )}

              {/* Password Field */}
              {(mode === "login" ||
                mode === "register" ||
                mode === "reset") && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 h-11 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}

              {/* Confirm Password (Register & Reset) */}
              {(mode === "register" || mode === "reset") && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="pl-10 h-11"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Forgot Password Link */}
              {mode === "login" && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-semibold mt-2"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" && "Sign In"}
                    {mode === "register" && "Create Account"}
                    {mode === "forgot" && "Send Reset Link"}
                    {mode === "reset" && "Reset Password"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              {/* Social Login - Only on Login/Register */}
              {(mode === "login" || mode === "register") && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <SocialButton onClick={handleGitHubLogin} disabled={loading}>
                    <GithubIcon />
                    Continue with GitHub
                  </SocialButton>
                </>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-center bg-zinc-50/50 border-t py-6">
            {mode === "login" && (
              <p className="text-sm text-muted-foreground">
                New to ZetsuGuides?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-primary font-semibold hover:underline ml-1"
                >
                  Create Account
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-semibold hover:underline ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button
                onClick={() => setMode("login")}
                className="text-primary font-semibold hover:underline flex items-center gap-2 text-sm"
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
