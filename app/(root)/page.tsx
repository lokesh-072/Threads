import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import ThreadCard from "@/components/cards/ThreadCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts } from "@/lib/actions/thread.actions";
import { fetchUser, sanitizePostData } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchPosts(
    searchParams.page ? +searchParams.page : 1,
    30
  );
  // console.log(`${user.id} and ${userInfo.id}`); both are same
  // working fine

  const sanitizedPosts = await Promise.all(result.posts.map(sanitizePostData));

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {sanitizedPosts.length === 0 ? (
          <p className="no-result">No threads found</p>
        ) : (
          <>
            {sanitizedPosts.map((post) => {
              return (
                <ThreadCard
                  key={post._id}
                  id={post._id}
                  currentUserId={user.id}
                  parentId={post.parentId}
                  content={post.text}
                  author={post.author}
                  community={post.community}
                  createdAt={post.createdAt}
                  comments={post.children}
                  initialLikes={post.likes}
                />
              );
            })}
          </>
        )}
      </section>

      <Pagination
        path="/" // current path is home page
        pageNumber={searchParams?.page ? +searchParams.page : 1}
        isNext={result.isNext}
      />
    </>
  );
}

export default Home;
