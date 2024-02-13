import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { options } from "./auth-api";
import { db } from "../common/mysql";

export const userSession = async (): Promise<UserModel | null> => {
  const session = await getServerSession(options);
  if (session && session.user) {
    return session.user as UserModel;
  }

  return null;
};

export const userHashedId = async (): Promise<string> => {
  const user = await userSession();
  if (user) {
    return hashValue(user.email);
  }

  throw new Error("User not found");
};

export const IsAdmin = async (email:string|undefined): Promise<boolean> => {

  try {
    let result = await db.query('SELECT count(*) as counted FROM admins WHERE userId = ? AND isDeleted = 0', [email]);
    const data = result[0][0]['counted'] > 0;
    return data
  } catch (err) {
    console.log("Error");
    console.log(err);
    return false
  }
};

export type UserModel = {
  name: string;
  image: string;
  email: string;
};

export const hashValue = (value: string): string => {
  const hash = createHash("sha256");
  hash.update(value);
  return hash.digest("hex");
};
