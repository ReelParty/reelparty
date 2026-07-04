import type { Metadata } from "next";
import { headers } from "next/headers";
import { JoinNameScreen } from "@reelparty/app";
import { repo, inviteMeta } from "@reelparty/api/server";

export const dynamic = "force-dynamic";

async function baseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "reelparty.app";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const ctx = await repo.partyInviteContext(code).catch(() => null);
  const base = await baseUrl();

  if (!ctx) {
    return {
      title: `Join the ReelParty · ${code}`,
      description: "Watch TikToks, Reels, Facebook & Shorts together",
    };
  }

  const meta = inviteMeta({ ...ctx, baseUrl: base });
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.pageUrl,
      images: [{ url: meta.imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [meta.imageUrl],
    },
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinNameScreen code={code} />;
}
