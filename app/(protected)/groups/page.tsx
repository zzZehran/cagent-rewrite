"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Pencil, Plus, Tags, Trash2, Users, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import z from "zod";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Id } from "@/convex/_generated/dataModel";

const PALETTE = [
  "from-emerald-500 to-teal-500",
  "from-blue-500 to-indigo-500",
  "from-violet-500 to-purple-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-cyan-500 to-sky-500",
];

type Group = {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  businessId: Id<"business">;
};

export default function page() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>();

  const business = useQuery(
    api.business.getBusinessByOwnerId,
    isLoaded && isSignedIn && user ? { ownerId: user.id } : "skip",
  );

  const groups = useQuery(
    api.groups.listByBusiness,
    business ? { businessId: business._id } : "skip",
  );

  const createGroup = useMutation(api.groups.createCustomerGroup);
  const updateGroup = useMutation(api.groups.updateGroup);
  const deletGroup = useMutation(api.groups.deleteGroup);

  useEffect(() => {
    if (business === null) {
      return router.push("/");
    }
  }, [router, business]);

  // Loader
  if (business === undefined) {
    return (
      <div
        className="
          flex
          h-screen
          justify-center items-center
        "
      >
        <div
          className="
            w-8 h-8
            rounded-full border-4 border-indigo-600 border-t-indigo-300
            animate-spin
          "
        ></div>
      </div>
    );
  }

  if (business === null) return null;

  const formSchema = z.object({
    name: z.string().min(1, "Name cannot be blank"),
  });

  async function handleSubmit(
    formData: FormData,
    editing?: boolean,
    groupId?: Id<"groups">,
  ) {
    if (!business) return;
    const name = formData.get("name")!.toString();
    if (!editing) {
      try {
        setFormError("");
        formSchema.parse({ name });
        await createGroup({ businessId: business._id, groupName: name });
        toast.success("Group created successfully");
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          setFormError(error.issues[0].message);
        } else {
          toast.error(error.data);
        }
      }
      setDialogOpen(false);
      
    } else if (editing) {
      if (!groupId) return;

      try {
        setFormError("");
        formSchema.parse({ name });
        await updateGroup({ groupId: groupId, groupName: name });
        toast.success("Group upated successfully");
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          setFormError(error.issues[0].message);
        } else {
          toast.error(error.data);
        }
      }

      setEditingGroup(null);
      setDialogOpen(false);
    }
  }

  return (
    <div
      className="
        min-h-full
      "
    >
      {/* Sticky Header */}
      <div
        className="
          z-10
          bg-white/80
          border-b border-gray-100
          backdrop-blur-md sticky top-0
        "
      >
        <div
          className="
            flex
            max-w-5xl
            mx-auto px-6 py-4
            items-center gap-4
          "
        >
          <div
            className="
              flex flex-1
              items-center gap-2
            "
          >
            <div
              className="
                flex
                w-8 h-8
                text-emerald-600
                bg-emerald-50
                rounded-xl
                items-center justify-center
              "
            >
              <Tags size={16} />
            </div>
            <h1
              className="
                text-lg font-bold text-gray-900
              "
            >
              Customer Groups
            </h1>
            {groups && (
              <span
                className="
                  ml-1 px-2 py-0.5
                  text-gray-500 text-xs font-medium
                  bg-gray-100
                  rounded-full
                "
              >
                {groups.length}
              </span>
            )}
          </div>

          <Button
            onClick={() => {
              setDialogOpen(true);
            }}
            className="
                  flex
                  px-4 py-2
                  text-white text-sm font-semibold
                  bg-emerald-600
                  rounded-xl
                  shadow-sm shadow-emerald-200
                  items-center gap-2 hover:bg-emerald-700 transition
                "
          >
            <Plus size={16} />
            New Group
          </Button>
        </div>
      </div>

      {/* Content */}

      {groups && groups.length === 0 && (
        <div
          className="
            py-20
            text-center
          "
        >
          <div
            className="
              flex
              w-16 h-16
              mx-auto mb-4
              bg-gray-100
              rounded-2xl
              items-center justify-center
            "
          >
            <Tags
              size={28}
              className="
                text-gray-400
              "
            />
          </div>
          <p
            className="
              text-gray-500 font-medium
            "
          >
            "No groups yet. Create your first one!"
          </p>
        </div>
      )}

      {groups && (
        <div
          className="
            max-w-5xl
            mx-auto px-6 py-8
          "
        >
          <div
            className="
              grid grid-cols-1
              gap-4
              sm:grid-cols-2
              md:grid-cols-3
            "
          >
            {groups.map((group, i) => (
              <div
                key={group._id}
                className="
                  px-5 py-4
                  bg-white
                  rounded-2xl border border-gray-100
                  shadow-sm transition-all
                  hover:border-emerald-100 hover:shadow-md
                "
              >
                <div
                  className="
                    flex
                    items-center justify-between gap-4
                  "
                >
                  {/* Left */}
                  <div
                    className="
                      flex flex-1
                      min-w-0
                      items-center gap-4
                    "
                  >
                    <div
                      className={`
                        flex
                        w-12 h-12
                        text-white font-bold text-lg
                        bg-linear-to-br
                        rounded-2xl
                        shrink-0 ${PALETTE[i % PALETTE.length]} items-center justify-center
                      `}
                    >
                      {group.name.charAt(0).toUpperCase()}
                    </div>

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <h3
                        className="
                          text-lg font-semibold text-gray-900
                          truncate
                        "
                      >
                        {group.name}
                      </h3>

                      {/* <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <Users size={14} />
                      <span>
                        {group.memberCount} member
                        {group.memberCount !== 1 ? "s" : ""}
                      </span>
                    </div> */}
                    </div>
                  </div>

                  {/* Edit/Delete */}
                  <div
                    className="
                      flex
                      items-center gap-1 shrink-0
                    "
                  >
                    <Button
                      onClick={() => {
                        setIsEditing(true);
                        setDialogOpen(true);
                        setEditingGroup(group);
                      }}
                      variant={"outline"}
                      className="
                        p-2
                        text-gray-400
                        rounded-xl
                        border-none
                        hover:text-emerald-500 hover:bg-emerald-50 transition
                      "
                    >
                      <Pencil size={15} />
                    </Button>
                    <Button
                      onClick={() =>
                        deletGroup({
                          businessId: business._id,
                          groupId: group._id,
                        })
                      }
                      variant={"outline"}
                      className="
                        p-2
                        text-gray-400
                        rounded-xl
                        border-none
                        hover:text-red-500 hover:bg-red-50 transition
                      "
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add group/edit group dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="
          max-w-sm
          p-7
          bg-white
          rounded-3xl border-0
          shadow-2xl
          gap-0
        "
        >
          <DialogHeader
            className="
            mb-5
          "
          >
            <DialogTitle
              className="
              text-lg font-bold text-gray-900
            "
            >
              {isEditing ? "Edit Group" : "Create Group"}
            </DialogTitle>
          </DialogHeader>

          <form
            action={(e) => {
              if (isEditing && editingGroup)
                return handleSubmit(e, true, editingGroup._id);
              return handleSubmit(e);
            }}
          >
            <div
              className="
              space-y-4
            "
            >
              <div>
                <Label
                  htmlFor="groupName"
                  className="
                  block
                  mb-1
                  text-xs font-semibold text-gray-500 tracking-wider
                  uppercase
                "
                >
                  Group Name{" "}
                  <span
                    className="
                    text-red-400
                  "
                  >
                    *
                  </span>
                </Label>

                <Input
                  id="groupName"
                  defaultValue={editingGroup ? editingGroup.name : ""}
                  name="name"
                  placeholder="e.g. Retail, VIP, Wholesale"
                  className="
                  h-11
                  px-4
                  text-sm
                  rounded-xl border-gray-200
                  placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-emerald-400
                "
                />
                {formError && (
                  <span
                    className="
                    text-xs text-red-500
                  "
                  >
                    *{formError}
                  </span>
                )}
              </div>

              <div
                className="
                flex
                pt-1
                gap-3
              "
              >
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="
                    flex-1
                    h-11
                    text-gray-600 font-semibold
                    rounded-xl border-gray-200
                    hover:bg-gray-50
                  "
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  type="submit"
                  className="
                  flex-1
                  h-11
                  font-semibold
                  bg-emerald-600
                  rounded-xl
                  hover:bg-emerald-700
                "
                >
                  {isEditing ? "Update Group" : "Create Group"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
