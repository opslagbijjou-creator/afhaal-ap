export type Role = "moderator" | "medewerker";

export type Carrier =
  | "POSTNL" | "DHL" | "DPD" | "UPS" | "GLS" | "MONDIAL" | "VINTEDGO" | "OTHER";

export type PackageStatus = "RECEIVED" | "IN_STOCK" | "PICKED_UP" | "REMOVED" | "MISSING";

export type IdentifierType = "LABEL_BARCODE" | "CUSTOMER_CODE" | "OTHER";

export type PackageDoc = {
  carrier: Carrier;
  status: PackageStatus;
  customerName?: string;
  identifiers: { type: IdentifierType; value: string; source: "INTAKE" | "PICKUP" | "MANUAL"; scannedAt: FirebaseFirestore.Timestamp }[];
  location?: { rackNo: number; positionNo: number; levelNo: number; display: string };
  subNo?: number;
  receivedAt: FirebaseFirestore.Timestamp;
  pickedUpAt?: FirebaseFirestore.Timestamp;
  removedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;
};

export type RackDoc = {
  rackNo: number;
  levelsCount: number;
  positionsCount: number;
  label?: string;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;
};

export type EventDoc = {
  type: string;
  packageId: string;
  before?: any;
  after?: any;
  reason?: string;
  performedAt: FirebaseFirestore.Timestamp;
  performedBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  createdBy: string;
};
