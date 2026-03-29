import type { Metadata } from "next";
import SignInForm from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; message?: string }>;
}) {
  const { callbackUrl, error, message } = await searchParams;
  return <SignInForm callbackUrl={callbackUrl} error={error} message={message} />;
}
