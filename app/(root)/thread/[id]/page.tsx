import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Comment from "@/components/forms/Comment";
import ThreadCard from "@/components/cards/ThreadCard";

import { fetchUser, sanitizeThreadData } from "@/lib/actions/user.actions";
import { fetchThreadById } from "@/lib/actions/thread.actions";

export const revalidate = 0;

async function page({ params }: { params: { id: string } }) {
  if (!params.id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const thread = await fetchThreadById(params.id);
  const sanitizedThread = await sanitizeThreadData(thread);

  // console.log(thread);

  return (
    <section className="relative">
      <div>
        <ThreadCard
          key={sanitizedThread._id}
          id={sanitizedThread._id}
          currentUserId={user.id}
          parentId={sanitizedThread.parentId}
          content={sanitizedThread.text}
          author={sanitizedThread.author}
          community={sanitizedThread.community}
          createdAt={sanitizedThread.createdAt}
          comments={sanitizedThread.children}
          initialLikes={sanitizedThread.likes}
        />
      </div>

      {/* for reply/comment to thread*/}
      <div className="mt-7">
        <Comment
          threadId={params.id}
          currentUserImg={userInfo.image}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {sanitizedThread.children.map((childItem: any) => (
          <ThreadCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user.id}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            isComment
            initialLikes={childItem.likes}
          />
        ))}
      </div>
    </section>
  );
}

export default page;
