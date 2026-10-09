"use server";

import connectDB from "@/lib/db";
import User from "@/server/features/auth/models/user.model.js";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const signToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: (process.env.JWT_EXPIRES_IN || "90d") as any,
  });
};

export async function loginAction(credentials: { email?: string; password?: string }) {
  try {
    await connectDB();
    const { email, password } = credentials;

    if (!email || !password) {
      return { success: false, error: "Please provide email and password" };
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return { success: false, error: "Incorrect email or password" };
    }

    const token = signToken(user._id);

    const cookieStore = await cookies();
    cookieStore.set("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
    });

    user.password = undefined;

    return {
      success: true,
      token,
      data: { user: JSON.parse(JSON.stringify(user)) },
    };
  } catch (error: any) {
    console.error("loginAction error:", error);
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function signupAction(userData: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
  role?: string;
}) {
  try {
    await connectDB();

    const newUser = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      passwordConfirm: userData.passwordConfirm,
      phone: userData.phone,
      role: userData.role || "user",
    });

    const token = signToken(newUser._id);

    const cookieStore = await cookies();
    cookieStore.set("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
    });

    newUser.password = undefined;

    return {
      success: true,
      token,
      data: { user: JSON.parse(JSON.stringify(newUser)) },
    };
  } catch (error: any) {
    console.error("signupAction error:", error);
    return { success: false, error: error.message || "Signup failed" };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("jwt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
