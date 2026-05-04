"use client";

import React, { useState } from "react";
import { Eye, Trash2, X, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Review {
  _id: string;
  userId: { _id: string; email: string };
  businessId: { _id: string; businessName: string };
  serviceId: { _id: string; serviceName: string };
  rating: number;
  review: string;
  createdAt: string;
}

interface ApiResponse {
  data: {
    data: Review[];
  };
}

// --- API Functions ---
const fetchReviews = async (token: string): Promise<ApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
};

const deleteReview = async ({ id, token }: { id: string; token: string }) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/${id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to delete review");
  return res.json();
};

// --- Sub-Components ---
const ReviewDetailsModal = ({
  review,
  isOpen,
  onClose,
}: {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Review Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < review.rating ? "#f59e0b" : "none"}
                className={
                  i < review.rating ? "text-yellow-500" : "text-gray-300"
                }
              />
            ))}
            <span className="ml-2 font-bold text-gray-700">
              {review.rating}/5
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Customer
              </label>
              <p className="text-sm text-gray-900">{review.userId.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">
                Business & Service
              </label>
              <p className="text-sm text-gray-900">
                {review.businessId.businessName} -{" "}
                {review.serviceId.serviceName}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Review Content
              </label>
              <p className="text-sm text-gray-700 mt-2 italic leading-relaxed">
                {review.review}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border rounded-lg text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReviewsManagement() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const session = useSession();
  const token = session?.data?.user?.accessToken;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => fetchReviews(token as string),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted successfully");
      setDeleteConfirmOpen(false);
    },
    onError: () => toast.error("Failed to delete review"),
  });

  const reviews = data?.data?.data ?? [];

  return (
    <div className="min-h-screen ">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
        <p className="text-xs text-gray-400 mt-1">
          Manage and moderate customer feedback
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Business
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Comment
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.userId.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.businessId.businessName}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                        <Star size={14} fill="currentColor" /> {item.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                      {item.review}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedReview(item);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setIdToDelete(item._id);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReviewDetailsModal
        isOpen={viewModalOpen}
        review={selectedReview}
        onClose={() => setViewModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Confirm Delete
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure? This review will be removed forever.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteMutation.mutate({
                    id: idToDelete!,
                    token: token as string,
                  })
                }
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
