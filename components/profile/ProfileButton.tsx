"use client";

import Link from "next/link";
import { useState } from "react";
import { useProfile } from "@/lib/hooks/useProfile";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

// Avatar in the header, linking to the profile page. Google picture if present,
// otherwise honey initials.
export default function ProfileButton() {
  const { data } = useProfile();
  const [broken, setBroken] = useState(false);
  const showImg = data?.avatar && !broken;

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="tap grid size-9 place-items-center overflow-hidden rounded-pill ring-1 ring-edge transition-all hover:ring-accent"
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data!.avatar!}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-full object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center bg-accent/15 text-xs font-semibold text-accent">
          {data ? initials(data.name) : ""}
        </span>
      )}
    </Link>
  );
}
