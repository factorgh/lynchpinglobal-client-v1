"use client";

import dynamic from "next/dynamic";

// Dynamically import the RegisterForm component, disabling SSR
const RegisterForm = dynamic(() => import("../_components/register_form"), {
  ssr: false,
});

const RegisterPage = () => {
  return <RegisterForm />;
};

export default RegisterPage;
