import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ArrowRight, Check, LayoutDashboard, Mail } from "lucide-react";

// Same rule PrivateRoute uses: a token that decodes and isn't about to expire.
function getSignedInUser() {
  try {
    const token = localStorage.getItem("jwt_token");
    if (!token) return null;
    const { exp, sub } = jwtDecode(token);
    if (!sub || exp < Date.now() / 1000 + 10) return null;
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return null;
  }
}

const perks = ["Free for students", "Set up in a minute", "No spam, ever"];

// Soft dot texture on the green panel.
const dots = {
  backgroundImage:
    "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
};

export default function JoinSection() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [user] = useState(getSignedInUser);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/signup", { state: { email: email.trim() } });
  };

  const name = user?.first_name || user?.username;

  return (
    <section
      id="join-section"
      className="w-full py-12 md:py-24 lg:py-32 bg-green-50/60 dark:bg-green-950"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 via-green-700 to-green-600 px-6 py-14 text-center shadow-2xl shadow-green-900/30 md:px-16 md:py-20">
          <div className="pointer-events-none absolute inset-0" style={dots} />
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-green-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            {user ? (
              <>
                <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                  <LayoutDashboard className="h-7 w-7 text-white" />
                </span>
                <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-5xl">
                  Welcome{name ? `, ${name}` : " back"}!
                </h2>
                <p className="mt-4 text-green-100 md:text-xl/relaxed">
                  Your courses and conversations are waiting. Head to your
                  dashboard now.
                </p>
                <Link
                  to="/home"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-green-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-green-50 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </>
            ) : (
              <>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-green-50 ring-1 ring-white/25 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-lime-300 animate-pulse" />
                  Your classmates are already here
                </span>
                <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-5xl">
                  Join CourseHub Today
                </h2>
                <p className="mt-4 text-green-100 md:text-xl/relaxed">
                  Start collaborating with your classmates and improve your
                  academic performance.
                </p>

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 flex w-full max-w-md flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:rounded-full"
                >
                  <label htmlFor="join-email" className="sr-only">
                    Email address
                  </label>
                  <div className="flex flex-1 items-center gap-2 px-3">
                    <Mail className="h-5 w-5 shrink-0 text-green-600" />
                    <input
                      id="join-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Enter your school email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 font-semibold text-white transition hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 sm:rounded-full"
                  >
                    Sign Up
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>

                <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-green-100">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-lime-300" />
                      {perk}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 text-sm text-green-100/80">
                  Already have an account?{" "}
                  <Link
                    to="/signin"
                    className="font-semibold text-white underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
