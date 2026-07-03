const fs = require('fs');
let code = fs.readFileSync('src/lib/dbMock.ts', 'utf8');

const saveBlockedSlotCode = `
  saveBlockedSlot: (shopId: string, slot: Partial<BlockedSlot> & { id?: string }): BlockedSlot => {
    if (slot.id) {
      const current = dbMock.getBlockedSlotsRaw();
      const existing = current.find(s => s.id === slot.id && s.shop_id === shopId);
      if (!existing) throw new Error('Blocked slot not found');
      Object.assign(existing, slot);
      localStorage.setItem(KEYS.BLOCKED_SLOTS, JSON.stringify(current));
      return existing;
    } else {
      return dbMock.addBlockedSlot(shopId, slot as Omit<BlockedSlot, 'id' | 'shop_id'>);
    }
  },
`;

code = code.replace(
  "  deleteBlockedSlot: (shopId: string, slotId: string) => {",
  saveBlockedSlotCode + "  deleteBlockedSlot: (shopId: string, slotId: string) => {"
);
fs.writeFileSync('src/lib/dbMock.ts', code);
