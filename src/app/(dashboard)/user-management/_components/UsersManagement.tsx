"use client";

import React, { useState, useMemo } from "react";
import { Eye, ChevronRight, X, Check, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  businessId: {
    _id: string;
  } | null;
  verified: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED" | "BLOCKED";
  avatar?: string;
  phoneNumber?: string;
  country?: string;
  city?: string;
  postalCode?: number;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  statusCode: number;
  message: string;
  data: User[];
}

const fetchUsers = async (token: string): Promise<ApiResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
};

const deleteUser = async ({ id, token }: { id: string; token: string }) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/dashboard/users/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
};

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900">Delete User</h2>
        <p className="text-sm text-gray-500 mt-2">
          Are you sure you want to delete this user? This action cannot be
          undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

const updateUserStatus = async ({
  id,
  token,
  status,
}: {
  id: string;
  token: string;
  status: string;
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update user status");
  }

  return response.json();
};

// Stats Skeleton
const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="p-6 rounded-xl border-slate-100 shadow-sm">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-7 w-16" />
      </Card>
    ))}
  </div>
);

// Table Skeleton
const TableSkeleton = () => (
  <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(6)].map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-t">
              {[...Array(6)].map((_, j) => (
                <td key={j} className="px-6 py-4">
                  <Skeleton className="h-4 w-32" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// User Details Modal
const UserDetailsModal = ({
  user,
  isOpen,
  onClose,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen || !user) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-700";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-700";
      case "BLOCKED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.fullName}
                width={1000}
                height={1000}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-600">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h4 className="text-lg font-bold text-gray-900">
                {user.fullName}
              </h4>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span
                className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  user.status,
                )}`}
              >
                {user.status}
              </span>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                User ID
              </label>
              <p className="text-sm text-gray-900 mt-1">{user._id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Role</label>
              <p className="text-sm text-gray-900 mt-1 capitalize">
                {user.role === "businessowner" ? "Business Owner" : user.role}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Verified
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.verified ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Check size={14} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle size={14} /> Not Verified
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Business ID
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.businessId ? user.businessId._id : "No Business"}
              </p>
            </div>
            {user.phoneNumber && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Phone Number
                </label>
                <p className="text-sm text-gray-900 mt-1">{user.phoneNumber}</p>
              </div>
            )}
            {user.country && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Country
                </label>
                <p className="text-sm text-gray-900 mt-1">{user.country}</p>
              </div>
            )}
            {user.city && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  City
                </label>
                <p className="text-sm text-gray-900 mt-1">{user.city}</p>
              </div>
            )}
            {user.sector && (
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Sector
                </label>
                <p className="text-sm text-gray-900 mt-1">{user.sector}</p>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Created At
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function UsersManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const session = useSession();
  const token = session?.data?.user?.accessToken;
  const queryClient = useQueryClient();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers(token as string),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUpdatingStatusId(null);
    },
    onError: () => {
      setUpdatingStatusId(null);
    },
  });

  const users = data?.data ?? [];

  // Calculate stats from actual data
  const calculateStats = useMemo(() => {
    const totalUsers = users.length;
    const businessOwners = users.filter(
      (u) => u.role === "businessowner",
    ).length;
    const activeVendors = users.filter(
      (u) => u.role === "businessowner" && u.status === "ACTIVE",
    ).length;

    return {
      totalUsers,
      businessOwners,
      activeVendors,
    };
  }, [users]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "businessowner":
        return "bg-blue-100 text-blue-700";
      case "customer":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDropdownColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-green-600 border-green-300 focus:ring-green-500";
      case "INACTIVE":
        return "text-yellow-600 border-yellow-300 focus:ring-yellow-500";
      case "SUSPENDED":
        return "text-orange-600 border-orange-300 focus:ring-orange-500";
      case "BLOCKED":
        return "text-red-600 border-red-300 focus:ring-red-500";
      default:
        return "text-gray-600 border-gray-300 focus:ring-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    setUpdatingStatusId(userId);
    updateMutation.mutate({
      id: userId,
      token: token as string,
      status: newStatus,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteModalOpen(false);
      setDeleteUserId(null);
    },
    onError: () => {
      setDeleteModalOpen(false);
      setDeleteUserId(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    setDeleteUserId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteUserId) return;

    deleteMutation.mutate({
      id: deleteUserId,
      token: token as string,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-red-500 mb-4">Failed to load users data</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <UserDetailsModal
        user={selectedUser}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUser(null);
        }}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-gray-600">Users Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-xs text-gray-400 mt-1">
            Review and manage {users.length} users
          </p>
        </div>

        {isLoading ? (
          <>
            <StatsSkeleton />
            <TableSkeleton />
          </>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 rounded-xl border-slate-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {calculateStats.totalUsers}
                </p>
              </Card>
              <Card className="p-6 rounded-xl border-slate-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Business Owners
                </p>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-800">
                    {calculateStats.businessOwners}
                  </p>
                </div>
              </Card>
              <Card className="p-6 rounded-xl border-slate-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-2">
                  Active Vendors
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {calculateStats.activeVendors}
                </p>
              </Card>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                        Join Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr
                        key={user._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.fullName}
                                width={1000}
                                height={1000}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                <span className="text-xs font-semibold text-teal-600">
                                  {user.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {user.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(
                              user.role,
                            )}`}
                          >
                            {user.role === "businessowner"
                              ? "Business Owner"
                              : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.status}
                            onChange={(e) =>
                              handleStatusChange(user._id, e.target.value)
                            }
                            disabled={updatingStatusId === user._id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 transition-colors ${getStatusDropdownColor(
                              user.status,
                            )} ${updatingStatusId === user._id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            {/* <option value="INACTIVE">INACTIVE</option>
                            <option value="SUSPENDED">SUSPENDED</option> */}
                            <option value="BLOCKED">BLOCKED</option>
                          </select>
                          {updatingStatusId === user._id && (
                            <span className="ml-2 text-xs text-gray-400">
                              Updating...
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user._id)}
                              className="text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
