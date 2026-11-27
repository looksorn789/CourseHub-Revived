import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, BadgeCheck, Calendar as CalendarIcon, GraduationCap, MessageSquare, Pencil, School, Sparkles, Users } from "lucide-react";
import { getUserByUsername } from "../../services/profileService";
import { getFriendshipStatus } from "../../services/friendsService";
import PostService from "../../services/postService";
import { avatarDataUrl } from "../../utils/avatarUtils";
import { openChatWith } from "../../services/chatService";
import PostStream, { PER_PAGE } from "../posts/PostStream";
import FriendButton from "./FriendButton";
import ProfileSkeleton from "./ProfileSkeleton";

function Pill({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function SideCard({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Chips({ items, icon: Icon }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-800"
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {item}
        </span>
      ))}
    </div>
  );
}

const asList = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

/** /profile/:username - anyone's profile, including your own. */
export default function ProfileView() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendship, setFriendship] = useState(null); // { status, request_id, friend_count }
  const [postCount, setPostCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setFriendship(null);
    getUserByUsername(username).then(({ data, error: err }) => {
      if (cancelled) return;
      if (data) setUserData(data);
      else setError(err || "User not found");
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const userId = userData?._id;
  const loadFriendship = useCallback(async () => {
    if (!userId) return;
    const { data } = await getFriendshipStatus(userId);
    if (data) setFriendship(data);
  }, [userId]);
  useEffect(() => {
    loadFriendship();
  }, [loadFriendship]);

  const loadPosts = useCallback(
    async (page) => (await PostService.getUserPosts(userId, page, PER_PAGE)).data,
    [userId],
  );

  if (isLoading) return <ProfileSkeleton />;
  if (error || !userData) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">This profile doesn't exist</p>
        <p className="mt-1 text-sm text-gray-500">@{username} may have changed their username.</p>
      </div>
    );
  }

  const p = userData.profile || {};
  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || userData.username;
  const isSelf = friendship?.status === "self";
  const gradYear = p.graduation_date ? new Date(p.graduation_date).getFullYear() : null;
  const interests = asList(p.interests);
  const awards = asList(p.awards);
  const clubs = asList(p.clubs);
  const certifications = asList(p.certifications);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <img
              src={avatarDataUrl(p.avatar_config, userData.username)}
              alt={name}
              className="h-28 w-28 shrink-0 rounded-full border-4 border-green-500 bg-white sm:h-32 sm:w-32"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{name}</h1>
              <p className="text-gray-500">@{userData.username}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                {p.school && <Pill icon={School}>{p.school}</Pill>}
                {p.major && <Pill icon={GraduationCap}>{p.major}</Pill>}
                {gradYear && <Pill icon={CalendarIcon}>Class of {gradYear}</Pill>}
              </div>
              {p.bio && <p className="mt-4 whitespace-pre-line text-gray-700">{p.bio}</p>}
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                {friendship === null ? (
                  <span className="h-9 w-32 animate-pulse rounded-md bg-gray-100" />
                ) : isSelf ? (
                  <Link
                    to="/settings"
                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                ) : (
                  <>
                    <FriendButton
                      userId={userData._id}
                      name={p.first_name || userData.username}
                      status={friendship.status}
                      requestId={friendship.request_id}
                      onChanged={loadFriendship}
                    />
                    <button
                      type="button"
                      onClick={() => openChatWith(userData._id)}
                      className="inline-flex items-center rounded-md border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Posts */}
          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
            <h2 className="px-6 pt-5 font-semibold text-gray-900">
              Posts{postCount !== null ? ` (${postCount})` : ""}
            </h2>
            {userId && (
              <PostStream
                key={userId}
                cacheKey={`user:${userId}`}
                loadPage={loadPosts}
                onTotal={setPostCount}
                empty={
                  <p className="py-8 text-center text-sm text-gray-500">
                    {isSelf ? "You haven't posted yet." : `${p.first_name || userData.username} hasn't posted yet.`}
                  </p>
                }
              />
            )}
          </section>

          {/* About */}
          <aside className="space-y-6">
            {interests.length > 0 && (
              <SideCard title="Interests">
                <Chips items={interests} />
              </SideCard>
            )}
            {awards.length > 0 && (
              <SideCard title="Awards">
                <Chips items={awards} icon={Award} />
              </SideCard>
            )}
            {clubs.length > 0 && (
              <SideCard title="Clubs">
                <Chips items={clubs} icon={Users} />
              </SideCard>
            )}
            {certifications.length > 0 && (
              <SideCard title="Certifications">
                <Chips items={certifications} icon={BadgeCheck} />
              </SideCard>
            )}
            <SideCard title="Connections">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">{friendship?.friend_count ?? "–"}</span>
                <span className="text-sm text-gray-500">
                  {friendship?.friend_count === 1 ? "Friend" : "Friends"}
                </span>
              </div>
            </SideCard>
            {!interests.length && !awards.length && !clubs.length && !certifications.length && (
              <SideCard title="About">
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" />
                  {isSelf ? "Add interests and awards from Edit." : "Nothing here yet."}
                </p>
              </SideCard>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
