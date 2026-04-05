import { Ionicons } from "@expo/vector-icons";
import { DARK_COLORS } from "./config";

export const WALLET_TYPE_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }
> = {
  cash: { icon: "cash-outline", label: "Tiền mặt", color: DARK_COLORS.success },
  bank: {
    icon: "business-outline",
    label: "Ngân hàng",
    color: DARK_COLORS.info,
  },
  e_wallet: {
    icon: "phone-portrait-outline",
    label: "Ví điện tử",
    color: DARK_COLORS.warning,
  },
  "e-wallet": {
    icon: "phone-portrait-outline",
    label: "Ví điện tử",
    color: DARK_COLORS.warning,
  },
  other: {
    icon: "card-outline",
    label: "Khác",
    color: DARK_COLORS.textSecondary,
  },
};
