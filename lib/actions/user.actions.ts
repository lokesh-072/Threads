"use server";

import { FilterQuery, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Thread from "../models/thread.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function fetchUser(userId: string) {
  // this will return the UserInfo and alongwith  populate community in it
  try {
    connectToDB();

    return await User.findOne({ id: userId }).populate({
      path: "communities", // user ke *this path -->communities* ko populate
      // with Community having this user in them
      model: Community,
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

// their type must be specified bcz we are using typescript here

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
}: Params): Promise<void> {
  /*
  1) async: The function is asynchronous, meaning it returns a Promise.
  2) Promise<void>: Specifies that the function returns a promise that resolves with no value (void),
  indicating that the function is intended to perform actions rather than produce a result. 
  */
  try {
    connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true } // if exist then update else create new one
    );

    if (path === "/profile/edit") {
      revalidatePath(path); // refresh the page (this path)
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // Find all threads authored by the user with the given userId
    const threads = await User.findOne({ id: userId }).populate({
      path: "threads",
      model: Thread,
      populate: [
        {
          path: "community",
          model: Community,
          select: "name id image _id", // Select the "name" and "_id" fields from the "Community" model
        },
        {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id", // Select the "name" and "_id" fields from the "User" model
          },
        },
      ],
    });
    return threads;
  } catch (error) {
    console.error("Error fetching user threads:", error);
    throw error;
  }
}

// Almost similar to Thread (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "", // by default keep it empty
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: FilterQuery<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    // Find all threads created by the user
    const userThreads = await Thread.find({ author: userId });

    // Collect/accumulate all the child thread ids (replies) from the 'children' field of each user thread
    const childThreadIds = userThreads.reduce((acc, userThread) => {
      return acc.concat(userThread.children);
    }, []);

    // Find and return the child threads (replies) excluding the ones created by the same user
    const replies = await Thread.find({
      _id: { $in: childThreadIds },
      author: { $ne: userId }, // Exclude threads authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    // todo - if i don't use this populate , i will get only ID in author  ,
    // todo - but here , i'm using that author id to get 3 things from USERS MODEL
    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
    throw error;
  }
}

export async function sanitizePostData(post: any) {
  return {
    _id: post._id.toString(),
    text: post.text,
    parentId: post.parentId ? post.parentId.toString() : null,
    author: {
      id: post.author.id,
      name: post.author.name,
      image: post.author.image,
      _id: post.author._id.toString(),
    },
    community: post.community
      ? {
          id: post.community.id,
          name: post.community.name,
          image: post.community.image,
        }
      : null,
    likes: post.likes,
    children: post.children.map((child: any) => ({
      author: {
        image: child.author.image,
      },
    })),
    createdAt: post.createdAt, // Ensure date is serialized properly
  };
}

export async function sanitizeThreadData(thread: any) {
  return {
    _id: thread._id.toString(),
    text: thread.text,
    parentId: thread.parentId ? thread.parentId.toString() : null,
    author: {
      id: thread.author.id,
      name: thread.author.name,
      image: thread.author.image,
      _id: thread.author._id.toString(),
    },
    community: thread.community
      ? {
          id: thread.community._id.toString(),
          name: thread.community.name,
          image: thread.community.image,
        }
      : null,
    likes: thread.likes.map((like: any) => like.toString()),
    children: (thread.children || []).map((child: any) => ({
      _id: child._id.toString(),
      text: child.text,
      parentId: child.parentId ? child.parentId.toString() : null,
      author: {
        id: child.author.id,
        name: child.author.name,
        image: child.author.image,
        _id: child.author._id.toString(),
      },
      community: child.community
        ? {
            id: child.community._id.toString(),
            name: child.community.name,
            image: child.community.image,
          }
        : null,
      likes: child.likes.map((like: any) => like.toString()),
      createdAt: child.createdAt,
    })),
    createdAt: thread.createdAt,
  };
}

export async function sanitizeThreadTabData(thread: any) {
  return {
    id: thread._id.toString(),
    // This should be set dynamically when you call this function
    parentId: thread.parentId ? thread.parentId.toString() : null,
    content: thread.text,
    author: {
      id: thread.author.id,
      name: thread.author.name,
      image: thread.author.image,
    },
    community: thread.community
      ? {
          id: thread.community.id,
          name: thread.community.name,
          image: thread.community.image,
        }
      : null,
    createdAt: new Date(thread.createdAt).toISOString(),
    comments: (thread.children || []).map((child: any) => ({
      author: {
        image: child.author.image,
      },
    })),
    initialLikes: thread.likes.map((like: any) => like.toString()),
  };
}
