import { redirect } from "next/navigation";

import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import {
  fetchUserPosts,
  fetchUser,
  sanitizeThreadTabData,
} from "@/lib/actions/user.actions";

import ThreadCard from "../cards/ThreadCard";

interface Result {
  name: string;
  image: string;
  id: string;
  threads: {
    _id: string;
    text: string;
    parentId: string | null;
    author: {
      name: string;
      image: string;
      id: string;
    };
    community: {
      id: string;
      name: string;
      image: string;
    } | null;
    createdAt: string;
    children: {
      author: {
        image: string;
      };
    }[];
    likes: string[];
  }[];
}

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

async function ThreadsTab({ currentUserId, accountId, accountType }: Props) {
  let result: Result;
  console.log(`threads tab here `);

  const userInfo = await fetchUser(currentUserId);
  if (!userInfo?.onboarded) redirect("/onboarding");
  if (accountType === "Community") {
    result = await fetchCommunityPosts(accountId);
  } else {
    result = await fetchUserPosts(accountId);
  }

  if (!result) {
    redirect("/");
  }

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.threads.map(async (posts) => {
        const thread = await sanitizeThreadTabData(posts);
        return (
          <ThreadCard
            key={thread.id}
            id={thread.id}
            currentUserId={currentUserId}
            parentId={thread.parentId}
            content={thread.content}
            author={
              accountType === "User"
                ? { name: result.name, image: result.image, id: result.id }
                : {
                    name: thread.author.name,
                    image: thread.author.image,
                    id: thread.author.id,
                  }
            }
            community={
              accountType === "Community"
                ? { name: result.name, id: result.id, image: result.image }
                : thread.community
            }
            createdAt={thread.createdAt}
            comments={thread.comments}
            initialLikes={thread.initialLikes}
          />
        );
      })}
    </section>
  );
}

export default ThreadsTab;
