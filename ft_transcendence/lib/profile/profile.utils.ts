import type { ProfileFieldConfig } from "@/types/profile";

export const PROFILE_SECTIONS: {
  title: string;
  fields: ProfileFieldConfig[];
}[] = [
  {
    title: "Identity",
    fields: [
      { key: "displayName", label: "Display Name", editable: true },
      { key: "username", label: "Username", editable: true },
      { key: "email", label: "Email" },
    ],
  },
  {
    title: "Status",
    fields: [
      { key: "online", label: "Online" },
    ],
  },
  {
    title: "System",
    fields: [
      { key: "id", label: "User ID" },
      { key: "createdAt", label: "Created At" },
      { key: "updatedAt", label: "Updated At" },
    ],
  },
];
