"use client";

import { Eye, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface Business {
  _id: string;
  businessName: string;
  ownerId: {
    fullName: string;
  };
  sector: string;
  city: string;
  createdAt: string;
  status: string;
  totalStaff: number;
}

const deleteBusiness = async ({ id, token }: { id: string; token: string }) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/dashboard/businesses/${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) throw new Error("Failed to delete business");
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
        <h2 className="text-lg font-semibold text-gray-900">Delete Business</h2>
        <p className="text-sm text-gray-500 mt-2">
          Are you sure you want to delete this business? This action cannot be
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

export default function BusinessesManagement() {
  const session = useSession();
  const token = session.data?.user?.accessToken || "";
  const queryClient = useQueryClient();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBusinessId, setDeleteBusinessId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/businesses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch businesses");

      return res.json();
    },
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBusiness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      setDeleteModalOpen(false);
      setDeleteBusinessId(null);
    },
    onError: () => {
      setDeleteModalOpen(false);
      setDeleteBusinessId(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    setDeleteBusinessId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteBusinessId) return;

    deleteMutation.mutate({
      id: deleteBusinessId,
      token,
    });
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong!</p>;

  let businesses: Business[] = [];
  let pagination = {
    total: 0,
    page: 1,
    totalPages: 1,
  };

  if (data?.data?.items && Array.isArray(data.data.items)) {
    businesses = data.data.items;
    if (data.data.meta) {
      pagination = {
        total: data.data.meta.total,
        page: data.data.meta.page,
        totalPages: data.data.meta.totalPages,
      };
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Businesses Management
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Viewing {businesses.length} of {pagination.total} total business
          registrations.
        </p>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[
          {
            l: "Pending",
            v: businesses.filter((b) => b?.status === "pending").length,
          },
          {
            l: "Activated",
            v: businesses.filter((b) => b?.status === "activated").length,
          },
          { l: "Total", v: businesses.length },
        ].map((s, i) => (
          <Card key={i} className="p-6 rounded-xl border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-400 mb-2">{s.l}</p>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {s.v}
            </p>
          </Card>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
        {!businesses.length ? (
          <div className="flex justify-center py-16">No Businesses Yet</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-6">Business Name</TableHead>
                <TableHead className="p-6">Owner</TableHead>
                <TableHead className="p-6">Sector</TableHead>
                <TableHead className="p-6">City</TableHead>
                <TableHead className="p-6">Staff</TableHead>
                <TableHead className="p-6">Created At</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {businesses.map((biz) => (
                <TableRow key={biz._id}>
                  <TableCell className="p-6">{biz.businessName}</TableCell>
                  <TableCell className="p-6">{biz.ownerId.fullName}</TableCell>
                  <TableCell className="p-6">{biz.sector}</TableCell>
                  <TableCell className="p-6">{biz.city}</TableCell>
                  <TableCell className="p-6">{biz.totalStaff}</TableCell>
                  <TableCell className="p-6">
                    {new Date(biz.createdAt).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="p-6">
                    <div className="flex justify-center gap-3">
                      <Link href={`/businesse-management/${biz._id}`}>
                        <button className="text-[#169C9F] hover:bg-[#E8F7F7] p-2 rounded-lg">
                          <Eye size={18} />
                        </button>
                      </Link>

                      <button
                        onClick={() => handleDeleteClick(biz._id)}
                        className="text-[#169C9F] hover:bg-[#E8F7F7] p-2 rounded-lg"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
