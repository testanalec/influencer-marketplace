"use client";

import { InfluencerProfile } from "@/types";

interface InfluencerCardProps {
  influencer: InfluencerProfile & { user?: any };
}

export function InfluencerCard({ influencer }: InfluencerCardProps) {
  const totalFollowers =
    (influencer.instagramFollowers || 0) +
    (influencer.youtubeFollowers || 0) +
    (influencer.tiktokFollowers || 0) +
    (influencer.twitterFollowers || 0);

  const platformCount = [
    influencer.instagram,
    influencer.youtube,
    influencer.tiktok,
    influencer.twitter,
  ].filter(Boolean).length;

  return (
    <div className="card hover:shadow-xl transition-shadow">
      <div className="flex flex-col items-center mb-4">
        {influencer.avatar && (
          <img
            src={influencer.avatar}
            alt={influencer.name}
            className="w-24 h-24 rounded-full mb-3 object-cover"
          />
        )}
        <h3 className="text-lg font-bold text-center">{influencer.name}</h3>
        <p className="text-primary-600 font-semibold text-sm">
          {influencer.niche}
        </p>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2 text-center">
        {influencer.bio}
      </p>

      <div className="space-y-3 mb-4 border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Rate per Post</span>
          <span className="font-bold text-primary-600">
            ₹{influencer.ratePerPost.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Total Followers</span>
          <span className="font-bold">{(totalFollowers / 1000).toFixed(0)}K+</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm">Platforms</span>
          <span className="font-bold">{platformCount}</span>
        </div>
      </div>

      {influencer.location && (
        <p className="text-gray-600 text-xs mb-4">📍 {influencer.location}</p>
      )}

      <div className="flex gap-2 flex-wrap justify-center">
        {influencer.instagram && (
          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
            Instagram
          </span>
        )}
        {influencer.youtube && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
            YouTube
          </span>
        )}
        {influencer.tiktok && (
          <span className="text-xs bg-black/10 text-black px-2 py-1 rounded">
            TikTok
          </span>
        )}
        {influencer.twitter && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            Twitter
          </span>
        )}
      </div>
    </div>
  );
}
