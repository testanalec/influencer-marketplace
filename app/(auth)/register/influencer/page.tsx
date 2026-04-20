"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function InfluencerRegisterPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const isGoogle = searchParams.get("google") === "true";
    const router = useRouter();

  const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        phone: "",
        bio: "",
        niche: "",
        instagram: "",
        youtube: "",
        tiktok: "",
        instagramFollowers: "",
        youtubeFollowers: "",
        tiktokFollowers: "",
        ratePerPost: "",
  });

  const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

  useEffect(() => {
        if (isGoogle && session?.user) {
                setFormData((prev) => ({
                          ...prev,
                          email: session.user.email || "",
                          name: session.user.name || "",
                }));
        }
  }, [isGoogle, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
        if (step === 1) {
                if (!formData.name || !formData.email) {
                          setError("Name and email are required.");
                          return;
                }
                if (!isGoogle && (!formData.password || formData.password !== formData.confirmPassword)) {
                          setError("Passwords do not match.");
                          return;
                }
        }
        setError("");
        setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
                const body: Record<string, string> = {
                          email: formData.email,
                          name: formData.name,
                          phone: formData.phone,
                          bio: formData.bio,
                          niche: formData.niche,
                          instagram: formData.instagram,
                          youtube: formData.youtube,
                          tiktok: formData.tiktok,
                          instagramFollowers: formData.instagramFollowers,
                          youtubeFollowers: formData.youtubeFollowers,
                          tiktokFollowers: formData.tiktokFollowers,
                          ratePerPost: formData.ratePerPost,
                          role: "INFLUENCER",
                };

          if (!isGoogle) {
                    body.password = formData.password;
          } else {
                    body.googleSignIn = "true";
          }

          const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
             
