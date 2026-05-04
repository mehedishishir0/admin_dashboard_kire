/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Loader2,
  Save,
  Camera,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

const UpdateProfile = () => {
  const session = useSession();
  const queryClient = useQueryClient();
  const userID = session?.data?.user?.id;
  const token = session?.data?.user?.accessToken;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    country: "",
    city: "",
    postalCode: "",
    sector: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user profile data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile-info", userID],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const response = await res.json();
      if (response.statusCode === 200) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch profile");
    },
    enabled: !!token && !!userID,
  });

  // Update profile mutation
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (updatedData: FormData) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${userID}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: updatedData,
        },
      );
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.message || "Failed to update profile");
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["profile-info", userID] });
      setIsEditing(false);
      refetch();
      // Clear avatar preview if uploaded
      if (avatarFile) {
        setAvatarFile(null);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
        }
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  // Populate form data when API data is loaded
  useEffect(() => {
    if (data) {
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        country: data.country || "",
        city: data.city || "",
        postalCode: data.postalCode?.toString() || "",
        sector: data.sector || "",
      });
      if (data.avatar) {
        setAvatarPreview(data.avatar);
      }
    }
  }, [data]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Validate postal code - only numbers allowed
    if (name === "postalCode" && value !== "") {
      // Allow only numbers
      const numbersOnly = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numbersOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image should be less than 2MB");
      return;
    }

    // Clean up previous preview
    if (avatarPreview && !avatarPreview.startsWith("http")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  // Handle form submission
  const handleSubmit = async () => {
    const formDataToSend = new FormData();

    // Append text fields
    formDataToSend.append("fullName", formData.fullName);
    if (formData.phoneNumber)
      formDataToSend.append("phoneNumber", formData.phoneNumber);
    if (formData.country) formDataToSend.append("country", formData.country);
    if (formData.city) formDataToSend.append("city", formData.city);

    // Convert postalCode to number if it exists and is not empty
    if (formData.postalCode && formData.postalCode.trim() !== "") {
      const postalCodeNumber = Number(formData.postalCode);
      if (!isNaN(postalCodeNumber)) {
        formDataToSend.append("postalCode", postalCodeNumber.toString());
      }
    }

    if (formData.sector) formDataToSend.append("sector", formData.sector);

    // Append avatar if changed
    if (avatarFile) {
      formDataToSend.append("avatar", avatarFile);
    }

    updateProfile(formDataToSend);
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm bg-white p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
          <p className="text-gray-500">Loading profile information...</p>
        </div>
      </Card>
    );
  }

  const sectors = [
    { value: "wellness", label: "Wellness" },
    { value: "fitness", label: "Fitness" },
    { value: "beauty", label: "Beauty " },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Role */}
        <div className="lg:col-span-1">
          <Card className="border border-[#F0F5F5] rounded-2xl shadow-sm bg-white p-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              {/* Avatar Container */}
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-4 border-white shadow-lg">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F4F9F9] flex items-center justify-center">
                      <User className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition shadow-lg">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-xl font-semibold text-[#1A2E35]">
                {formData.fullName || "Your Name"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                  {data?.role === "businessowner"
                    ? "Business Owner"
                    : data?.role || "Customer"}
                </div>
                {data?.verified && (
                  <div className="flex items-center text-green-600 text-xs">
                    <CheckCircle2 size={14} className="mr-0.5" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-3">
                Member since {new Date(data?.createdAt).toLocaleDateString()}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 w-full space-y-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isUpdating}
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl"
                    >
                      {isUpdating ? (
                        <Loader2 className="animate-spin w-4 h-4 mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data to original
                        if (data) {
                          setFormData({
                            fullName: data.fullName || "",
                            email: data.email || "",
                            phoneNumber: data.phoneNumber || "",
                            country: data.country || "",
                            city: data.city || "",
                            postalCode: data.postalCode?.toString() || "",
                            sector: data.sector || "",
                          });
                          if (
                            data.avatar &&
                            !avatarPreview?.startsWith("blob")
                          ) {
                            setAvatarPreview(data.avatar);
                          } else if (!data.avatar) {
                            setAvatarPreview(null);
                          }
                          setAvatarFile(null);
                        }
                      }}
                      variant="outline"
                      className="w-full rounded-xl"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Profile Form */}
        <div className="lg:col-span-2">
          <Card className="border border-[#F0F5F5] rounded-2xl shadow-sm bg-white overflow-hidden">
            <div className="p-6 border-b border-[#F0F5F5]">
              <h3 className="text-lg font-semibold text-[#1A2E35]">
                Personal Information
              </h3>
              <p className="text-gray-400 text-sm">
                Update your personal details and contact information
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label className="text-[#1A2E35] font-semibold flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  Full Name
                </Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`bg-[#F4F9F9] border-none h-12 rounded-xl focus-visible:ring-primary ${
                    !isEditing && "opacity-70"
                  }`}
                  placeholder="Your full name"
                />
              </div>

              {/* Email (Disabled) */}
              <div className="space-y-2">
                <Label className="text-[#1A2E35] font-semibold flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  Email Address
                </Label>
                <Input
                  name="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 border-none h-12 rounded-xl cursor-not-allowed opacity-70"
                  placeholder="Your email address"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label className="text-[#1A2E35] font-semibold flex items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Phone Number
                </Label>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`bg-[#F4F9F9] border-none h-12 rounded-xl focus-visible:ring-primary ${
                    !isEditing && "opacity-70"
                  }`}
                  placeholder="+1 234 567 8900"
                />
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <Label className="text-[#1A2E35] font-semibold flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  Location
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Country</Label>
                    <Input
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`bg-[#F4F9F9] border-none h-12 rounded-xl ${
                        !isEditing && "opacity-70"
                      }`}
                      placeholder="Enter your country"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      City & street
                    </Label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`bg-[#F4F9F9] border-none h-12 rounded-xl ${
                        !isEditing && "opacity-70"
                      }`}
                      placeholder="New York"
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Postal Code</Label>
                    <Input
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`bg-[#F4F9F9] border-none h-12 rounded-xl ${
                        !isEditing && "opacity-70"
                      }`}
                      placeholder="10001"
                    />
                  </div>

                  {/* Sector */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600 flex items-center gap-1">
                      <Building2 size={14} />
                      Sector
                    </Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) =>
                        handleSelectChange("sector", value)
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger
                        className={`bg-[#F4F9F9] border-none !h-12 rounded-xl w-full ${
                          !isEditing && "opacity-70"
                        }`}
                      >
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Edit Mode Notice */}
              {!isEditing && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-sm text-blue-700">
                    👋 Click the &quot;Edit Profile&quot; button to update your
                    information
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-700">
                    ✏️ You are in edit mode. Don&apos;t forget to save your
                    changes!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfile;
