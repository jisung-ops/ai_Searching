import { NextRequest, NextResponse } from "next/server";
import { trendingStore } from "@/lib/trending/store";
import { TimePeriod, TrendCategory, TrendingResponse } from "@/lib/trending/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as TimePeriod) || "24h";
    const category = (searchParams.get("category") as TrendCategory) || "all";

    const { items, totalQueriesTracked, infraMode } = trendingStore.getTrending(period, category);

    const response: TrendingResponse = {
      period,
      category,
      totalQueriesTracked,
      items,
      engineInfo: {
        algorithm: "Hacker News Time-Decay Gravity (γ=1.5, τ=3.0h)",
        decayFactor: 1.5,
        halfLifeHours: 3.0,
        clusteringMethod: "Phonetic Map + Stopwords Filter + Bigram Jaccard (Threshold: 0.6)",
        infraMode,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("GET /api/trending error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending rankings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category = "trend" } = body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters long" },
        { status: 400 }
      );
    }

    const recorded = trendingStore.recordQuery(query, category);

    return NextResponse.json({
      success: true,
      recorded,
    });
  } catch (error) {
    console.error("POST /api/trending error:", error);
    return NextResponse.json(
      { error: "Failed to record search query" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, reset } = body;

    if (reset) {
      trendingStore.resetToDefault();
      return NextResponse.json({ success: true, message: "Rankings reset to default" });
    }

    if (key) {
      const deleted = trendingStore.deleteKeyword(key);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: "Missing key or reset flag" }, { status: 400 });
  } catch (error) {
    console.error("DELETE /api/trending error:", error);
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
