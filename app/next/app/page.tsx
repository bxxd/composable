import Image from "next/image";
import TipTap from "./components/TipTap";
import { Workspace } from "./workspace";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-left justify-between pt-5 p-24">
      <Workspace />
    </main>
  );
}
