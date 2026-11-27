import { useNavigate } from "react-router-dom";
import { HelpCircle, Sparkles } from "lucide-react";
import { MainLayout } from "../components/layout/MainLayout";

/** Placeholder until the CourseAI assistant is built. */
function CourseAIPage() {
  const navigate = useNavigate();
  return (
    <MainLayout>
      <div className="px-4 py-16 text-center sm:py-24">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg">
          <Sparkles className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">CourseAI</h1>
        <p className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          Coming soon
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-gray-500">
          CourseAI will answer your questions about CourseHub and help you study. We're still building it.
        </p>
        <button
          type="button"
          onClick={() => navigate("/help")}
          className="mt-6 inline-flex items-center rounded-full border border-green-600 px-5 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Browse the Help Center
        </button>
      </div>
    </MainLayout>
  );
}

export default CourseAIPage;
