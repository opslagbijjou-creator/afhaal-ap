import { Timestamp } from "firebase-admin/firestore";

export interface PackageLocation {
  rack: number;
  position: number;
  level: number;
  display: string; // "1•2•3"
}

export interface PackageDoc {
  packageId: string;

  carrier?: string;
  labelCode?: string;
  customerName?: string;

  location?: PackageLocation | null;
  subNo?: number | null;

  status?: "STORED" | "PICKED_UP" | "REMOVED";

  receivedAt?: Timestamp;
  pickedUpAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}