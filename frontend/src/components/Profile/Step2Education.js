import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Label from "../ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import Calendar from "../ui/Calendar";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import {
  GRAD_FROM_YEAR,
  GRAD_TO_YEAR,
  graduationStatus,
} from "../../utils/graduation";

const API_KEY = process.env.REACT_APP_COLLEGE_SCORECARD_API_KEY;
const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

function Step2Education({
  school,
  setSchool,
  major,
  setMajor,
  graduationDate,
  setGraduationDate,
  gpa,
  setGpa,
}) {
  const [schools, setSchools] = useState([]);
  const [majors, setMajors] = useState([]);
  // Start from the saved values so coming back to this step keeps them.
  const [schoolSearchTerm, setSchoolSearchTerm] = useState(school || "");
  const [majorSearchTerm, setMajorSearchTerm] = useState(major || "");
  const [schoolId, setSchoolId] = useState(null);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isLoadingMajors, setIsLoadingMajors] = useState(false);
  const [majorOpen, setMajorOpen] = useState(false);
  const [activeMajor, setActiveMajor] = useState(0);
  // Only the newest request may update the lists (typing fast can make
  // older responses arrive last).
  const schoolRequest = useRef(0);
  const majorRequest = useRef(0);

  const fetchSchools = useCallback(async (search) => {
    const requestId = ++schoolRequest.current;
    setIsLoadingSchools(true);
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        "school.name": search,
        fields: "id,school.name",
        per_page: "20",
      });
      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      if (requestId !== schoolRequest.current) return;
      setSchools(
        (data.results || []).map((s) => ({ id: s.id, name: s["school.name"] })),
      );
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      if (requestId === schoolRequest.current) setIsLoadingSchools(false);
    }
  }, []);

  // Look up by id when we have it; otherwise (returning to this step) by
  // exact school name.
  const fetchMajors = useCallback(async (id, name) => {
    const requestId = ++majorRequest.current;
    setIsLoadingMajors(true);
    try {
      const params = new URLSearchParams({
        api_key: API_KEY,
        fields: "id,school.name,latest.programs.cip_4_digit.title",
      });
      if (id) params.set("id", id);
      else params.set("school.name", name);
      const response = await fetch(`${BASE_URL}?${params}`);
      const data = await response.json();
      if (requestId !== majorRequest.current) return;

      const results = data?.results || [];
      const match = id
        ? results[0]
        : results.find((r) => r["school.name"] === name) || results[0];
      const programs = match?.["latest.programs.cip_4_digit"] || [];
      const titles = programs
        .map((p) => (p.title || "").trim().replace(/\.$/, ""))
        .filter(Boolean);
      setMajors([...new Set(titles)].sort((a, b) => a.localeCompare(b)));
    } catch (error) {
      console.error("Error fetching majors:", error);
      if (requestId === majorRequest.current) setMajors([]);
    } finally {
      if (requestId === majorRequest.current) setIsLoadingMajors(false);
    }
  }, []);

  useEffect(() => {
    if (schoolSearchTerm && schoolSearchTerm !== school) {
      const delayDebounceFn = setTimeout(() => {
        fetchSchools(schoolSearchTerm);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
    schoolRequest.current++; // ignore any in-flight search
    setSchools([]);
    setIsLoadingSchools(false);
    return undefined;
  }, [schoolSearchTerm, fetchSchools, school]);

  // One place loads majors, whenever the chosen school changes.
  useEffect(() => {
    if (school) {
      fetchMajors(schoolId, school);
    } else {
      majorRequest.current++;
      setMajors([]);
      setIsLoadingMajors(false);
    }
  }, [school, schoolId, fetchMajors]);

  const handleSchoolSelect = (id, name) => {
    setSchoolId(id);
    setSchool(name);
    setSchoolSearchTerm(name);
    setSchools([]);
    // A new school means the old major may not exist there.
    if (name !== school) {
      setMajor("");
      setMajorSearchTerm("");
    }
  };

  const query = majorSearchTerm.trim().toLowerCase();
  const filteredMajors = query
    ? majors.filter((m) => m.toLowerCase().includes(query))
    : majors;
  const exactMajor = majors.some((m) => m.toLowerCase() === query);
  // Let people keep a major the school list doesn't have.
  const majorOptions = [
    ...filteredMajors,
    ...(query && !exactMajor ? [{ custom: majorSearchTerm.trim() }] : []),
  ];

  const handleMajorSelect = (selectedMajor) => {
    setMajor(selectedMajor);
    setMajorSearchTerm(selectedMajor);
    setMajorOpen(false);
  };

  const handleMajorKeyDown = (e) => {
    if (!majorOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setMajorOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveMajor((i) => Math.min(i + 1, majorOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveMajor((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && majorOpen && majorOptions[activeMajor]) {
      e.preventDefault();
      const opt = majorOptions[activeMajor];
      handleMajorSelect(typeof opt === "string" ? opt : opt.custom);
    } else if (e.key === "Escape") {
      setMajorOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Education Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* School Selection */}
          <div>
            <Label
              htmlFor="school"
              className="block text-sm font-medium text-gray-700"
            >
              School
            </Label>
            <div className="relative mt-1">
              <Input
                type="text"
                id="school"
                autoComplete="off"
                placeholder="Start typing to search for your school..."
                value={schoolSearchTerm}
                onChange={(e) => {
                  setSchoolSearchTerm(e.target.value);
                  setSchool("");
                  setSchoolId(null);
                }}
                onBlur={() => setTimeout(() => setSchools([]), 150)}
                className="w-full border-green-200 focus:ring-green-500 focus:border-green-500"
              />
              {isLoadingSchools && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {schools.length > 0 &&
                schoolSearchTerm &&
                schoolSearchTerm !== school && (
                  <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {schools.map((schoolItem) => (
                      <li
                        key={schoolItem.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          handleSchoolSelect(schoolItem.id, schoolItem.name)
                        }
                      >
                        {schoolItem.name}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>

          {/* Major Selection */}
          {school && (
            <div>
              <Label
                htmlFor="major"
                className="block text-sm font-medium text-gray-700"
              >
                Major
              </Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  id="major"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={majorOpen}
                  aria-controls="major-options"
                  placeholder={
                    isLoadingMajors
                      ? "Loading majors..."
                      : "Start typing to search for your major..."
                  }
                  value={majorSearchTerm}
                  onChange={(e) => {
                    setMajorSearchTerm(e.target.value);
                    setMajor("");
                    setMajorOpen(true);
                    setActiveMajor(0);
                  }}
                  onFocus={() => {
                    setMajorOpen(true);
                    setActiveMajor(0);
                  }}
                  onBlur={() => setMajorOpen(false)}
                  onKeyDown={handleMajorKeyDown}
                  className="w-full border-green-200 focus:ring-green-500 focus:border-green-500"
                />
                {isLoadingMajors && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {majorOpen &&
                  !isLoadingMajors &&
                  !(major && majorSearchTerm === major) && (
                  <ul
                    id="major-options"
                    role="listbox"
                    className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                  >
                    {majorOptions.length === 0 ? (
                      <li className="py-2 pl-3 pr-9 text-gray-500">
                        {majors.length
                          ? "Keep typing to search majors"
                          : "No majors listed for this school. Type yours in."}
                      </li>
                    ) : (
                      majorOptions.map((opt, index) => {
                        const label = typeof opt === "string" ? opt : opt.custom;
                        return (
                          <li
                            key={typeof opt === "string" ? opt : "__custom"}
                            role="option"
                            aria-selected={index === activeMajor}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                              index === activeMajor ? "bg-green-50" : ""
                            } hover:bg-green-50`}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setActiveMajor(index)}
                            onClick={() => handleMajorSelect(label)}
                          >
                            {typeof opt === "string" ? (
                              label
                            ) : (
                              <span className="text-green-700">
                                Use "{label}"
                              </span>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Graduation Date Picker */}
          <div>
            <Label
              htmlFor="graduationDate"
              className="block text-sm font-medium text-gray-700"
            >
              Graduation Date{" "}
              <span className="font-normal text-gray-500">
                (graduated or expected)
              </span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal mt-1 border-green-200 ${
                    !graduationDate && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {graduationDate ? (
                    format(graduationDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={graduationDate}
                  onSelect={setGraduationDate}
                  defaultMonth={graduationDate || undefined}
                  captionLayout="dropdown-buttons"
                  fromYear={GRAD_FROM_YEAR}
                  toYear={GRAD_TO_YEAR}
                  initialFocus
                  className="rounded-md border-green-200"
                />
              </PopoverContent>
            </Popover>
            {graduationDate && (
              <p className="mt-1 text-xs text-green-700">
                {graduationStatus(graduationDate)}
              </p>
            )}
          </div>

          {/* GPA Input */}
          <div>
            <Label
              htmlFor="gpa"
              className="block text-sm font-medium text-gray-700"
            >
              GPA (Optional)
            </Label>
            <Input
              type="number"
              id="gpa"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              min="0"
              max="4"
              step="0.01"
              className="mt-1 border-green-200 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Step2Education;
