import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Search, Sparkles } from "lucide-react";
import { MainLayout } from "../components/layout/MainLayout";
import Accordion from "../components/ui/Accordion";

// Answers describe how the app works today; update them with the features.
const FAQ = [
  {
    topic: "Getting started",
    items: [
      {
        q: "How do I create an account?",
        a: "Click Get Started or Sign Up, choose a username, enter your email and a strong password. We email you a 6-digit code; enter it and you're signed in and taken to profile setup.",
      },
      {
        q: "I didn't get my verification code.",
        a: "Check your spam or promotions folder and make sure the email address is spelled correctly. Codes can take a minute to arrive.",
      },
      {
        q: "How do I set up or edit my profile?",
        a: "Right after signing up you'll walk through a short profile setup. Later, open Settings (or Edit on your own profile) to change your name, bio, school, major, graduation date, interests and avatar.",
      },
      {
        q: "I forgot my password.",
        a: "On the Sign In page choose “Forgot your password?”, enter your email, and follow the link we send you to set a new one.",
      },
    ],
  },
  {
    topic: "Channels",
    items: [
      {
        q: "What is a channel and how do I join one?",
        a: "A channel is a space for a course or topic. Find channels on Explore or under Suggested Channels on your dashboard, then press Join. Channels you join appear under My Channels in the sidebar.",
      },
      {
        q: "How do I create a channel?",
        a: "Press Create Channel in the sidebar, add a name, description and category, and optionally an icon and banner. You become the channel's owner.",
      },
      {
        q: "Who can edit a channel?",
        a: "Only the channel's owner. Owners see an Edit Channel button on the channel page to change its name, description, category, rules, icon and banner.",
      },
      {
        q: "What does pinning a channel do?",
        a: "Press Pin on a channel page to keep it on your dashboard under Pinned Channels for quick access. Press Pinned again to unpin it.",
      },
      {
        q: "How do I leave a channel?",
        a: "Press the Joined button on the channel page or its Explore card. Owners can't leave their own channel.",
      },
    ],
  },
  {
    topic: "Posts",
    items: [
      {
        q: "How do I write a post?",
        a: "Open a channel and press Post. Pick Question or Discussion, add a title and your text, and optionally up to 4 photos and some tags.",
      },
      {
        q: "Can I edit or delete my post?",
        a: "Yes. Open the ••• menu on your post and choose Edit Post or Delete Post. Only the author can change a post.",
      },
      {
        q: "How do tags work?",
        a: "Click any tag to see every post with that tag across all channels. Popular Tags on your dashboard shows the most used ones.",
      },
      {
        q: "What shows up in my Home feed?",
        a: "Posts from channels you've joined, posts from your friends, and your own posts, newest first.",
      },
    ],
  },
  {
    topic: "Friends & chat",
    items: [
      {
        q: "How do I add a friend?",
        a: "Open their profile (click their name or picture on a post, or find them with search) and press Add Friend. They can accept from your profile or their Friends page.",
      },
      {
        q: "How do I message someone?",
        a: "Use the chat bubble at the bottom right for quick chats, or the message icon at the top for the full Messages page. You can also press Message on someone's profile. Pick two or more people to start a group chat.",
      },
      {
        q: "Who can read my messages?",
        a: "Only the people in that conversation.",
      },
    ],
  },
  {
    topic: "Sharing",
    items: [
      {
        q: "How do I share a post?",
        a: "Press the share icon on a post. You can copy its link, email it, send it in a CourseHub chat (it shows up as a small post card), or share it to X, Facebook or Instagram.",
      },
      {
        q: "Where does a shared link take people?",
        a: "Straight to the post, opened on its channel page, or on the author's profile if you shared it from there.",
      },
    ],
  },
  {
    topic: "Privacy & account",
    items: [
      {
        q: "Who can see posts in private channels?",
        a: "Only members of that channel. Those posts don't appear in other people's feeds, search or tag pages, and they can only be shared into chats where everyone is a member.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings and choose Delete Account. This can't be undone.",
      },
      {
        q: "Is CourseHub free?",
        a: "Yes, CourseHub is free for students.",
      },
    ],
  },
];

/** Help Center: searchable, collapsible FAQ plus a CourseAI prompt. */
function HelpPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.map((s) => ({
      ...s,
      items: s.items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)),
    })).filter((s) => s.items.length);
  }, [query]);

  return (
    <MainLayout>
      <div className="px-4 py-6 sm:py-10">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <HelpCircle className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Help Center</h1>
          <p className="mt-1 text-sm text-gray-500">Answers to common questions about CourseHub.</p>
        </div>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            aria-label="Search help questions"
            className="h-11 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {sections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
            No questions match “{query}”. Try other words, or ask CourseAI below.
          </p>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <section key={section.topic} className="rounded-2xl border border-gray-100 bg-white px-5 shadow-sm">
                <h2 className="pt-4 text-xs font-semibold uppercase tracking-wide text-green-700">{section.topic}</h2>
                <Accordion.Root type="multiple" className="w-full">
                  {section.items.map((item, i) => (
                    <Accordion.Item
                      key={item.q}
                      value={`${section.topic}-${i}`}
                      className={i === section.items.length - 1 ? "border-b-0" : "border-gray-100"}
                    >
                      <Accordion.Trigger className="text-base font-medium text-gray-900 hover:no-underline hover:text-green-700">
                        {item.q}
                      </Accordion.Trigger>
                      <Accordion.Content className="leading-relaxed text-gray-600">{item.a}</Accordion.Content>
                    </Accordion.Item>
                  ))}
                </Accordion.Root>
              </section>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 text-center text-white shadow-lg">
          <Sparkles className="mx-auto mb-2 h-7 w-7" />
          <p className="text-lg font-semibold">Need more clarification?</p>
          <p className="mt-1 text-sm text-green-100">Ask our CourseAI.</p>
          <button
            type="button"
            onClick={() => navigate("/courseai")}
            className="mt-4 inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ask CourseAI
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default HelpPage;
