// import Image from "next/image";
// import TipTap from "./components/TipTap";
import { Workspace } from "./workspace";

export default function Home() {
    return (
        <main className="items-left flex min-h-screen flex-col justify-between pt-20 ">
        <Workspace />
        </main>
    );
}
