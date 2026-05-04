"use client";

import { Mail, Phone, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";

// --- TypeScript Interfaces ---
interface GalleryItem {
  url: string;
  publicId: string;
  uploadedAt: string;
}

interface Schedule {
  day: string;
  isAvailable: boolean;
  from: string;
  to: string;
}

interface Service {
  _id: string;
  serviceName: string;
  category: string;
}

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  serviceIds: Service[];
  schedule: Schedule[];
  avatar: {
    url: string;
    publicId: string;
    uploadedAt: string;
  };
}

interface Owner {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: {
    url: string;
    publicId: string;
    uploadedAt: string;
  };
}

interface Business {
  _id: string;
  businessName: string;
  businessEmail: string;
  phoneNumber: string;
  businessCategory: string;
  totalStaff: number;
  status: "activated" | "blocked";
  country: string;
  city: string;
  sector: string;
  gallery: GalleryItem[];
  description: string;
  verification: string;
  openingHours: Schedule[];
  ownerId: Owner;
  staff: Staff[];
}

// --- Main Component ---
export default function BusinessDetails() {
  const params = useParams();
  const session = useSession();
  const queryClient = useQueryClient();
  const token = session.data?.user?.accessToken || "";

  const { data, isLoading, error } = useQuery<{ data: Business }, Error>({
    queryKey: ["single-business", params.id],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${params.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch business");
      return res.json();
    },
  });

  const business = data?.data;
  const [isToggling, setIsToggling] = useState(false);

  // --- Toggle Status Handler ---
  const handleToggleStatus = async () => {
    if (!business) return;
    setIsToggling(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses/${business._id}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed to toggle business status");

      const updatedBusiness = await res.json();
      queryClient.setQueryData(["single-business", params.id], {
        data: updatedBusiness.data,
      });
    } catch (err) {
      console.error(err);
      alert("Error toggling business status");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Error loading business</p>;

  return (
    <div className="min-h-screen font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#0D3B3F]">
            Business Details
          </h1>
        </div>

        <Button
          onClick={handleToggleStatus}
          disabled={isToggling}
          variant={business?.status === "activated" ? "outline" : "destructive"}
          className={`font-bold px-8 h-10 rounded-xl ${
            business?.status === "activated"
              ? "border-[#169C9F] text-[#169C9F]"
              : ""
          }`}
        >
          {isToggling
            ? "Processing..."
            : business?.status === "activated"
              ? "Block"
              : "Activate"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 rounded-[24px] border-slate-100 shadow-sm bg-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              General Information
            </h2>

            <div className="grid grid-cols-2 gap-y-6 mb-8">
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  Business Name
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {business?.businessName}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  Business Category
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {business?.businessCategory}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  Phone Number
                </p>
                <p className="text-sm font-semibold text-slate-700 font-mono">
                  {business?.phoneNumber}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 mb-1">
                  Location
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {business?.city}, {business?.country}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800">
                Business Description
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 font-medium">
                {business?.description}
              </p>
            </div>
          </Card>

          {/* Gallery */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-xl font-bold text-slate-800 font-serif">
                Photo Preview
              </h2>
              <p className="text-xs font-bold text-slate-400">
                {business?.gallery?.length || 0} images uploaded
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {business?.gallery?.map((img, index) => (
                <div
                  key={index}
                  className={`relative rounded-[16px] overflow-hidden ${
                    index === 0 ? "col-span-2 row-span-2" : ""
                  }`}
                >
                  <Image
                    width={index === 0 ? 600 : 200}
                    height={index === 0 ? 400 : 200}
                    src={img.url}
                    alt={`Business image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 0 && (
                    <Badge className="absolute top-4 left-4 bg-[#169C9F] text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md">
                      Cover
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <Card className="p-8 rounded-[24px] border-slate-100 shadow-sm bg-white">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Contact Point
            </h2>

            <div className="flex items-center gap-4 mb-8">
              <Avatar className="w-14 h-14 ring-2 ring-slate-50">
                <AvatarImage
                  src={
                    business?.ownerId?.avatar?.url || "/api/placeholder/60/60"
                  }
                />
                <AvatarFallback>
                  {business?.ownerId?.fullName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-tight">
                  {business?.ownerId?.fullName}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  {business?.ownerId?.role}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-300 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {business?.ownerId?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-300 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-slate-600">
                    {business?.phoneNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-300 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Location
                  </p>
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed">
                    {business?.city}, {business?.country}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
