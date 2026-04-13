import { redirect } from "next/navigation";

// Store page is temporarily deactivated.
// The original page content is preserved in git history for reactivation.
export default function StorePage() {
  redirect("/");
}
