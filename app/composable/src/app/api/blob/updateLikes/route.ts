import { NextResponse, NextRequest } from "next/server";
import { getDbInstance, releaseDbInstance } from "@/lib/db";

export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest) {
  const db = await getDbInstance();
  try {
    const data = await req.json();
    console.log("blob PATCH...");

    // Validate blobId and likeStatus from client payload
    if (!data.blobId || typeof data.likeStatus === "undefined") {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Convert likeStatus to number (increment or decrement)
    const likeIncrement = data.likeStatus ? 1 : -1;

    // Update the like count in the database
    const updateQuery =
      "UPDATE json_blobs SET likes = likes + $1 WHERE id = $2";
    await db.none(updateQuery, [likeIncrement, data.blobId]);

    return NextResponse.json({ success: true, message: "Like count updated" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await releaseDbInstance();
  }
}
