import { redirect } from "next/navigation";

export default function LegacyPaymentGatewaySettingsPage() {
  redirect("/admin/payment-gateways");
}
