"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { formatDateString } from "@/lib/utils";
import DeleteThread from "../forms/DeleteThread";
import { likePost } from "@/lib/actions/thread.actions";

interface Props {
  id: string;
  currentUserId: string;
  parentId: string | null;
  content: string;
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
  comments?: {
    author: {
      image: string;
    };
  }[];
  isComment?: boolean;
  // todo -
  initialLikes: string[];
}

function ThreadCard({
  id,
  currentUserId, // current user ki .id h jo string h
  parentId,
  content,
  author,
  community,
  createdAt,
  comments = [],
  isComment,
  initialLikes,
}: Props) {
  // useEffect(() => {
  //   console.log("ThreadCard mounted with props:");
  //   console.log("id:", id);
  //   console.log("currentUserId:", currentUserId);
  //   console.log("parentId:", parentId);
  //   console.log("content:", content);
  //   console.log("author:", author);
  //   console.log("community:", community);
  //   console.log("createdAt:", createdAt);
  //   console.log("comments:", comments);
  //   console.log("initialLikes:", initialLikes);
  // }, []);
  console.log(`thread card here `);

  const [likes, setLikes] = useState(initialLikes.length);
  const [likedByUser, setLikedByUser] = useState(
    initialLikes.includes(currentUserId)
  );

  const likesCount = async () => {
    try {
      const updatedLikesCount = await likePost(id, currentUserId);
      setLikes(updatedLikesCount);
      setLikedByUser((prevLiked) => !prevLiked);
    } catch (error) {
      console.error("Error liking the thread:", error);
    }
  };
  return (
    <article
      className={`flex w-full flex-col rounded-xl ${
        isComment ? "px-0 xs:px-7" : "bg-dark-2 p-7"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center">
            <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
              <Image
                src={author.image}
                alt="user_community_image"
                fill
                className="cursor-pointer rounded-full"
              />
            </Link>

            <div className="thread-card_bar" />
          </div>

          <div className="flex w-full flex-col">
            <Link href={`/profile/${author.id}`} className="w-fit">
              <h4 className="cursor-pointer text-base-semibold text-light-1">
                {author.name}
              </h4>
            </Link>

            <p className="mt-2 text-small-regular text-light-2">{content}</p>

            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className="flex justify-centre  gap-3.5">
                <div
                  onClick={likesCount}
                  className="flex gap-2 justify-center "
                >
                  <Image
                    src={
                      likedByUser
                        ? "/assets/heart-filled.svg"
                        : "/assets/heart-gray.svg"
                    }
                    alt="heart"
                    width={24}
                    height={24}
                    className="object-contain cursor-pointer"
                  />
                  <span className="text-subtle-medium text-gray-1 mt-1">
                    {likes}
                  </span>
                </div>
                <Link href={`/thread/${id}`}>
                  <Image
                    src="/assets/reply.svg"
                    alt="heart"
                    width={24}
                    height={24}
                    className="cursor-pointer object-contain"
                  />
                </Link>
                <Image
                  src="/assets/repost.svg"
                  alt="repost"
                  width={24}
                  height={24}
                  className=" object-contain" // cursor-pointer
                />
                <Image
                  src="/assets/share.svg"
                  alt="share"
                  width={24}
                  height={24}
                  className=" object-contain" // cursor-pointer
                />

                {/* // todo - timestamp create  */}
                <p className="text-subtle-medium text-gray-1 mt-1">
                  {formatDateString(createdAt)}
                </p>
              </div>

              {isComment &&
                comments.length > 0 && ( // if comment h toh don't show dp of those who commented on it
                  <Link href={`/thread/${id}`}>
                    <p className="mt-1 text-subtle-medium text-gray-1">
                      {comments.length} repl{comments.length > 1 ? "ies" : "y"}
                    </p>
                  </Link>
                )}
            </div>
          </div>
        </div>

        <DeleteThread // maybe is function m vo lga rakha h ki show this option to user only
          threadId={JSON.stringify(id)}
          currentUserId={currentUserId}
          authorId={author.id}
          parentId={parentId}
          isComment={isComment}
        />
      </div>
      {/* if not a comment , toh jin logo ne is pr comment kr rakha unme se phle 2-3 ki Dp show  */}
      {!isComment && comments.length > 0 && (
        <div className="ml-1 mt-3 flex items-center gap-2">
          {comments.slice(0, 2).map((comment, index) => (
            <Image
              key={index}
              src={comment.author.image}
              alt={`user_${index}`}
              width={24}
              height={24}
              className={`${index !== 0 && "-ml-5"} rounded-full object-cover`}
            />
          ))}

          <Link href={`/thread/${id}`}>
            <p className="mt-1 text-subtle-medium text-gray-1">
              {comments.length} repl{comments.length > 1 ? "ies" : "y"}
            </p>
          </Link>
        </div>
      )}

      {/*  if thread is not a comment and thread is in community */}
      {!isComment && community && (
        <Link
          href={`/communities/${community.id}`}
          className="mt-5 flex items-center"
        >
          <p className="text-subtle-medium text-gray-1">
            {formatDateString(createdAt)}
            {community && ` - ${community.name} Community`}
          </p>

          <Image
            src={community.image}
            alt={community.name}
            width={14}
            height={14}
            className="ml-1 rounded-full object-cover"
          />
        </Link>
      )}
    </article>
  );
}

export default ThreadCard;
