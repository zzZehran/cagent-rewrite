"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left - Image */}
      <div className="hidden md:block relative h-full">
        <Image
          src="/signinImage.jpg"
          fill
          alt="Auth"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right - Content */}
      <div className="flex flex-col justify-center items-center px-8 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4">Welcome CAgent</h1>

          <p className="text-gray-500 mb-8">
            Sign in to continue or create a new account.
          </p>

          <div className="flex flex-col gap-4">
            <SignInButton mode="modal">
              <Button className="text-md py-5">Sign in</Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button variant={"outline"} className="text-md py-5">
                Sign up
              </Button>
            </SignUpButton>
          </div>
        </div>
      </div>
    </div>
  );
}
