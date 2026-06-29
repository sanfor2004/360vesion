import { redirect } from "next/navigation";

/** The old gallery lives at /explore now. */
export default function ToursRedirect() {
  redirect("/explore");
}
