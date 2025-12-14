export const State = {
  user: null,            // {email}
  role: "medewerker",    // medewerker | moderator
  page: "home",
  scanning: false,
  batchCarrier: null,

  inbound: {
    barcode: null,
    firstName: "",
    lastName: "",
    note: "",
    suggestedLoc: null,
    showManual: false,
    manual: { r:"", p:"", e:"", sub:"" },
  },

  pickup: {
    query: { first:"", last:"" },
    list: [],
    selected: null,
  },
};
