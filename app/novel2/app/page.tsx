import Editor from "@/ui/editor";
import Github from "@/ui/icons/github";
import Menu from "./menu";
import { Workspace } from "./workspace";

export default function Page() {
  return (
    <main className="items-left flex min-h-screen flex-col justify-between pl-20 pt-5">
      <Workspace />
    </main>
  );
}
