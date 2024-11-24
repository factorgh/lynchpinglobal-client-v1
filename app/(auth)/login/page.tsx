"use client";
import dynamic from "next/dynamic";

// Dynamically import the LoginForm component, disabling SSR
const LoginForm = dynamic(() => import("../_components/login_form"), {
  ssr: false,
});

const LoginPage = () => {
  return <LoginForm />;
};

export default LoginPage;
