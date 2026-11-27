import React from "react";

// Handwritten "marker" font, loaded in public/index.html
const marker = { fontFamily: "'Caveat', 'Comic Sans MS', cursive" };

// Off-white board with a faint green tint, a light grid,
// and soft smudges where old notes were erased.
const boardSurface = {
  backgroundColor: "#f7fbf8",
  backgroundImage: [
    "radial-gradient(ellipse at 18% 28%, rgba(22, 163, 74, 0.07), transparent 45%)",
    "radial-gradient(ellipse at 82% 75%, rgba(21, 128, 61, 0.06), transparent 40%)",
    "radial-gradient(ellipse at 60% 10%, rgba(100, 116, 139, 0.05), transparent 35%)",
    "linear-gradient(rgba(21, 128, 61, 0.06) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(21, 128, 61, 0.06) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "auto, auto, auto, 32px 32px, 32px 32px",
};

// Diagonal glare so the board reads as glossy.
const glare = {
  backgroundImage:
    "linear-gradient(115deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.45) 74%, rgba(255,255,255,0) 86%)",
};

const checklist = [
  "Ask questions without feeling judged",
  "Share notes, tips & study guides",
  "Find classmates in every course",
];

function Magnet({ className = "" }) {
  return (
    <span
      className={`absolute -top-2 left-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-green-700 shadow-md ring-2 ring-green-900/20 ${className}`}
    >
      <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-white/60" />
    </span>
  );
}

function StickyNote({ color, rotate, children }) {
  return (
    <div
      className={`relative ${color} ${rotate} p-5 pt-7 shadow-lg shadow-green-900/15 transition-transform duration-300 hover:rotate-0 hover:scale-105`}
    >
      <Magnet />
      {children}
    </div>
  );
}

function MarkerCheck() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-7 w-7 shrink-0 text-green-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 17 C 8 19, 11 23, 13 26 C 17 17, 22 10, 28 5" />
    </svg>
  );
}

export default function AboutWhiteboard() {
  return (
    <section
      id="about-section"
      className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-green-50/60 dark:from-gray-900 dark:to-green-950"
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Frame */}
        <div className="relative mx-auto max-w-5xl rounded-2xl bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 p-2.5 shadow-2xl shadow-green-900/20">
          {/* Corner caps */}
          {[
            "-left-1 -top-1",
            "-right-1 -top-1",
            "-left-1 -bottom-1",
            "-right-1 -bottom-1",
          ].map((pos) => (
            <span
              key={pos}
              className={`absolute ${pos} h-5 w-5 rounded-md bg-green-800 shadow`}
            />
          ))}

          {/* Board surface */}
          <div
            className="relative overflow-hidden rounded-lg px-6 py-10 md:px-12 md:py-14 shadow-inner"
            style={boardSurface}
          >
            <div className="pointer-events-none absolute inset-0" style={glare} />

            <div className="relative">
              {/* Title */}
              <div className="mb-10 inline-block">
                <h2
                  className="text-5xl md:text-6xl font-bold text-green-800 -rotate-1"
                  style={marker}
                >
                  About CourseHub
                </h2>
                <svg
                  viewBox="0 0 300 16"
                  preserveAspectRatio="none"
                  className="mt-1 h-3 w-full text-green-500"
                  aria-hidden="true"
                >
                  <path
                    d="M2 10 C 50 3, 90 14, 140 8 S 240 2, 298 9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="grid gap-10 md:grid-cols-5">
                {/* Left: story + checklist */}
                <div className="md:col-span-3 space-y-8">
                  <p
                    className="text-2xl md:text-3xl leading-snug text-gray-700"
                    style={marker}
                  >
                    CourseHub started with a simple idea:{" "}
                    <span className="relative inline-block text-green-700">
                      nobody should get stuck alone
                      <svg
                        viewBox="0 0 200 60"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1.5rem)] text-green-500/70"
                        aria-hidden="true"
                      >
                        <path
                          d="M10 32 C 8 10, 60 4, 110 6 C 170 8, 196 18, 192 34 C 188 52, 120 58, 70 55 C 25 52, 6 44, 14 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>{" "}
                    on a problem set at 2am. Every course has a room full of
                    people working on the same thing, so let's put them in one
                    place.
                  </p>

                  <div>
                    <h3
                      className="mb-3 text-3xl font-bold text-green-800"
                      style={marker}
                    >
                      What we're about:
                    </h3>
                    <ul className="space-y-2">
                      {checklist.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-3 text-2xl text-gray-700"
                          style={marker}
                        >
                          <MarkerCheck />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Marker "equation" */}
                  <div
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl md:text-3xl text-gray-600"
                    style={marker}
                  >
                    <span>questions</span>
                    <span className="text-green-600 font-bold">+</span>
                    <span>classmates</span>
                    <span className="text-green-600 font-bold">=</span>
                    <span className="rounded-md border-2 border-dashed border-green-600 px-2 text-green-700 font-bold">
                      understanding
                    </span>
                  </div>
                </div>

                {/* Right: sticky notes */}
                <div className="relative md:col-span-2 flex flex-col gap-8 sm:flex-row md:flex-col sm:justify-center md:pl-6">
                  {/* Hand-drawn arrow toward the notes */}
                  <svg
                    viewBox="0 0 120 80"
                    className="absolute -left-16 top-6 hidden h-20 w-28 text-green-600 lg:block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 60 C 30 20, 70 14, 108 30" />
                    <path d="M92 18 L 109 30 L 90 40" />
                  </svg>

                  <StickyNote color="bg-green-200" rotate="rotate-2">
                    <p
                      className="text-2xl font-bold text-green-900"
                      style={marker}
                    >
                      Built by students,
                      <br />
                      for students.
                    </p>
                  </StickyNote>

                  <StickyNote color="bg-lime-100" rotate="-rotate-2">
                    <p className="text-2xl text-green-900" style={marker}>
                      <span className="font-bold">Our goal:</span> make every
                      class feel like a study group.
                    </p>
                  </StickyNote>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marker tray */}
        <div className="relative mx-auto -mt-1 h-4 w-3/4 max-w-3xl rounded-b-lg bg-gradient-to-b from-gray-300 to-gray-400 shadow-md">
          <div className="absolute -top-2 left-8 flex items-end gap-3">
            <span className="block h-3 w-16 rounded-full bg-green-700 shadow">
              <span className="block h-3 w-5 rounded-l-full bg-green-900" />
            </span>
            <span className="block h-3 w-16 rounded-full bg-gray-800 shadow">
              <span className="block h-3 w-5 rounded-l-full bg-black" />
            </span>
          </div>
          <span className="absolute -top-3 right-10 block h-4 w-14 rounded-sm bg-gray-700 shadow">
            <span className="absolute bottom-0 h-1.5 w-full rounded-b-sm bg-gray-200" />
          </span>
        </div>
      </div>
    </section>
  );
}
